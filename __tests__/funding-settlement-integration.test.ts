import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { createSettlementIfTargetReached, validateFundingSettlementConsistency } from '../lib/server/funding-settlement';

const prisma = new PrismaClient();

describe.skip('Funding-Settlement Integration', () => {
    let testProjectId: string;
    let testUserId: string;

    beforeEach(async () => {
        // ?ŒìŠ¤?¸ìš© ?¬ìš©???ì„±
        const user = await prisma.user.create({
            data: {
                name: 'Test User',
                email: 'test@example.com',
                role: 'CREATOR'
            }
        });
        testUserId = user.id;

        // ?ŒìŠ¤?¸ìš© ?„ë¡œ?íŠ¸ ?ì„±
        const project = await prisma.project.create({
            data: {
                title: 'Test Project',
                description: 'Test Description',
                category: 'Music',
                targetAmount: 1000000, // 100ë§Œì›
                currentAmount: 0,
                currency: 'KRW',
                status: 'LIVE',
                ownerId: testUserId
            }
        });
        testProjectId = project.id;
    });

    afterEach(async () => {
        // ?ŒìŠ¤???°ì´???•ë¦¬
        await prisma.settlementPayout.deleteMany({
            where: { settlement: { projectId: testProjectId } }
        });
        await prisma.settlement.deleteMany({
            where: { projectId: testProjectId }
        });
        await prisma.paymentTransaction.deleteMany({
            where: { funding: { projectId: testProjectId } }
        });
        await prisma.funding.deleteMany({
            where: { projectId: testProjectId }
        });
        await prisma.project.delete({
            where: { id: testProjectId }
        });
        await prisma.user.delete({
            where: { id: testUserId }
        });
    });

    describe('createSettlementIfTargetReached', () => {
        it('ëª©í‘œ ê¸ˆì•¡ ë¯¸ë‹¬?????•ì‚°???ì„±?˜ì? ?Šì•„????, async () => {
            // 50ë§Œì› ?€??(ëª©í‘œ 100ë§Œì› ë¯¸ë‹¬??
            await prisma.funding.create({
                data: {
                    projectId: testProjectId,
                    userId: testUserId,
                    amount: 500000,
                    currency: 'KRW',
                    paymentStatus: 'SUCCEEDED'
                }
            });

            await prisma.project.update({
                where: { id: testProjectId },
                data: { currentAmount: 500000 }
            });

            const settlement = await createSettlementIfTargetReached(testProjectId);
            expect(settlement).toBeNull();
        });

        it('ëª©í‘œ ê¸ˆì•¡ ?¬ì„± ???•ì‚°???ë™ ?ì„±?´ì•¼ ??, async () => {
            // 100ë§Œì› ?€??(ëª©í‘œ ?¬ì„±)
            await prisma.funding.create({
                data: {
                    projectId: testProjectId,
                    userId: testUserId,
                    amount: 1000000,
                    currency: 'KRW',
                    paymentStatus: 'SUCCEEDED'
                }
            });

            await prisma.project.update({
                where: { id: testProjectId },
                data: { currentAmount: 1000000 }
            });

            const settlement = await createSettlementIfTargetReached(testProjectId);
            expect(settlement).not.toBeNull();
            expect(settlement?.totalRaised).toBe(1000000);
            expect(settlement?.payoutStatus).toBe('PENDING');
        });

        it('?´ë? ?•ì‚°???ˆëŠ” ê²½ìš° ê¸°ì¡´ ?•ì‚°??ë°˜í™˜?´ì•¼ ??, async () => {
            // ì²?ë²ˆì§¸ ?•ì‚° ?ì„±
            await prisma.funding.create({
                data: {
                    projectId: testProjectId,
                    userId: testUserId,
                    amount: 1000000,
                    currency: 'KRW',
                    paymentStatus: 'SUCCEEDED'
                }
            });

            await prisma.project.update({
                where: { id: testProjectId },
                data: { currentAmount: 1000000 }
            });

            const firstSettlement = await createSettlementIfTargetReached(testProjectId);
            expect(firstSettlement).not.toBeNull();

            // ??ë²ˆì§¸ ?¸ì¶œ ??ê¸°ì¡´ ?•ì‚° ë°˜í™˜
            const secondSettlement = await createSettlementIfTargetReached(testProjectId);
            expect(secondSettlement?.id).toBe(firstSettlement?.id);
        });
    });

    describe('validateFundingSettlementConsistency', () => {
        it('?¼ê????°ì´?°ì— ?€??ê²€ì¦ì„ ?µê³¼?´ì•¼ ??, async () => {
            // ?€???°ì´???ì„±
            await prisma.funding.create({
                data: {
                    projectId: testProjectId,
                    userId: testUserId,
                    amount: 1000000,
                    currency: 'KRW',
                    paymentStatus: 'SUCCEEDED'
                }
            });

            // ?„ë¡œ?íŠ¸ currentAmount ?…ë°?´íŠ¸
            await prisma.project.update({
                where: { id: testProjectId },
                data: { currentAmount: 1000000 }
            });

            const validation = await validateFundingSettlementConsistency(testProjectId);
            expect(validation.isValid).toBe(true);
            expect(validation.issues).toHaveLength(0);
        });

        it('currentAmount?€ ?€??ê¸ˆì•¡ ë¶ˆì¼ì¹???ë¬¸ì œë¥?ê°ì??´ì•¼ ??, async () => {
            // ?€???°ì´???ì„±
            await prisma.funding.create({
                data: {
                    projectId: testProjectId,
                    userId: testUserId,
                    amount: 1000000,
                    currency: 'KRW',
                    paymentStatus: 'SUCCEEDED'
                }
            });

            // ?„ë¡œ?íŠ¸ currentAmountë¥??˜ëª»??ê°’ìœ¼ë¡??¤ì •
            await prisma.project.update({
                where: { id: testProjectId },
                data: { currentAmount: 500000 }
            });

            const validation = await validateFundingSettlementConsistency(testProjectId);
            expect(validation.isValid).toBe(false);
            expect(validation.issues.length).toBeGreaterThan(0);
        });
    });
});
