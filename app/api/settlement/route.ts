import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import {
  settlements,
  settlementPayouts,
  projects,
  fundings,
  partnerMatches,
  projectCollaborators
} from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { calculateSettlementBreakdown } from '@/lib/server/settlements';
import { validateFundingSettlementConsistency } from '@/lib/server/funding-settlement';
import { buildApiError } from '@/lib/server/error-handling';
import { logApiError } from '@/lib/utils/logger';

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
    await requireApiUser({ roles: ['CREATOR', 'ADMIN', 'PARTNER'] }, authContext);
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

  try {
    const db = await getDb();
    const settlementsList = await db
      .select({
        id: settlements.id,
        projectId: settlements.projectId,
        totalRaised: settlements.totalRaised,
        platformFee: settlements.platformFee,
        gatewayFees: settlements.gatewayFees,
        netAmount: settlements.netAmount,
        payoutStatus: settlements.payoutStatus,
        notes: settlements.notes,
        createdAt: settlements.createdAt,
        updatedAt: settlements.updatedAt
      })
      .from(settlements)
      .where(eq(settlements.projectId, projectId))
      .orderBy(desc(settlements.createdAt));

    return NextResponse.json(settlementsList);
  } catch (error) {
    console.error('정산 조회 오류:', error);
    return buildError('정산 정보를 조회할 수 없습니다.', 500);
  }
}

export async function POST(request: NextRequest) {
  const authContext = { headers: request.headers };
  try {
    await requireApiUser({ roles: ['ADMIN'], permissions: ['settlement:manage'] }, authContext);
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

  try {
    const db = await getDb();

    // 프로젝트 정보 조회
    const [project] = await db
      .select({
        id: projects.id,
        ownerId: projects.ownerId,
        targetAmount: projects.targetAmount,
        currentAmount: projects.currentAmount,
        status: projects.status
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return buildError('해당 프로젝트를 찾을 수 없습니다.', 404);
    }

    if (
      project.status !== 'SUCCESSFUL' &&
      project.status !== 'EXECUTING' &&
      project.status !== 'COMPLETED'
    ) {
      return buildError('정산이 가능한 상태의 프로젝트만 정산을 생성할 수 있습니다.', 409);
    }

    // 기존 대기 중인 정산 확인
    const [existingPending] = await db
      .select()
      .from(settlements)
      .where(and(
        eq(settlements.projectId, projectId),
        eq(settlements.payoutStatus, 'PENDING')
      ))
      .limit(1);

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

    // 펀딩 정보 조회
    const fundingsList = await db
      .select({
        id: fundings.id,
        amount: fundings.amount
      })
      .from(fundings)
      .where(eq(fundings.projectId, projectId));

    const totalRaised = fundingsList.reduce((acc, funding) => acc + funding.amount, 0);
    if (totalRaised <= 0) {
      return buildError('모금액이 부족합니다.', 409);
    }

    if (totalRaised < project.targetAmount) {
      return buildError('목표 금액을 아직 달성하지 못했습니다.', 409);
    }

    // 프로젝트 currentAmount와 최근 결제 금액 일치 여부 확인
    if (project.currentAmount !== totalRaised) {
      console.warn(`프로젝트 currentAmount(${project.currentAmount})와 최근 결제 금액(${totalRaised})이 일치하지 않습니다.`);
      // 데이터 일관성을 위해 currentAmount를 업데이트
      await db
        .update(projects)
        .set({ currentAmount: totalRaised })
        .where(eq(projects.id, projectId));
    }

    // Gateway fee는 별도로 계산하거나 기본값 사용
    const inferredGatewayFees = gatewayFeeOverride ?? (totalRaised * 0.03); // 기본 3% 수수료

    // 파트너 매치 정보 조회
    const partnerMatchesList = await db
      .select({
        partnerId: partnerMatches.partnerId,
        settlementShare: partnerMatches.settlementShare
      })
      .from(partnerMatches)
      .where(eq(partnerMatches.projectId, projectId));

    const partnerShares = partnerMatchesList
      .filter(match => typeof match.settlementShare === 'number')
      .map(match => ({
        stakeholderId: match.partnerId,
        share: normaliseShare(match.settlementShare ?? 0)
      }))
      .filter(entry => entry.share > 0);

    // 협업자 정보 조회
    const collaboratorsList = await db
      .select({
        userId: projectCollaborators.userId,
        share: projectCollaborators.share
      })
      .from(projectCollaborators)
      .where(eq(projectCollaborators.projectId, projectId));

    const collaboratorShares = collaboratorsList
      .filter(collab => typeof collab.share === 'number')
      .map(collab => ({
        stakeholderId: collab.userId,
        share: normaliseShare(collab.share ?? 0, true)
      }))
      .filter(entry => entry.share > 0);

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

    // Drizzle 트랜잭션으로 정산 생성
    const settlement = await db.transaction(async (tx) => {
      const settlementId = randomUUID();
      const now = new Date().toISOString();

      // 정산 생성
      const [createdSettlement] = await tx
        .insert(settlements)
        .values({
          id: settlementId,
          projectId,
          totalRaised: breakdown.totalRaised,
          platformFee: breakdown.platformFee,
          creatorShare: breakdown.creatorShare,
          partnerShare: breakdown.partners.reduce((sum, p) => sum + p.amount, 0),
          collaboratorShare: breakdown.collaborators.reduce((sum, c) => sum + c.amount, 0),
          gatewayFees: breakdown.gatewayFees,
          netAmount: breakdown.netAmount,
          payoutStatus: 'PENDING',
          notes,
          createdAt: now,
          updatedAt: now
        })
        .returning();

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

      // 정산 지급 내역 생성
      const payoutValues = payoutPayload.map((payout) => ({
        id: randomUUID(),
        settlementId,
        stakeholderType: payout.stakeholderType,
        stakeholderId: payout.stakeholderId,
        amount: payout.amount,
        percentage: payout.percentage,
        status: 'PENDING' as const,
        createdAt: now,
        updatedAt: now
      }));

      const createdPayouts = await tx
        .insert(settlementPayouts)
        .values(payoutValues)
        .returning();

      return {
        ...createdSettlement,
        payouts: createdPayouts
      };
    });

    return NextResponse.json(settlement, { status: 201 });
  } catch (error) {
    logApiError(
      error instanceof Error ? error : new Error(String(error)),
      'POST',
      '/api/settlement',
      {
        projectId: payload?.projectId,
        platformFeeRate: payload?.platformFeeRate,
        gatewayFeeOverride: payload?.gatewayFeeOverride,
        input: payload
      }
    );

    return buildError('정산 생성에 실패했습니다.', 500);
  }
}

function normaliseShare(value: number, hundredScale = false) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  const normalised = hundredScale ? value / 100 : value;
  return normalised > 1 ? normalised / 100 : normalised;
}
