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
 * ?€???±ê³µ ???•ì‚° ?°ì´?°ë? ?ë™?¼ë¡œ ?ì„±?˜ëŠ” ?¨ìˆ˜
 * ?„ë¡œ?íŠ¸ê°€ ëª©í‘œ ê¸ˆì•¡???¬ì„±?ˆì„ ?Œë§Œ ?•ì‚°???ì„±?©ë‹ˆ??
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
        throw new Error('?„ë¡œ?íŠ¸ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.');
    }

    // ?„ë¡œ?íŠ¸ê°€ ëª©í‘œ ê¸ˆì•¡???¬ì„±?ˆëŠ”ì§€ ?•ì¸
    if (project.currentAmount < project.targetAmount) {
        return null; // ?„ì§ ëª©í‘œ ê¸ˆì•¡ ?¬ì„±?˜ì? ?ŠìŒ
    }

    // ?´ë? ì§„í–‰ ì¤‘ì¸ ?•ì‚°???ˆëŠ”ì§€ ?•ì¸
    const existingSettlement = await prisma.settlement.findFirst({
        where: {
            projectId,
            payoutStatus: {
                in: [SettlementPayoutStatus.PENDING, SettlementPayoutStatus.IN_PROGRESS]
            }
        }
    });

    if (existingSettlement) {
        return existingSettlement; // ?´ë? ?•ì‚°??ì§„í–‰ ì¤?
    }

    // ?±ê³µ???€???°ì´??ì¡°íšŒ
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
        throw new Error('?±ê³µ???€???´ì—­???†ìŠµ?ˆë‹¤.');
    }

    // ê²Œì´?¸ì›¨???˜ìˆ˜ë£?ê³„ì‚°
    const inferredGatewayFees = fundings.reduce(
        (acc, funding) => acc + (funding.transaction?.gatewayFee ?? 0),
        0
    );

    // ?ŒíŠ¸??ë°??‘ë ¥??ë°°ë¶„ ë¹„ìœ¨ ?•ê·œ??
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

    // ?•ì‚° ê³„ì‚°
    const breakdown = calculateSettlementBreakdown({
        totalRaised,
        platformFeeRate,
        gatewayFees: gatewayFeeOverride ?? inferredGatewayFees,
        partnerShares,
        collaboratorShares
    });

    // ?•ì‚° ?ˆì½”???ì„±
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

        // ?•ì‚° ë°°ë¶„ ?ˆì½”???ì„±
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
 * ?€?©ê³¼ ?•ì‚° ?°ì´?°ì˜ ?¼ê??±ì„ ê²€ì¦í•˜???¨ìˆ˜
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
        throw new Error('?„ë¡œ?íŠ¸ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.');
    }

    const totalFundingAmount = project.fundings.reduce((acc, funding) => acc + funding.amount, 0);
    const latestSettlement = project.settlements[0];

    const issues: string[] = [];

    // ?€??ê¸ˆì•¡ê³??„ë¡œ?íŠ¸ currentAmount ?¼ì¹˜ ?•ì¸
    if (project.currentAmount !== totalFundingAmount) {
        issues.push(`?„ë¡œ?íŠ¸ currentAmount(${project.currentAmount})?€ ?¤ì œ ?€??ê¸ˆì•¡(${totalFundingAmount})???¼ì¹˜?˜ì? ?ŠìŠµ?ˆë‹¤.`);
    }

    // ?•ì‚° ê¸ˆì•¡ê³??€??ê¸ˆì•¡ ?¼ì¹˜ ?•ì¸
    if (latestSettlement && latestSettlement.totalRaised !== totalFundingAmount) {
        issues.push(`ìµœì‹  ?•ì‚° ê¸ˆì•¡(${latestSettlement.totalRaised})ê³??€??ê¸ˆì•¡(${totalFundingAmount})???¼ì¹˜?˜ì? ?ŠìŠµ?ˆë‹¤.`);
    }

    return {
        isValid: issues.length === 0,
        issues
    };
}

/**
 * ?€???°ì´?°ë? ?ˆì „?˜ê²Œ ?…ë°?´íŠ¸?˜ëŠ” ?¨ìˆ˜
 */
export async function safeUpdateFundingData(
    projectId: string,
    amount: number,
    updateProjectAmount = true
) {
    return prisma.$transaction(async (tx) => {
        // ?€???°ì´???…ë°?´íŠ¸
        if (updateProjectAmount) {
            await tx.project.update({
                where: { id: projectId },
                data: { currentAmount: { increment: amount } }
            });
        }

        // ?•ì‚° ?ë™ ?ì„± ?œë„
        const settlement = await createSettlementIfTargetReached(projectId);

        return { settlement };
    });
}

/**
 * ë°°ë¶„ ë¹„ìœ¨ ?•ê·œ???¨ìˆ˜
 */
function normaliseShare(value: number, hundredScale = false) {
    if (!Number.isFinite(value) || value <= 0) {
        return 0;
    }

    const normalised = hundredScale ? value / 100 : value;
    return normalised > 1 ? normalised / 100 : normalised;
}
