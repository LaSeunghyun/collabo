import { getDb } from '@/lib/db/client';
import { calculateSettlementBreakdown } from './settlements';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { 
  projects, 
  fundings, 
  settlements, 
  settlementPayouts, 
  partnerMatches, 
  projectCollaborators,
  paymentTransactions
} from '@/lib/db/schema';

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
    try {
        // ?�로?�트 ?�보 조회
        const [projectData] = await db
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

        if (!projectData) {
            throw new Error('?�로?�트�?찾을 ???�습?�다.');
        }

        // ?�트??매치 ?�보 조회
        const partnerMatchesData = await db
            .select({
                partnerId: partnerMatches.partnerId,
                settlementShare: partnerMatches.settlementShare,
                status: partnerMatches.status
            })
            .from(partnerMatches)
            .where(and(
                eq(partnerMatches.projectId, projectId),
                inArray(partnerMatches.status, ['ACCEPTED', 'COMPLETED'])
            ));

        // ?�력???�보 조회
        const collaboratorsData = await db
            .select({
                userId: projectCollaborators.userId,
                share: projectCollaborators.share
            })
            .from(projectCollaborators)
            .where(eq(projectCollaborators.projectId, projectId));

        const project = {
            ...projectData,
            partnerMatches: partnerMatchesData,
            collaborators: collaboratorsData
        };

        // ?�로?�트가 목표 금액???�성?�는지 ?�인
        if (project.currentAmount < project.targetAmount) {
            return null; // ?�직 목표 금액 ?�성?��? ?�음
        }

        // ?��? 진행 중인 ?�산???�는지 ?�인
        const [existingSettlement] = await db
            .select()
            .from(settlements)
            .where(and(
                eq(settlements.projectId, projectId),
                inArray(settlements.payoutStatus, ['PENDING', 'IN_PROGRESS'])
            ))
            .limit(1);

        if (existingSettlement) {
            return existingSettlement; // ?��? ?�산??진행 �?
        }

        // ?�공???�???�이??조회
        const fundingsData = await db
            .select({
                amount: fundings.amount,
                gatewayFee: paymentTransactions.gatewayFee
            })
            .from(fundings)
            .leftJoin(paymentTransactions, eq(fundings.paymentIntentId, paymentTransactions.id))
            .where(and(
                eq(fundings.projectId, projectId),
                eq(fundings.paymentStatus, 'SUCCEEDED')
            ));

        const totalRaised = fundingsData.reduce((acc, funding) => acc + funding.amount, 0);

        if (totalRaised <= 0) {
            throw new Error('?�공???�???�역???�습?�다.');
        }

        // 게이?�웨???�수�?계산
        const inferredGatewayFees = fundingsData.reduce(
            (acc, funding) => acc + (funding.gatewayFee ?? 0),
            0
        );

    // ?�트??�??�력??배분 비율 ?�규??
    const partnerShares = project.partnerMatches
        .filter((match) => typeof match.settlementShare === 'number')
        .map((match) => ({
            stakeholderId: match.partnerId,
            share: normaliseShare(match.settlementShare ?? 0)
        }))
        .filter((entry) => entry.share > 0);

    const collaboratorShares = project.collaborators
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
        const db = await getDb();
        const settlement = await db.transaction(async (tx) => {
            const [created] = await tx
                .insert(settlements)
                .values({
                    id: crypto.randomUUID(),
                    projectId,
                    totalRaised: breakdown.totalRaised,
                    platformFee: breakdown.platformFee,
                    creatorShare: breakdown.creatorShare,
                    partnerShare: breakdown.partnerShareTotal,
                    collaboratorShare: breakdown.collaboratorShareTotal,
                    gatewayFees: breakdown.gatewayFees,
                    netAmount: breakdown.netAmount,
                    payoutStatus: 'PENDING',
                    distributionBreakdown: breakdown as any,
                    notes: notes ?? null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
                .returning();

            // ?�산 배분 ?�코???�성
            const payoutPayload = [
                {
                    stakeholderType: 'PLATFORM' as const,
                    stakeholderId: null,
                    amount: breakdown.platformFee,
                    percentage: breakdown.totalRaised > 0 ? breakdown.platformFee / breakdown.totalRaised : 0
                },
                {
                    stakeholderType: 'CREATOR' as const,
                    stakeholderId: project.ownerId,
                    amount: breakdown.creatorShare,
                    percentage: breakdown.totalRaised > 0 ? breakdown.creatorShare / breakdown.totalRaised : 0
                },
                ...breakdown.partners.map((partner) => ({
                    stakeholderType: 'PARTNER' as const,
                    stakeholderId: partner.stakeholderId,
                    amount: partner.amount,
                    percentage: partner.percentage
                })),
                ...breakdown.collaborators.map((collaborator) => ({
                    stakeholderType: 'COLLABORATOR' as const,
                    stakeholderId: collaborator.stakeholderId,
                    amount: collaborator.amount,
                    percentage: collaborator.percentage
                }))
            ].filter((payout) => payout.amount > 0);

            await Promise.all(
                payoutPayload.map((payout) =>
                    tx.insert(settlementPayouts).values({
                        id: crypto.randomUUID(),
                        settlementId: created.id,
                        stakeholderType: payout.stakeholderType,
                        stakeholderId: payout.stakeholderId,
                        amount: payout.amount,
                        percentage: payout.percentage,
                        status: 'PENDING',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    })
                )
            );

            return created;
        });

        return settlement;
    } catch (error) {
        console.error('Failed to create settlement:', error);
        throw error;
    }
}

/**
 * ?�?�과 ?�산 ?�이?�의 ?��??�을 검증하???�수
 */
export async function validateFundingSettlementConsistency(projectId: string) {
    try {
        const [project] = await db
            .select({
                currentAmount: projects.currentAmount
            })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

        if (!project) {
            throw new Error('?�로?�트�?찾을 ???�습?�다.');
        }

        // ?�공???�??금액 조회
        const fundingsData = await db
            .select({ amount: fundings.amount })
            .from(fundings)
            .where(and(
                eq(fundings.projectId, projectId),
                eq(fundings.paymentStatus, 'SUCCEEDED')
            ));

        // ?�산 ?�이??조회
        const settlementsData = await db
            .select({ totalRaised: settlements.totalRaised })
            .from(settlements)
            .where(eq(settlements.projectId, projectId))
            .orderBy(desc(settlements.createdAt))
            .limit(1);

        const totalFundingAmount = fundingsData.reduce((acc, funding) => acc + funding.amount, 0);
        const latestSettlement = settlementsData[0];

        const issues: string[] = [];

        // ?�??금액�??�로?�트 currentAmount ?�치 ?�인
        if (project.currentAmount !== totalFundingAmount) {
            issues.push(`?�로?�트 currentAmount(${project.currentAmount})?� ?�제 ?�??금액(${totalFundingAmount})???�치?��? ?�습?�다.`);
        }

        // ?�산 금액�??�??금액 ?�치 ?�인
        if (latestSettlement && latestSettlement.totalRaised !== totalFundingAmount) {
            issues.push(`최신 ?�산 금액(${latestSettlement.totalRaised})�??�??금액(${totalFundingAmount})???�치?��? ?�습?�다.`);
        }

        return {
            isValid: issues.length === 0,
            issues
        };
    } catch (error) {
        console.error('Failed to validate funding settlement consistency:', error);
        throw error;
    }
}

/**
 * ?�???�이?��? ?�전?�게 ?�데?�트?�는 ?�수
 */
export async function safeUpdateFundingData(
    projectId: string,
    amount: number,
    updateProjectAmount = true
) {
    try {
        const db = await getDb();
        return await db.transaction(async (tx) => {
            // ?�???�이???�데?�트
            if (updateProjectAmount) {
                await tx
                    .update(projects)
                    .set({ 
                        currentAmount: amount, // increment ?�??직접 ?�정
                        updatedAt: new Date().toISOString()
                    })
                    .where(eq(projects.id, projectId));
            }

            // ?�산 ?�동 ?�성 ?�도
            const settlement = await createSettlementIfTargetReached(projectId);

            return { settlement };
        });
    } catch (error) {
        console.error('Failed to update funding data:', error);
        throw error;
    }
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
