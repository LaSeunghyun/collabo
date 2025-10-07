import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createSettlementIfTargetReached, validateFundingSettlementConsistency } from '../lib/server/funding-settlement';
import { db } from '@/lib/db/client';

describe.skip('Funding-Settlement Integration', () => {
    let testProjectId: string;
    let testUserId: string;

    beforeEach(async () => {
        // 테스트용 사용자 생성
        const user = await prisma.user.create({
            data: {
                name: 'Test User',
                email: 'test@example.com',
                role: 'CREATOR'
            }
        });
        testUserId = user.id;

        // 테스트용 프로젝트 생성
        const project = await prisma.project.create({
            data: {
                title: 'Test Project',
                description: 'Test Description',
                category: 'Music',
                targetAmount: 1000000, // 100만원
                currentAmount: 0,
                currency: 'KRW',
                status: 'LIVE',
                ownerId: testUserId
            }
        });
        testProjectId = project.id;
    });

    afterEach(async () => {
        // 테스트 데이터 정리
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
        it('목표 금액 미달성 시 정산을 생성하지 않아야 함', async () => {
            // 50만원 펀딩 (목표 100만원 미달성)
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

        it('목표 금액 달성 시 정산을 자동 생성해야 함', async () => {
            // 100만원 펀딩 (목표 달성)
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

        it('이미 정산이 있는 경우 기존 정산을 반환해야 함', async () => {
            // 첫 번째 정산 생성
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

            // 두 번째 호출 시 기존 정산 반환
            const secondSettlement = await createSettlementIfTargetReached(testProjectId);
            expect(secondSettlement?.id).toBe(firstSettlement?.id);
        });
    });

    describe('validateFundingSettlementConsistency', () => {
        it('일관된 데이터에 대해 검증을 통과해야 함', async () => {
            // 펀딩 데이터 생성
            await prisma.funding.create({
                data: {
                    projectId: testProjectId,
                    userId: testUserId,
                    amount: 1000000,
                    currency: 'KRW',
                    paymentStatus: 'SUCCEEDED'
                }
            });

            // 프로젝트 currentAmount 업데이트
            await prisma.project.update({
                where: { id: testProjectId },
                data: { currentAmount: 1000000 }
            });

            const validation = await validateFundingSettlementConsistency(testProjectId);
            expect(validation.isValid).toBe(true);
            expect(validation.issues).toHaveLength(0);
        });

        it('currentAmount와 펀딩 금액 불일치 시 문제를 감지해야 함', async () => {
            // 펀딩 데이터 생성
            await prisma.funding.create({
                data: {
                    projectId: testProjectId,
                    userId: testUserId,
                    amount: 1000000,
                    currency: 'KRW',
                    paymentStatus: 'SUCCEEDED'
                }
            });

            // 프로젝트 currentAmount를 잘못된 값으로 설정
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
