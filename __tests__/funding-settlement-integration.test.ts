import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createSettlementIfTargetReached, validateFundingSettlementConsistency } from '../lib/server/funding-settlement';
import { db } from '@/lib/db/client';
import { users, projects, fundings, settlements, settlementPayouts, paymentTransactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe.skip('Funding-Settlement Integration', () => {
    let testProjectId: string;
    let testUserId: string;

    beforeEach(async () => {
        // 테스트용 사용자 생성
        const [user] = await db.insert(users).values({
            name: 'Test User',
            email: 'test@example.com',
            role: 'CREATOR'
        }).returning();
        testUserId = user.id;

        // 테스트용 프로젝트 생성
        const [project] = await db.insert(projects).values({
            title: 'Test Project',
            description: 'Test Description',
            category: 'Music',
            targetAmount: 1000000, // 100만원
            currentAmount: 0,
            currency: 'KRW',
            status: 'ACTIVE',
            ownerId: testUserId
        }).returning();
        testProjectId = project.id;
    });

    afterEach(async () => {
        // 테스트 데이터 정리
        await db.delete(settlementPayouts).where(eq(settlementPayouts.settlementId, testProjectId));
        await db.delete(settlements).where(eq(settlements.projectId, testProjectId));
        await db.delete(paymentTransactions).where(eq(paymentTransactions.fundingId, testProjectId));
        await db.delete(fundings).where(eq(fundings.projectId, testProjectId));
        await db.delete(projects).where(eq(projects.id, testProjectId));
        await db.delete(users).where(eq(users.id, testUserId));
    });

    describe('createSettlementIfTargetReached', () => {
        it('목표 금액 미달성 시 정산을 생성하지 않아야 함', async () => {
            // 50만원 펀딩 (목표 100만원 미달성)
            await db.insert(fundings).values({
                projectId: testProjectId,
                userId: testUserId,
                amount: 500000,
                currency: 'KRW',
                status: 'SUCCESS'
            });

            await db.update(projects).set({ currentAmount: 500000 }).where(eq(projects.id, testProjectId));

            const settlement = await createSettlementIfTargetReached(testProjectId);
            expect(settlement).toBeNull();
        });

        it('목표 금액 달성 시 정산을 자동 생성해야 함', async () => {
            // 100만원 펀딩 (목표 달성)
            await db.insert(fundings).values({
                projectId: testProjectId,
                userId: testUserId,
                amount: 1000000,
                currency: 'KRW',
                status: 'SUCCESS'
            });

            await db.update(projects).set({ currentAmount: 1000000 }).where(eq(projects.id, testProjectId));

            const settlement = await createSettlementIfTargetReached(testProjectId);
            expect(settlement).not.toBeNull();
            expect(settlement?.amount).toBe(1000000);
            expect(settlement?.status).toBe('PENDING');
        });

        it('이미 정산이 있는 경우 기존 정산을 반환해야 함', async () => {
            // 첫 번째 정산 생성
            await db.insert(fundings).values({
                projectId: testProjectId,
                userId: testUserId,
                amount: 1000000,
                currency: 'KRW',
                status: 'SUCCESS'
            });

            await db.update(projects).set({ currentAmount: 1000000 }).where(eq(projects.id, testProjectId));

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
            await db.insert(fundings).values({
                projectId: testProjectId,
                userId: testUserId,
                amount: 1000000,
                currency: 'KRW',
                status: 'SUCCESS'
            });

            // 프로젝트 currentAmount 업데이트
            await db.update(projects).set({ currentAmount: 1000000 }).where(eq(projects.id, testProjectId));

            const validation = await validateFundingSettlementConsistency(testProjectId);
            expect(validation.isValid).toBe(true);
            expect(validation.issues).toHaveLength(0);
        });

        it('currentAmount와 펀딩 금액 불일치 시 문제를 감지해야 함', async () => {
            // 펀딩 데이터 생성
            await db.insert(fundings).values({
                projectId: testProjectId,
                userId: testUserId,
                amount: 1000000,
                currency: 'KRW',
                status: 'SUCCESS'
            });

            // 프로젝트 currentAmount를 잘못된 값으로 설정
            await db.update(projects).set({ currentAmount: 500000 }).where(eq(projects.id, testProjectId));

            const validation = await validateFundingSettlementConsistency(testProjectId);
            expect(validation.isValid).toBe(false);
            expect(validation.issues.length).toBeGreaterThan(0);
        });
    });
});