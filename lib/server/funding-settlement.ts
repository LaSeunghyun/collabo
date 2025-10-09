import { getDbClient } from '@/lib/db/client';
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
import { randomUUID } from 'crypto';

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
 * 펀딩 성공 시 정산 레코드를 자동으로 생성하는 함수
 * 프로젝트가 목표 금액에 도달할 때만 정산을 생성합니다
 */
export async function createSettlementIfTargetReached(
    projectId: string,
    platformFeeRate = 0.05,
    gatewayFeeOverride?: number,
    notes?: any
) {
    try {
        const db = await getDbClient();
        
        // 프로젝트 정보 조회
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
            throw new Error('프로젝트를 찾을 수 없습니다.');
        }

        // 파트너 매치 정보 조회
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

        // 협력자 정보 조회
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

        // 프로젝트가 목표 금액에 도달했는지 확인
        if (project.currentAmount < project.targetAmount) {
            return null; // 아직 목표 금액 도달하지 않음
        }

        // 이미 진행 중인 정산이 있는지 확인
        const [existingSettlement] = await db
            .select()
            .from(settlements)
            .where(and(
                eq(settlements.projectId, projectId),
                inArray(settlements.payoutStatus, ['PENDING', 'IN_PROGRESS'])
            ))
            .limit(1);

        if (existingSettlement) {
            return existingSettlement; // 이미 정산이 진행 중
        }

        // 성공한 펀딩 데이터 조회
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
            throw new Error('성공한 펀딩이 없습니다.');
        }

        // 게이트웨이 수수료 계산
        const inferredGatewayFees = fundingsData.reduce(
            (acc, funding) => acc + (funding.gatewayFee ?? 0),
            0
        );

        // 파트너 및 협력자 배분 비율 정규화
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

        // 정산 계산
        const breakdown = calculateSettlementBreakdown({
            totalRaised,
            platformFeeRate,
            gatewayFees: gatewayFeeOverride ?? inferredGatewayFees,
            partnerShares,
            collaboratorShares
        });

        // 정산 레코드 생성
        const settlement = await db.transaction(async (tx) => {
            const [created] = await tx
                .insert(settlements)
                .values({
                    id: randomUUID(),
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

        return settlement;
    } catch (error) {
        console.error('Failed to create settlement:', error);
        throw error;
    }
}

/**
 * 펀딩과 정산 데이터의 일치성을 검증하는 함수
 */
export async function validateFundingSettlementConsistency(projectId: string) {
    try {
        const db = await getDbClient();
        
        const [project] = await db
            .select({
                currentAmount: projects.currentAmount
            })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

        if (!project) {
            throw new Error('프로젝트를 찾을 수 없습니다.');
        }

        // 성공한 펀딩 금액 조회
        const fundingsData = await db
            .select({ amount: fundings.amount })
            .from(fundings)
            .where(and(
                eq(fundings.projectId, projectId),
                eq(fundings.paymentStatus, 'SUCCEEDED')
            ));

        // 정산 데이터 조회
        const settlementsData = await db
            .select({ totalRaised: settlements.totalRaised })
            .from(settlements)
            .where(eq(settlements.projectId, projectId))
            .orderBy(desc(settlements.createdAt))
            .limit(1);

        const totalFundingAmount = fundingsData.reduce((acc, funding) => acc + funding.amount, 0);
        const latestSettlement = settlementsData[0];

        const issues: string[] = [];

        // 실제 금액과 프로젝트 currentAmount 값 확인
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
    try {
        const db = await getDbClient();
        return await db.transaction(async (tx) => {
            // 프로젝트 데이터 업데이트
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
    } catch (error) {
        console.error('Failed to update funding data:', error);
        throw error;
    }
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