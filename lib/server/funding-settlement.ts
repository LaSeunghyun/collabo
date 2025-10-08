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
 * ?€???±ê³µ ???•ì‚° ?°ì´?°ë? ?ë™?¼ë¡œ ?ì„±?˜ëŠ” ?¨ìˆ˜
 * ?„ë¡œ?íŠ¸ê°€ ëª©í‘œ ê¸ˆì•¡???¬ì„±?ˆì„ ?Œë§Œ ?•ì‚°???ì„±?©ë‹ˆ??
 */
export async function createSettlementIfTargetReached(
    projectId: string,
    platformFeeRate = 0.05,
    gatewayFeeOverride?: number,
    notes?: any
) {
    try {
        // ?„ë¡œ?íŠ¸ ?•ë³´ ì¡°íšŒ
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
            throw new Error('?„ë¡œ?íŠ¸ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.');
        }

        // ?ŒíŠ¸??ë§¤ì¹˜ ?•ë³´ ì¡°íšŒ
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

        // ?‘ë ¥???•ë³´ ì¡°íšŒ
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

        // ?„ë¡œ?íŠ¸ê°€ ëª©í‘œ ê¸ˆì•¡???¬ì„±?ˆëŠ”ì§€ ?•ì¸
        if (project.currentAmount < project.targetAmount) {
            return null; // ?„ì§ ëª©í‘œ ê¸ˆì•¡ ?¬ì„±?˜ì? ?ŠìŒ
        }

        // ?´ë? ì§„í–‰ ì¤‘ì¸ ?•ì‚°???ˆëŠ”ì§€ ?•ì¸
        const [existingSettlement] = await db
            .select()
            .from(settlements)
            .where(and(
                eq(settlements.projectId, projectId),
                inArray(settlements.payoutStatus, ['PENDING', 'IN_PROGRESS'])
            ))
            .limit(1);

        if (existingSettlement) {
            return existingSettlement; // ?´ë? ?•ì‚°??ì§„í–‰ ì¤?
        }

        // ?±ê³µ???€???°ì´??ì¡°íšŒ
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
            throw new Error('?±ê³µ???€???´ì—­???†ìŠµ?ˆë‹¤.');
        }

        // ê²Œì´?¸ì›¨???˜ìˆ˜ë£?ê³„ì‚°
        const inferredGatewayFees = fundingsData.reduce(
            (acc, funding) => acc + (funding.gatewayFee ?? 0),
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
 * ?€?©ê³¼ ?•ì‚° ?°ì´?°ì˜ ?¼ê??±ì„ ê²€ì¦í•˜???¨ìˆ˜
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
            throw new Error('?„ë¡œ?íŠ¸ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.');
        }

        // ?±ê³µ???€??ê¸ˆì•¡ ì¡°íšŒ
        const fundingsData = await db
            .select({ amount: fundings.amount })
            .from(fundings)
            .where(and(
                eq(fundings.projectId, projectId),
                eq(fundings.paymentStatus, 'SUCCEEDED')
            ));

        // ?•ì‚° ?°ì´??ì¡°íšŒ
        const settlementsData = await db
            .select({ totalRaised: settlements.totalRaised })
            .from(settlements)
            .where(eq(settlements.projectId, projectId))
            .orderBy(desc(settlements.createdAt))
            .limit(1);

        const totalFundingAmount = fundingsData.reduce((acc, funding) => acc + funding.amount, 0);
        const latestSettlement = settlementsData[0];

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
    } catch (error) {
        console.error('Failed to validate funding settlement consistency:', error);
        throw error;
    }
}

/**
 * ?€???°ì´?°ë? ?ˆì „?˜ê²Œ ?…ë°?´íŠ¸?˜ëŠ” ?¨ìˆ˜
 */
export async function safeUpdateFundingData(
    projectId: string,
    amount: number,
    updateProjectAmount = true
) {
    try {
        const db = await getDb();
        return await db.transaction(async (tx) => {
            // ?€???°ì´???…ë°?´íŠ¸
            if (updateProjectAmount) {
                await tx
                    .update(projects)
                    .set({ 
                        currentAmount: amount, // increment ?€??ì§ì ‘ ?¤ì •
                        updatedAt: new Date().toISOString()
                    })
                    .where(eq(projects.id, projectId));
            }

            // ?•ì‚° ?ë™ ?ì„± ?œë„
            const settlement = await createSettlementIfTargetReached(projectId);

            return { settlement };
        });
    } catch (error) {
        console.error('Failed to update funding data:', error);
        throw error;
    }
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
