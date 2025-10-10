import { getDbClient } from '@/lib/db/client';
import { calculateSettlementBreakdown } from './settlements';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

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

// --- Custom Errors ---
export class ProjectNotFoundError extends Error {
  constructor(message = '프로젝트를 찾을 수 없습니다.') {
    super(message);
    this.name = 'ProjectNotFoundError';
  }
}

export class SettlementExistsError extends Error {
  constructor(message = '이미 정산이 진행 중입니다.') {
    super(message);
    this.name = 'SettlementExistsError';
  }
}

export class NoSuccessfulFundingsError extends Error {
  constructor(message = '성공한 펀딩이 없습니다.') {
    super(message);
    this.name = 'NoSuccessfulFundingsError';
  }
}

/**
 * 펀딩 공급 정산 레코드를 자동으로 생성하는 함수
 * 프로젝트가 목표 금액에 도달했을 때만 정산을 생성합니다
 */
export async function createSettlementIfTargetReached(
    projectId: string,
    platformFeeRate = 0.05,
    gatewayFeeOverride?: number,
    notes?: any
) {
    const db = await getDbClient();

    return db.transaction(async (tx) => {
        // 프로젝트 정보 조회
        const projectData = await tx.query.projects.findFirst({
            where: eq(projects.id, projectId),
            with: {
                partnerMatches: {
                    where: inArray(partnerMatches.status, ['ACCEPTED', 'COMPLETED']),
                },
                collaborators: true,
            },
        });

        if (!projectData) {
            throw new ProjectNotFoundError();
        }

        // 프로젝트가 목표 금액에 도달했는지 확인
        if (projectData.currentAmount < projectData.targetAmount) {
            return null; // 아직 목표 금액 도달하지 않음
        }

        // 이미 진행 중인 정산이 있는지 확인
        const existingSettlement = await tx.query.settlements.findFirst({
            where: and(
                eq(settlements.projectId, projectId),
                inArray(settlements.payoutStatus, ['PENDING', 'IN_PROGRESS'])
            ),
        });

        if (existingSettlement) {
            return existingSettlement; // 이미 정산이 진행 중
        }

        // 성공한 펀딩 데이터 조회
        const fundingsData = await tx.query.fundings.findMany({
            where: and(
                eq(fundings.projectId, projectId),
                eq(fundings.paymentStatus, 'SUCCEEDED')
            ),
            with: { paymentTransaction: true },
        });

        const totalRaised = fundingsData.reduce((acc, funding) => acc + funding.amount, 0);

        if (totalRaised <= 0) {
            throw new NoSuccessfulFundingsError();
        }

        // 게이트웨이 수수료 계산
        const inferredGatewayFees = fundingsData.reduce(
            (acc, funding) => acc + (funding.paymentTransaction?.gatewayFee ?? 0),
            0
        );

        // 파트너와 협력자 배분 비율 정규화
        const partnerShares = projectData.partnerMatches
            .filter((match) => typeof match.settlementShare === 'number')
            .map((match) => ({
                stakeholderId: match.partnerId,
                share: normaliseShare(match.settlementShare ?? 0)
            }))
            .filter((entry) => entry.share > 0);

        const collaboratorShares = projectData.collaborators
            .filter((collab) => typeof collab.share === 'number')
            .map((collab) => ({
                stakeholderId: collab.userId,
                share: normaliseShare(collab.share ?? 0, true)
            }))
            .filter((entry) => entry.share > 0);

        // 정산 계산
        const breakdown = calculateSettlementBreakdown({
            totalRaised,
            platformFeeRate,
            gatewayFees: gatewayFeeOverride ?? inferredGatewayFees,
            partnerShares,
            collaboratorShares
        });

        // 정산 레코드 생성
        const [created] = await tx
            .insert(settlements)
            .values({
                id: randomUUID(),
                projectId,
                totalRaised: breakdown.totalRaised,
                platformFee: breakdown.platformFee,
                creatorShare: breakdown.creatorShare,
                partnerShare: breakdown.partners.reduce((sum, p) => sum + p.amount, 0),
                collaboratorShare: breakdown.collaborators.reduce((sum, c) => sum + c.amount, 0),
                gatewayFees: breakdown.gatewayFees,
                netAmount: breakdown.netAmount,
                payoutStatus: 'PENDING',
                distributionBreakdown: breakdown as any, // TODO: Define proper type for distributionBreakdown
                notes: notes ?? null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
            .returning();

        // 정산 배분 레코드 생성
        const payoutPayload = [
            {
                stakeholderType: 'PLATFORM' as const,
                stakeholderId: null,
                amount: breakdown.platformFee,
                percentage: breakdown.totalRaised > 0 ? breakdown.platformFee / breakdown.totalRaised : 0
            },
            {
                stakeholderType: 'CREATOR' as const,
                stakeholderId: projectData.ownerId,
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
                    id: randomUUID(),
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
}

/**
 * 펀딩과 정산 데이터의 일치성을 검증하는 함수
 */
export async function validateFundingSettlementConsistency(projectId: string, tx: any) {
    try {
        const db = tx || getDbClient();
        
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId)
        });

        if (!project) {
            throw new ProjectNotFoundError();
        }

        // 성공한 펀딩 금액 조회
        const fundingsData = await db.query.fundings.findMany({
            where: and(
                eq(fundings.projectId, projectId),
                eq(fundings.paymentStatus, 'SUCCEEDED')
            )
        });

        // 정산 데이터 조회
        const settlementsData = await db.query.settlements.findFirst({
            where: eq(settlements.projectId, projectId),
            orderBy: desc(settlements.createdAt)
        });

        const totalFundingAmount = fundingsData.reduce((acc, funding) => acc + funding.amount, 0);
        const latestSettlement = settlementsData;

        const issues: string[] = [];

        // 현재 금액과 프로젝트 currentAmount 확인
        if (project.currentAmount !== totalFundingAmount) {
            issues.push(`프로젝트 currentAmount(${project.currentAmount})와 실제 펀딩금액(${totalFundingAmount})이 일치하지 않습니다.`);
        }

        // 정산 금액과 펀딩금액 일치 확인
        if (latestSettlement && latestSettlement.totalRaised !== totalFundingAmount) {
            issues.push(`최신 정산 금액(${latestSettlement.totalRaised})과 펀딩금액(${totalFundingAmount})이 일치하지 않습니다.`);
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
 * 펀딩 데이터를 안전하게 업데이트하는 함수
 */
export async function updateProjectAmount(
    projectId: string,
    amount: number,
    updateProjectAmount = true
) {
    const db = await getDbClient();
    return db.transaction(async (tx) => {
        // 프로젝트 금액 업데이트
        if (updateProjectAmount) {
            await tx
                .update(projects)
                .set({ 
                    currentAmount: amount, // increment 대신 직접 설정
                    updatedAt: new Date().toISOString()
                })
                .where(eq(projects.id, projectId));
        }

        // 정산 자동 생성 시도
        const settlement = await createSettlementIfTargetReached(projectId);

        return { settlement };
    });
}

/**
 * 배분 비율 정규화 함수
 */
function normaliseShare(value: number, hundredScale = false) {
    if (!Number.isFinite(value) || value <= 0) {
        return 0;
    }

    const normalised = hundredScale ? value / 100 : value;
    return normalised > 1 ? normalised / 100 : normalised;
}
