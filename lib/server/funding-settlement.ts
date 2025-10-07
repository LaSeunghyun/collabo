import { FundingStatus, SettlementPayoutStatus } from '@/types/auth';
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
 * ?�???�공 ???�산 ?�이?��? ?�동?�로 ?�성?�는 ?�수
 * ?�로?�트가 목표 금액???�성?�을 ?�만 ?�산???�성?�니??
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
        throw new Error('?�로?�트�?찾을 ???�습?�다.');
    }

    // ?�로?�트가 목표 금액???�성?�는지 ?�인
    if (project.currentAmount < project.targetAmount) {
        return null; // ?�직 목표 금액 ?�성?��? ?�음
    }

    // ?��? 진행 중인 ?�산???�는지 ?�인
    const existingSettlement = await prisma.settlement.findFirst({
        where: {
            projectId,
            payoutStatus: {
                in: [SettlementPayoutStatus.PENDING, SettlementPayoutStatus.IN_PROGRESS]
            }
        }
    });

    if (existingSettlement) {
        return existingSettlement; // ?��? ?�산??진행 �?
    }

    // ?�공???�???�이??조회
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
        throw new Error('?�공???�???�역???�습?�다.');
    }

    // 게이?�웨???�수�?계산
    const inferredGatewayFees = fundings.reduce(
        (acc, funding) => acc + (funding.transaction?.gatewayFee ?? 0),
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
 * ?�?�과 ?�산 ?�이?�의 ?��??�을 검증하???�수
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
        throw new Error('?�로?�트�?찾을 ???�습?�다.');
    }

    const totalFundingAmount = project.fundings.reduce((acc, funding) => acc + funding.amount, 0);
    const latestSettlement = project.settlements[0];

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
}

/**
 * ?�???�이?��? ?�전?�게 ?�데?�트?�는 ?�수
 */
export async function safeUpdateFundingData(
    projectId: string,
    amount: number,
    updateProjectAmount = true
) {
    return prisma.$transaction(async (tx) => {
        // ?�???�이???�데?�트
        if (updateProjectAmount) {
            await tx.project.update({
                where: { id: projectId },
                data: { currentAmount: { increment: amount } }
            });
        }

        // ?�산 ?�동 ?�성 ?�도
        const settlement = await createSettlementIfTargetReached(projectId);

        return { settlement };
    });
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
