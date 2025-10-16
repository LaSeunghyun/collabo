import { getDb } from '@/lib/db/client';
import { calculateSettlementBreakdown } from './settlements';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
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
 * 펀딩 성공 후 정산 데이터를 자동으로 생성하는 함수
 * 
 * 이 함수는 프로젝트가 목표 금액을 달성했을 때만 정산을 생성합니다.
 * 정산 생성 과정:
 * 1. 프로젝트 정보 및 상태 확인
 * 2. 파트너 매치 및 협업자 정보 조회
 * 3. 성공한 펀딩 데이터 집계
 * 4. 정산 배분 계산 (플랫폼 수수료, 크리에이터, 파트너, 협업자)
 * 5. 정산 레코드 및 배분 상세 내역 생성
 * 
 * @param projectId - 정산을 생성할 프로젝트 ID
 * @param platformFeeRate - 플랫폼 수수료율 (기본값: 0.05 = 5%)
 * @param gatewayFeeOverride - 게이트웨이 수수료 오버라이드 (선택사항)
 * @param notes - 정산 관련 메모 (선택사항)
 * @returns 생성된 정산 데이터 또는 null (목표 미달성 시)
 */
export async function createSettlementIfTargetReached(
    projectId: string,
    platformFeeRate = 0.05,
    gatewayFeeOverride?: number,
    notes?: any
) {
    try {
        const db = await getDb();

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

        // 프로젝트가 목표 금액을 달성했는지 확인
        if (project.currentAmount < project.targetAmount) {
            return null; // 아직 목표 금액 달성하지 않음
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

        const totalRaised = fundingsData.reduce((acc: number, funding: { amount: number }) => acc + funding.amount, 0);

        if (totalRaised <= 0) {
            throw new Error('성공한 펀딩 내역이 없습니다.');
        }

        // 게이트웨이 수수료 계산
        const inferredGatewayFees = fundingsData.reduce(
            (acc: number, funding: { gatewayFee?: number | null }) => acc + (funding.gatewayFee ?? 0),
            0
        );

        // 파트너 및 협력자 배분 비율 정규화
        const partnerShares = project.partnerMatches
            .filter((match: { settlementShare: unknown }) => typeof match.settlementShare === 'number')
            .map((match: { partnerId: string; settlementShare: number | null }) => ({
                stakeholderId: match.partnerId,
                share: normaliseShare(match.settlementShare ?? 0)
            }))
            .filter((entry: { share: number }) => entry.share > 0);

        const collaboratorShares = project.collaborators
            .filter((collab: { share: unknown }) => typeof collab.share === 'number')
            .map((collab: { userId: string; share: number | null }) => ({
                stakeholderId: collab.userId,
                share: normaliseShare(collab.share ?? 0, true)
            }))
            .filter((entry: { share: number }) => entry.share > 0);

        // 정산 계산
        const breakdown = calculateSettlementBreakdown({
            totalRaised,
            platformFeeRate,
            gatewayFees: gatewayFeeOverride ?? inferredGatewayFees,
            partnerShares,
            collaboratorShares
        });

        // 정산 레코드 생성
        const settlement = await db.transaction(async (tx: any) => {
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
 * 펀딩과 정산 데이터의 일관성을 검증하는 함수
 * 
 * 이 함수는 다음과 같은 데이터 일관성을 검증합니다:
 * 1. 프로젝트의 currentAmount와 실제 펀딩 금액의 일치 여부
 * 2. 최신 정산 금액과 펀딩 금액의 일치 여부
 * 
 * 데이터 불일치가 발견되면 issues 배열에 상세한 문제점을 기록합니다.
 * 
 * @param projectId - 검증할 프로젝트 ID
 * @returns 일관성 검증 결과와 발견된 문제점 목록
 */
export async function validateFundingSettlementConsistency(projectId: string) {
    try {
        const db = await getDb();
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

        const totalFundingAmount = fundingsData.reduce((acc: number, funding: { amount: number }) => acc + funding.amount, 0);
        const latestSettlement = settlementsData[0];

        const issues: string[] = [];

        // 펀딩 금액과 프로젝트 currentAmount 일치 확인
        if (project.currentAmount !== totalFundingAmount) {
            issues.push(`프로젝트 currentAmount(${project.currentAmount})와 실제 펀딩 금액(${totalFundingAmount})이 일치하지 않습니다.`);
        }

        // 정산 금액과 펀딩 금액 일치 확인
        if (latestSettlement && latestSettlement.totalRaised !== totalFundingAmount) {
            issues.push(`최신 정산 금액(${latestSettlement.totalRaised})과 펀딩 금액(${totalFundingAmount})이 일치하지 않습니다.`);
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
 * 
 * 이 함수는 펀딩 데이터 업데이트와 정산 자동 생성을 트랜잭션으로 처리합니다.
 * 
 * 처리 과정:
 * 1. 프로젝트의 currentAmount 업데이트 (선택사항)
 * 2. 목표 금액 달성 시 정산 자동 생성 시도
 * 
 * @param projectId - 업데이트할 프로젝트 ID
 * @param amount - 새로운 펀딩 금액
 * @param updateProjectAmount - 프로젝트 금액 업데이트 여부 (기본값: true)
 * @returns 업데이트 결과 및 생성된 정산 정보
 */
export async function safeUpdateFundingData(
    projectId: string,
    amount: number,
    updateProjectAmount = true
) {
    try {
        const db = await getDb();
        return await db.transaction(async (tx: any) => {
            // 펀딩 데이터 업데이트
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
 * 
 * 파트너 및 협업자의 배분 비율을 정규화합니다.
 * 
 * 정규화 규칙:
 * - 0 이하의 값은 0으로 처리
 * - hundredScale이 true인 경우: 100으로 나누어 소수점 비율로 변환
 * - hundredScale이 false인 경우: 1보다 큰 값은 100으로 나누어 정규화
 * 
 * @param value - 정규화할 배분 비율 값
 * @param hundredScale - 100 단위 스케일 여부 (기본값: false)
 * @returns 정규화된 배분 비율 (0-1 사이의 값)
 */
function normaliseShare(value: number, hundredScale = false) {
    if (!Number.isFinite(value) || value <= 0) {
        return 0;
    }

    const normalised = hundredScale ? value / 100 : value;
    return normalised > 1 ? normalised / 100 : normalised;
}
