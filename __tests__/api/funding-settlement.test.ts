import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { POST as fundingPOST } from '../../app/api/funding/route';
import { POST as settlementPOST } from '../../app/api/settlement/route';

const prisma = new PrismaClient();

describe.skip('Funding-Settlement API Integration', () => {
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

    describe('Funding API with Settlement Integration', () => {
        it('펀딩 성공 시 정산 자동 생성이 시도되어야 함', async () => {
            // 목표 금액 달성을 위한 펀딩 생성
            const fundingRequest = new NextRequest('http://localhost:3000/api/funding', {
                method: 'POST',
                body: JSON.stringify({
                    projectId: testProjectId,
                    amount: 1000000,
                    currency: 'krw',
                    receiptEmail: 'test@example.com',
                    customerName: 'Test User',
                    paymentIntentId: 'pi_test_123',
                    mode: 'payment_intent'
                })
            });

            // Mock Stripe verification (실제 테스트에서는 mock 필요)
            const response = await fundingPOST(fundingRequest);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData.status).toBe('recorded');
            expect(responseData.funding).toBeDefined();
            // 정산 생성 시도 여부 확인 (실제로는 Stripe mock이 필요)
            expect(responseData.settlement).toBeDefined();
        });
    });

    describe('Settlement API with Data Validation', () => {
        it('정산 생성 시 펀딩 데이터 일관성을 검증해야 함', async () => {
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
                data: { currentAmount: 1000000, status: 'SUCCESSFUL' }
            });

            const settlementRequest = new NextRequest('http://localhost:3000/api/settlement', {
                method: 'POST',
                body: JSON.stringify({
                    projectId: testProjectId,
                    platformFeeRate: 0.05
                })
            });

            const response = await settlementPOST(settlementRequest);
            expect(response.status).toBe(201);

            const settlementData = await response.json();
            expect(settlementData.totalRaised).toBe(1000000);
            expect(settlementData.payoutStatus).toBe('PENDING');
        });

        it('펀딩 데이터 불일치 시 자동 수정되어야 함', async () => {
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
                data: { currentAmount: 500000, status: 'SUCCESSFUL' }
            });

            const settlementRequest = new NextRequest('http://localhost:3000/api/settlement', {
                method: 'POST',
                body: JSON.stringify({
                    projectId: testProjectId,
                    platformFeeRate: 0.05
                })
            });

            const response = await settlementPOST(settlementRequest);
            expect(response.status).toBe(201);

            // 프로젝트 currentAmount가 자동으로 수정되었는지 확인
            const updatedProject = await prisma.project.findUnique({
                where: { id: testProjectId },
                select: { currentAmount: true }
            });
            expect(updatedProject?.currentAmount).toBe(1000000);
        });
    });
});
