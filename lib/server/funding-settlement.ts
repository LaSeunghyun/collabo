import { Prisma, FundingStatus, ProjectStatus, SettlementPayoutStatus } from '@/types/prisma';
import { prisma } from '@/lib/prisma';
import { calculateSettlementBreakdown } from './settlements';

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
 * 프로젝트가 목표 금액을 달성했을 때만 정산을 생성합니다.
 */
export async function createSettlementIfTargetReached(
    projectId: string,
    platformFeeRate = 0.05,
    gatewayFeeOverride?: number,
    notes?: any
) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            id: true,
            targetAmount: true,
            currentAmount: true,
            status: true,
            ownerId: true,
            partnerMatches: {
                where: {
                    status: {
                        in: ['ACCEPTED', 'COMPLETED']
                    }
                },
                select: { partnerId: true, settlementShare: true }
            },
            collaborators: {
                select: { userId: true, share: true }
            }
        }
    });

    if (!project) {
        throw new Error('프로젝트를 찾을 수 없습니다.');
    }

    // 프로젝트가 목표 금액을 달성했는지 확인
    if (project.currentAmount < project.targetAmount) {
        return null; // 아직 목표 금액 달성하지 않음
    }

    // 이미 진행 중인 정산이 있는지 확인
    const existingSettlement = await prisma.settlement.findFirst({
        where: {
            projectId,
            payoutStatus: {
                in: [SettlementPayoutStatus.PENDING, SettlementPayoutStatus.IN_PROGRESS]
            }
        }
    });

    if (existingSettlement) {
        return existingSettlement; // 이미 정산이 진행 중
    }

    // 성공한 펀딩 데이터 조회
    const fundings = await prisma.funding.findMany({
        where: {
            projectId,
            paymentStatus: FundingStatus.SUCCEEDED
        },
        select: {
            amount: true,
            transaction: {
                select: { gatewayFee: true }
            }
        }
    });

    const totalRaised = fundings.reduce((acc, funding) => acc + funding.amount, 0);

    if (totalRaised <= 0) {
        throw new Error('성공한 펀딩 내역이 없습니다.');
    }

    // 게이트웨이 수수료 계산
    const inferredGatewayFees = fundings.reduce(
        (acc, funding) => acc + (funding.transaction?.gatewayFee ?? 0),
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
    const settlement = await prisma.$transaction(async (tx) => {
        const created = await tx.settlement.create({
            data: {
                projectId,
                totalRaised: breakdown.totalRaised,
                platformFee: breakdown.platformFee,
                creatorShare: breakdown.creatorShare,
                partnerShare: breakdown.partnerShareTotal,
                collaboratorShare: breakdown.collaboratorShareTotal,
                gatewayFees: breakdown.gatewayFees,
                netAmount: breakdown.netAmount,
                payoutStatus: SettlementPayoutStatus.PENDING,
                distributionBreakdown: breakdown as any,
                notes: notes ?? null
            }
        });

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
                tx.settlementPayout.create({
                    data: {
                        settlementId: created.id,
                        stakeholderType: payout.stakeholderType,
                        stakeholderId: payout.stakeholderId,
                        amount: payout.amount,
                        percentage: payout.percentage,
                        status: SettlementPayoutStatus.PENDING
                    }
                })
            )
        );

        return created;
    });

    return settlement;
}

/**
 * 펀딩과 정산 데이터의 일관성을 검증하는 함수
 */
export async function validateFundingSettlementConsistency(projectId: string) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            currentAmount: true,
            fundings: {
                where: { paymentStatus: FundingStatus.SUCCEEDED },
                select: { amount: true }
            },
            settlements: {
                select: { totalRaised: true }
            }
        }
    });

    if (!project) {
        throw new Error('프로젝트를 찾을 수 없습니다.');
    }

    const totalFundingAmount = project.fundings.reduce((acc, funding) => acc + funding.amount, 0);
    const latestSettlement = project.settlements[0];

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
}

/**
 * 펀딩 데이터를 안전하게 업데이트하는 함수
 */
export async function safeUpdateFundingData(
    projectId: string,
    amount: number,
    updateProjectAmount = true
) {
    return prisma.$transaction(async (tx) => {
        // 펀딩 데이터 업데이트
        if (updateProjectAmount) {
            await tx.project.update({
                where: { id: projectId },
                data: { currentAmount: { increment: amount } }
            });
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
