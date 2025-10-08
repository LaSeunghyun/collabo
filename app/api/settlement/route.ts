import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { 
  settlementPayoutStatusEnum,
  settlementStakeholderTypeEnum
} from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { calculateSettlementBreakdown } from '@/lib/server/settlements';
import { validateFundingSettlementConsistency } from '@/lib/server/funding-settlement';
import { buildApiError } from '@/lib/server/error-handling';

const requestSchema = z.object({
  projectId: z.string().min(1, 'projectId는 필수입니다.'),
  platformFeeRate: z.number().min(0).max(1).optional(),
  gatewayFeeOverride: z.number().min(0).optional(),
  notes: z.any().optional()
});

function buildError(message: string, status = 400) {
  return buildApiError(message, status);
}

export async function GET(request: NextRequest) {
  const authContext = { headers: request.headers };
  try {
    await requireApiUser({ roles: ['CREATOR', 'ADMIN', 'PARTNER'] }, authContext); // TODO: Drizzle로 전환 필요
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return buildError('projectId 파라미터가 필요합니다.');
  }

  // TODO: Drizzle로 전환 필요
  const settlements: any[] = [];

  return NextResponse.json(settlements);
}

export async function POST(request: NextRequest) {
  const authContext = { headers: request.headers };
  try {
    await requireApiUser({ roles: ['ADMIN'], permissions: ['settlement:manage'] }, authContext); // TODO: Drizzle로 전환 필요
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

  let payload: z.infer<typeof requestSchema>;

  try {
    const rawBody = await request.json();
    payload = requestSchema.parse(rawBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return buildError(error.issues.map((issue) => issue.message).join(', '));
    }

    return buildError('요청 본문을 확인할 수 없습니다.');
  }

  const { projectId, platformFeeRate = 0.05, gatewayFeeOverride, notes } = payload;

  // TODO: Drizzle로 전환 필요
  const project = {
    ownerId: 'temp-owner-id',
    targetAmount: 100000,
    status: 'COMPLETED',
    partnerMatches: [],
    collaborators: []
  };

  if (!project) {
    return buildError('해당 프로젝트를 찾을 수 없습니다.', 404);
  }

  if (
    project.status !== 'SUCCESSFUL' &&
    project.status !== 'EXECUTING' &&
    project.status !== 'COMPLETED'
  ) { // TODO: Drizzle로 전환 필요
    return buildError('정산이 가능한 상태의 프로젝트만 정산을 생성할 수 있습니다.', 409);
  }

  // TODO: Drizzle로 전환 필요
  const existingPending = null;

  if (existingPending) {
    return NextResponse.json(existingPending);
  }

  // 정산 데이터 일관성 검증
  try {
    const consistencyCheck = await validateFundingSettlementConsistency(projectId);
    if (!consistencyCheck.isValid) {
      console.warn('정산 데이터 일관성 문제:', consistencyCheck.issues);
      // 로그만 남기고 계속 진행 (데이터 불일치 시 후속 조치 필요)
    }
  } catch (error) {
    console.warn('정산 데이터 검증 오류:', error);
  }

  // TODO: Drizzle로 전환 필요
  const fundings: any[] = [];

  const totalRaised = fundings.reduce((acc: number, funding: { amount: number }) => acc + funding.amount, 0);
  if (totalRaised <= 0) {
    return buildError('모금액이 부족합니다.', 409);
  }

  if (totalRaised < project.targetAmount) {
    return buildError('목표 금액을 아직 달성하지 못했습니다.', 409);
  }

  // TODO: Drizzle로 전환 필요
  // 프로젝트 currentAmount와 최근 결제 금액 일치 여부 확인
  const projectCurrentAmount = { currentAmount: totalRaised };

  if (projectCurrentAmount && projectCurrentAmount.currentAmount !== totalRaised) {
    console.warn(`프로젝트 currentAmount(${projectCurrentAmount.currentAmount})와 최근 결제 금액(${totalRaised})이 일치하지 않습니다.`);
    // TODO: Drizzle로 전환 필요
    // 데이터 일관성을 위해 currentAmount를 업데이트
    // await prisma.project.update({
    //   where: { id: projectId },
    //   data: { currentAmount: totalRaised }
    // });
  }

  const inferredGatewayFees = fundings.reduce(
    (acc: number, funding: { transaction: { gatewayFee: number | null } | null }) => acc + (funding.transaction?.gatewayFee ?? 0),
    0
  );

  const partnerShares = project.partnerMatches
    .filter((match: { settlementShare: number | null }) => typeof match.settlementShare === 'number')
    .map((match: { partnerId: string; settlementShare: number | null }) => ({
      stakeholderId: match.partnerId,
      share: normaliseShare(match.settlementShare ?? 0)
    }))
    .filter((entry: { share: number }) => entry.share > 0);

  const collaboratorShares = project.collaborators
    .filter((collab: { share: number | null }) => typeof collab.share === 'number')
    .map((collab: { userId: string; share: number | null }) => ({
      stakeholderId: collab.userId,
      share: normaliseShare(collab.share ?? 0, true)
    }))
    .filter((entry: { share: number }) => entry.share > 0);

  let breakdown;
  try {
    breakdown = calculateSettlementBreakdown({
      totalRaised,
      platformFeeRate,
      gatewayFees: gatewayFeeOverride ?? (typeof inferredGatewayFees === 'number' ? inferredGatewayFees : 0),
      partnerShares,
      collaboratorShares
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '정산 배분 계산에 실패했습니다.';
    return buildError(message, 422);
  }

  // TODO: Drizzle로 전환 필요 - 트랜잭션 구현
  const settlement = (() => {
    const created = {
      id: 'temp-settlement-id',
      projectId,
      totalRaised: breakdown.totalRaised,
      platformFee: breakdown.platformFee,
      gatewayFees: breakdown.gatewayFees,
      netAmount: breakdown.netAmount,
      payoutStatus: 'PENDING',
      notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const payoutPayload = [
      {
        stakeholderType: 'PLATFORM' as const,
        stakeholderId: null,
        amount: breakdown.platformFee,
        percentage:
          breakdown.totalRaised > 0
            ? breakdown.platformFee / breakdown.totalRaised
            : 0
      },
      {
        stakeholderType: 'CREATOR' as const,
        stakeholderId: project.ownerId,
        amount: breakdown.creatorShare,
        percentage:
          breakdown.totalRaised > 0
            ? breakdown.creatorShare / breakdown.totalRaised
            : 0
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

    // TODO: Drizzle 트랜잭션으로 전환 필요
    // 임시로 기본 settlement 객체 반환
    return {
      ...created,
      payouts: payoutPayload.map((payout) => ({
        id: `temp-payout-${Math.random()}`,
        settlementId: created.id,
        stakeholderType: payout.stakeholderType,
        stakeholderId: payout.stakeholderId,
        amount: payout.amount,
        percentage: payout.percentage,
        status: 'PENDING' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    };
  });

  return NextResponse.json(settlement, { status: 201 });
}

function normaliseShare(value: number, hundredScale = false) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  const normalised = hundredScale ? value / 100 : value;
  return normalised > 1 ? normalised / 100 : normalised;
}
