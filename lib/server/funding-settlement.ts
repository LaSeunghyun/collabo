import { db } from '@/lib/drizzle';
import { 
  projects, 
  fundings, 
  settlements, 
  settlementPayouts, 
  projectCollaborators, 
  partnerMatches
} from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { calculateSettlementBreakdown } from './settlements';

// Drizzle enum values
const SettlementPayoutStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  PAID: 'PAID',
} as const;

const FundingStatus = {
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
} as const;

type SettlementPayoutStatus = typeof SettlementPayoutStatus[keyof typeof SettlementPayoutStatus];
type FundingStatus = typeof FundingStatus[keyof typeof FundingStatus];

export interface FundingSettlementData {
    projectId: string;
    userId: string;
    amount: number;
    currency: string;
    paymentIntentId: string;
    snapshot: unknown;
}

export interface SettlementCreationParams {
    projectId: string;
    platformFeeRate?: number;
    gatewayFeeOverride?: number;
    notes?: any;
}

/**
 * ?�???�공 ???�산 ?�이?��? ?�동?�로 ?�성?�는 ?�수
 * ?�로?�트가 목표 금액???�성?�을 ?�만 ?�산???�성?�니??
 */
export async function createSettlementIfTargetReached(
    projectId: string,
    platformFeeRate = 0.05,
    gatewayFeeOverride?: number,
    notes?: any
) {
    const project = await db
        .select({
            id: projects.id,
            targetAmount: projects.targetAmount,
            currentAmount: projects.currentAmount,
            status: projects.status,
            ownerId: projects.ownerId
        })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

    if (project.length === 0) {
        throw new Error('?�로?�트�?찾을 ???�습?�다.');
    }

    const projectData = project[0];

    // ?�로?�트가 목표 금액???�성?�는지 ?�인
    if (projectData.currentAmount < projectData.targetAmount) {
        return null; // ?�직 목표 금액 ?�성?��? ?�음
    }

    // ?��? 진행 중인 ?�산???�는지 ?�인
    const existingSettlement = await db
        .select()
        .from(settlements)
        .leftJoin(settlementPayouts, eq(settlements.id, settlementPayouts.settlementId))
        .where(and(
            eq(settlements.projectId, projectId),
            eq(settlementPayouts.status, SettlementPayoutStatus.PENDING)
        ))
        .limit(1);

    if (existingSettlement.length > 0) {
        return existingSettlement[0].settlements; // ?��? ?�산??진행 �?
    }

    // ?�공???�???�이??조회
    const fundingData = await db
        .select({
            amount: fundings.amount,
            metadata: fundings.metadata,
        })
        .from(fundings)
        .where(and(
            eq(fundings.projectId, projectId),
            eq(fundings.paymentStatus, FundingStatus.SUCCEEDED)
        ));

    const totalRaised = fundingData.reduce((acc, funding) => acc + funding.amount, 0);

    if (totalRaised <= 0) {
        throw new Error('?�공???�???�역???�습?�다.');
    }

    // 게이?�웨???�수�?계산 (metadata?�서 추출)
    const inferredGatewayFees = fundingData.reduce(
        (acc, funding) => {
            const metadata = funding.metadata as any;
            return acc + (metadata?.gatewayFee ?? 0);
        },
        0
    );

    // ?�트??�??�력???�보 조회
    const [partnerData, collaboratorData] = await Promise.all([
        db
            .select({
                partnerId: partnerMatches.partnerId,
                settlementShare: partnerMatches.settlementShare,
            })
            .from(partnerMatches)
            .where(eq(partnerMatches.projectId, projectId)),
        db
            .select({
                userId: projectCollaborators.userId,
                share: projectCollaborators.share,
            })
            .from(projectCollaborators)
            .where(eq(projectCollaborators.projectId, projectId)),
    ]);

    // ?�트??�??�력??배분 비율 ?�규??
    const partnerShares = partnerData
        .filter((match) => typeof match.settlementShare === 'number')
        .map((match) => ({
            stakeholderId: match.partnerId,
            share: normaliseShare(Number(match.settlementShare) ?? 0)
        }))
        .filter((entry) => entry.share > 0);

    const collaboratorShares = collaboratorData
        .filter((collab) => typeof collab.share === 'number')
        .map((collab) => ({
            stakeholderId: collab.userId,
            share: normaliseShare(collab.share ?? 0, true)
        }))
        .filter((entry) => entry.share > 0);

    // ?�산 계산
    const breakdown = calculateSettlementBreakdown({
        totalRaised,
        platformFeeRate,
        gatewayFees: gatewayFeeOverride ?? inferredGatewayFees,
        partnerShares,
        collaboratorShares
    });

    // ?�산 ?�코???�성
    const [created] = await db
        .insert(settlements)
        .values({
            projectId,
            totalAmount: breakdown.totalRaised,
            platformFee: breakdown.platformFee,
            netAmount: breakdown.netAmount,
            status: "PENDING",
            metadata: {
                breakdown: breakdown as any,
                notes: notes ?? null
            }
        })
        .returning();

    // ?�산 배분 ?�코???�성
    const payoutPayload = [
        {
            stakeholderType: 'PLATFORM' as const,
            stakeholderId: 'platform',
            amount: breakdown.platformFee,
        },
        {
            stakeholderType: 'CREATOR' as const,
            stakeholderId: projectData.ownerId,
            amount: breakdown.creatorShare,
        },
        ...breakdown.partners.map((partner) => ({
            stakeholderType: 'PARTNER' as const,
            stakeholderId: partner.stakeholderId,
            amount: partner.amount,
        })),
        ...breakdown.collaborators.map((collaborator) => ({
            stakeholderType: 'COLLABORATOR' as const,
            stakeholderId: collaborator.stakeholderId,
            amount: collaborator.amount,
        }))
    ].filter((payout) => payout.amount > 0);

    if (payoutPayload.length > 0) {
        await db
            .insert(settlementPayouts)
            .values(
                payoutPayload.map((payout) => ({
                    settlementId: created.id,
                    stakeholderType: payout.stakeholderType,
                    stakeholderId: payout.stakeholderId,
                    amount: payout.amount,
                    status: SettlementPayoutStatus.PENDING,
                }))
            );
    }

    return created;
}

/**
 * ?�?�과 ?�산 ?�이?�의 ?��??�을 검증하???�수
 */
export async function validateFundingSettlementConsistency(projectId: string) {
    const [projectData, fundingData, settlementData] = await Promise.all([
        db
            .select({
                currentAmount: projects.currentAmount,
            })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1),
        db
            .select({
                amount: fundings.amount,
            })
            .from(fundings)
            .where(and(
                eq(fundings.projectId, projectId),
                eq(fundings.paymentStatus, FundingStatus.SUCCEEDED)
            )),
        db
            .select({
                netAmount: settlements.netAmount,
            })
            .from(settlements)
            .where(eq(settlements.projectId, projectId))
            .orderBy(desc(settlements.createdAt))
            .limit(1),
    ]);

    if (projectData.length === 0) {
        throw new Error('?�로?�트�?찾을 ???�습?�다.');
    }

    const project = projectData[0];
    const totalFundingAmount = fundingData.reduce((acc, funding) => acc + funding.amount, 0);
    const latestSettlement = settlementData[0];

    const issues: string[] = [];

    // ?�??금액�??�로?�트 currentAmount ?�치 ?�인
    if (project.currentAmount !== totalFundingAmount) {
        issues.push(`?�로?�트 currentAmount(${project.currentAmount})?� ?�제 ?�??금액(${totalFundingAmount})???�치?��? ?�습?�다.`);
    }

    // ?�산 금액�??�??금액 ?�치 ?�인
    if (latestSettlement && latestSettlement.netAmount !== totalFundingAmount) {
        issues.push(`최신 ?�산 금액(${latestSettlement.netAmount})�??�??금액(${totalFundingAmount})???�치?��? ?�습?�다.`);
    }

    return {
        isValid: issues.length === 0,
        issues
    };
}

/**
 * ?�???�이?��? ?�전?�게 ?�데?�트?�는 ?�수
 */
export async function safeUpdateFundingData(
    projectId: string,
    amount: number,
    updateProjectAmount = true
) {
    // ?�???�이???�데?�트
    if (updateProjectAmount) {
        await db
            .update(projects)
            .set({ 
                currentAmount: sql`${projects.currentAmount} + ${amount}`,
                updatedAt: new Date()
            })
            .where(eq(projects.id, projectId));
    }

    // ?�산 ?�동 ?�성 ?�도
    const settlement = await createSettlementIfTargetReached(projectId);

    return { settlement };
}

/**
 * 배분 비율 ?�규???�수
 */
function normaliseShare(value: number, hundredScale = false) {
    if (!Number.isFinite(value) || value <= 0) {
        return 0;
    }

    const normalised = hundredScale ? value / 100 : value;
    return normalised > 1 ? normalised / 100 : normalised;
}
