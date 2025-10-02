import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import {
  FundingStatus,
  PartnerMatchStatus,
  ProjectStatus,
  SettlementPayoutStatus,
  SettlementStakeholderType,
  UserRole
} from '@/types/prisma';
import { z } from 'zod';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { calculateSettlementBreakdown } from '@/lib/server/settlements';
import { validateFundingSettlementConsistency } from '@/lib/server/funding-settlement';
import { buildApiError } from '@/lib/server/error-handling';

const requestSchema = z.object({
  projectId: z.string().min(1, 'projectId???꾩닔?낅땲??'),
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
    return buildError('projectId ?뚮씪誘명꽣媛 ?꾩슂?⑸땲??');
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

    return buildError('?붿껌 蹂몃Ц???뺤씤?????놁뒿?덈떎.');
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
    return buildError('?대떦 ?꾨줈?앺듃瑜?李얠쓣 ???놁뒿?덈떎.', 404);
  }

  if (
    project.status !== ProjectStatus.SUCCESSFUL &&
    project.status !== ProjectStatus.EXECUTING &&
    project.status !== ProjectStatus.COMPLETED
  ) {
    return buildError('?뺤궛? ?깃났 ?먮뒗 吏꾪뻾 以묒씤 ?꾨줈?앺듃?먯꽌留??앹꽦?????덉뒿?덈떎.', 409);
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

  // ????곗씠???쇨???寃利?
  try {
    const consistencyCheck = await validateFundingSettlementConsistency(projectId);
    if (!consistencyCheck.isValid) {
      console.warn('????뺤궛 ?곗씠???쇨???臾몄젣:', consistencyCheck.issues);
      // 寃쎄퀬留?濡쒓렇?섍퀬 怨꾩냽 吏꾪뻾 (?곗씠??蹂듦뎄??蹂꾨룄 泥섎━)
    }
  } catch (error) {
    console.warn('????뺤궛 ?쇨???寃利??ㅽ뙣:', error);
  }

  const fundings = await prisma.funding.findMany({
    where: { projectId, paymentStatus: FundingStatus.SUCCEEDED },
    select: { amount: true, transaction: { select: { gatewayFee: true } } }
  });

  const totalRaised = fundings.reduce((acc: number, funding: { amount: number }) => acc + funding.amount, 0);
  if (totalRaised <= 0) {
    return buildError('?깃났??????댁뿭???놁뒿?덈떎.', 409);
  }

  if (totalRaised < project.targetAmount) {
    return buildError('紐⑺몴 湲덉븸???꾩쭅 ?ъ꽦?섏? ?딆븯?듬땲??', 409);
  }

  // ?꾨줈?앺듃 currentAmount? ?ㅼ젣 ???湲덉븸 ?쇱튂 ?뺤씤
  const projectCurrentAmount = await prisma.project.findUnique({
    where: { id: projectId },
    select: { currentAmount: true }
  });

  if (projectCurrentAmount && projectCurrentAmount.currentAmount !== totalRaised) {
    console.warn(`?꾨줈?앺듃 currentAmount(${projectCurrentAmount.currentAmount})? ?ㅼ젣 ???湲덉븸(${totalRaised})???쇱튂?섏? ?딆뒿?덈떎.`);
    // ?곗씠???쇨??깆쓣 ?꾪빐 currentAmount ?낅뜲?댄듃
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
    const message = error instanceof Error ? error.message : '?뺤궛 怨꾩궛???ㅽ뙣?덉뒿?덈떎.';
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
