import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import {
  FundingStatus,
  PartnerMatchStatus,
  ProjectStatus,
  SettlementPayoutStatus,
  SettlementStakeholderType,
  UserRole
} from '@/types/auth';
import { z } from 'zod';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { calculateSettlementBreakdown } from '@/lib/server/settlements';
import { validateFundingSettlementConsistency } from '@/lib/server/funding-settlement';
import { buildApiError } from '@/lib/server/error-handling';

const requestSchema = z.object({
  projectId: z.string().min(1, 'projectId�� �ʼ��Դϴ�.'),
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
    await requireApiUser({ roles: [UserRole.CREATOR, UserRole.ADMIN, UserRole.PARTNER] }, authContext);
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
    return buildError('projectId �Ķ���Ͱ� �ʿ��մϴ�.');
  }

  const settlements = await prisma.settlement.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: { payouts: true }
  });

  return NextResponse.json(settlements);
}

export async function POST(request: NextRequest) {
  const authContext = { headers: request.headers };
  try {
    await requireApiUser({ roles: [UserRole.ADMIN], permissions: ['settlement:manage'] }, authContext);
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

    return buildError('��û ������ Ȯ���� �� �����ϴ�.');
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
    return buildError('�ش� ������Ʈ�� ã�� �� �����ϴ�.', 404);
  }

  if (
    project.status !== ProjectStatus.SUCCESSFUL &&
    project.status !== ProjectStatus.EXECUTING &&
    project.status !== ProjectStatus.COMPLETED
  ) {
    return buildError('������ ������ ������ ������Ʈ�� ������ ������ �� �ֽ��ϴ�.', 409);
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

  // ���� ������ �ϰ��� ����
  try {
    const consistencyCheck = await validateFundingSettlementConsistency(projectId);
    if (!consistencyCheck.isValid) {
      console.warn('���� ������ �ϰ��� ����:', consistencyCheck.issues);
      // �α׸� ����� ��� ���� (������ ����ġ �� �ļ� ��ġ �ʿ�)
    }
  } catch (error) {
    console.warn('���� ������ ���� ����:', error);
  }

  const fundings = await prisma.funding.findMany({
    where: { projectId, paymentStatus: FundingStatus.SUCCEEDED },
    select: { amount: true, transaction: { select: { gatewayFee: true } } }
  });

  const totalRaised = fundings.reduce((acc: number, funding: { amount: number }) => acc + funding.amount, 0);
  if (totalRaised <= 0) {
    return buildError('��ݾ��� �����մϴ�.', 409);
  }

  if (totalRaised < project.targetAmount) {
    return buildError('��ǥ �ݾ��� ���� �޼����� ���߽��ϴ�.', 409);
  }

  // ������Ʈ currentAmount�� �ֱ� ���� �ݾ� ��ġ ���� Ȯ��
  const projectCurrentAmount = await prisma.project.findUnique({
    where: { id: projectId },
    select: { currentAmount: true }
  });

  if (projectCurrentAmount && projectCurrentAmount.currentAmount !== totalRaised) {
    console.warn(`������Ʈ currentAmount(${projectCurrentAmount.currentAmount})�� �ֱ� ���� �ݾ�(${totalRaised})�� ��ġ���� �ʽ��ϴ�.`);
    // ������ �ϰ����� ���� currentAmount�� ������Ʈ
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
    const message = error instanceof Error ? error.message : '���� ��� ��꿡 �����߽��ϴ�.';
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
