import { NextRequest, NextResponse } from 'next/server';
import {
  FundingStatus,
  PartnerMatchStatus,
  ProjectStatus,
  SettlementPayoutStatus,
  SettlementStakeholderType,
  UserRole,
  Prisma
} from '@/types/prisma';
import { z } from 'zod';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
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
  try {
    await requireApiUser({ roles: [UserRole.CREATOR, UserRole.ADMIN, UserRole.PARTNER] });
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

  const settlements = await prisma.settlement.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: { payouts: true }
  });

  return NextResponse.json(settlements);
}

export async function POST(request: NextRequest) {
  try {
    await requireApiUser({ roles: [UserRole.ADMIN], permissions: ['settlement:manage'] });
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

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      targetAmount: true,
      status: true,
      partnerMatches: {
        where: {
          status: {
            in: [PartnerMatchStatus.ACCEPTED, PartnerMatchStatus.COMPLETED]
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
    return buildError('해당 프로젝트를 찾을 수 없습니다.', 404);
  }

  if (
    project.status !== ProjectStatus.SUCCESSFUL &&
    project.status !== ProjectStatus.EXECUTING &&
    project.status !== ProjectStatus.COMPLETED
  ) {
    return buildError('정산은 성공 또는 진행 중인 프로젝트에서만 생성할 수 있습니다.', 409);
  }

  const existingPending = await prisma.settlement.findFirst({
    where: {
      projectId,
      payoutStatus: { in: [SettlementPayoutStatus.PENDING, SettlementPayoutStatus.IN_PROGRESS] }
    },
    orderBy: { createdAt: 'desc' },
    include: { payouts: true }
  });

  if (existingPending) {
    return NextResponse.json(existingPending);
  }

  // 펀딩 데이터 일관성 검증
  try {
    const consistencyCheck = await validateFundingSettlementConsistency(projectId);
    if (!consistencyCheck.isValid) {
      console.warn('펀딩-정산 데이터 일관성 문제:', consistencyCheck.issues);
      // 경고만 로그하고 계속 진행 (데이터 복구는 별도 처리)
    }
  } catch (error) {
    console.warn('펀딩-정산 일관성 검증 실패:', error);
  }

  const fundings = await prisma.funding.findMany({
    where: { projectId, paymentStatus: FundingStatus.SUCCEEDED },
    select: { amount: true, transaction: { select: { gatewayFee: true } } }
  });

  const totalRaised = fundings.reduce((acc: number, funding: { amount: number }) => acc + funding.amount, 0);
  if (totalRaised <= 0) {
    return buildError('성공한 펀딩 내역이 없습니다.', 409);
  }

  if (totalRaised < project.targetAmount) {
    return buildError('목표 금액이 아직 달성되지 않았습니다.', 409);
  }

  // 프로젝트 currentAmount와 실제 펀딩 금액 일치 확인
  const projectCurrentAmount = await prisma.project.findUnique({
    where: { id: projectId },
    select: { currentAmount: true }
  });

  if (projectCurrentAmount && projectCurrentAmount.currentAmount !== totalRaised) {
    console.warn(`프로젝트 currentAmount(${projectCurrentAmount.currentAmount})와 실제 펀딩 금액(${totalRaised})이 일치하지 않습니다.`);
    // 데이터 일관성을 위해 currentAmount 업데이트
    await prisma.project.update({
      where: { id: projectId },
      data: { currentAmount: totalRaised }
    });
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
    const message = error instanceof Error ? error.message : '정산 계산에 실패했습니다.';
    return buildError(message, 422);
  }

  const settlement = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

    const payoutPayload = [
      {
        stakeholderType: SettlementStakeholderType.PLATFORM,
        stakeholderId: null,
        amount: breakdown.platformFee,
        percentage:
          breakdown.totalRaised > 0
            ? breakdown.platformFee / breakdown.totalRaised
            : 0
      },
      {
        stakeholderType: SettlementStakeholderType.CREATOR,
        stakeholderId: project.ownerId,
        amount: breakdown.creatorShare,
        percentage:
          breakdown.totalRaised > 0
            ? breakdown.creatorShare / breakdown.totalRaised
            : 0
      },
      ...breakdown.partners.map((partner) => ({
        stakeholderType: SettlementStakeholderType.PARTNER,
        stakeholderId: partner.stakeholderId,
        amount: partner.amount,
        percentage: partner.percentage
      })),
      ...breakdown.collaborators.map((collaborator) => ({
        stakeholderType: SettlementStakeholderType.COLLABORATOR,
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

    return (
      await tx.settlement.findUnique({
        where: { id: created.id },
        include: { payouts: true }
      })
    )!;
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
