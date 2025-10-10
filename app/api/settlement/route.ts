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

const requestSchema = z.object({
  projectId: z.string().min(1, 'projectId는 필수입니다.'),
  platformFeeRate: z.number().min(0).max(1).optional(),
  gatewayFeeOverride: z.number().min(0).optional(),
  notes: z.any().optional()
});

export async function GET(request: NextRequest) {
  const authContext = { headers: request.headers };
  try {
    await requireApiUser({ roles: ['CREATOR', 'ADMIN', 'PARTNER'] }, authContext);
  } catch (error) {
    return handleAuthorizationError(error);
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return buildApiError('projectId 쿼리파라미터가 필요합니다.', 400);
  }

  try {
    const db = await getDb();
    const settlementsList = await db
      .select()
      .from(settlements)
      .where(eq(settlements.projectId, projectId))
      .orderBy(desc(settlements.createdAt));

    return NextResponse.json(settlementsList);
  } catch (error) {
    console.error('정산 조회 실패:', error);
    return buildApiError('정산 데이터를 조회할 수 없습니다.', 500);
  }
}

export async function POST(request: NextRequest) {
  const authContext = { headers: request.headers };
  try {
    await requireApiUser({ roles: ['ADMIN'], permissions: ['settlement:manage'] }, authContext);
  } catch (error) {
    return handleAuthorizationError(error);
  }

  let payload: z.infer<typeof requestSchema>;
  try {
    const rawBody = await request.json();
    payload = requestSchema.parse(rawBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return buildApiError('입력 데이터가 올바르지 않습니다.', 400, error.issues);
    }
    return buildApiError('요청 데이터를 확인할 수 없습니다.', 400);
  }

  const { projectId, platformFeeRate = 0.05, gatewayFeeOverride, notes } = payload;

  try {
    const db = await getDb();
    const settlement = await db.transaction(async (tx) => {
      const project = await tx.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        throw buildApiError('해당 프로젝트를 찾을 수 없습니다.', 404);
      }

      if (!['SUCCESSFUL', 'EXECUTING', 'COMPLETED'].includes(project.status)) {
        throw buildApiError('정산이 가능한 상태의 프로젝트가 아닙니다.', 409);
      }

      const existingPending = await tx.query.settlements.findFirst({
        where: and(eq(settlements.projectId, projectId), eq(settlements.payoutStatus, 'PENDING')),
      });

      if (existingPending) {
        return existingPending;
      }

      // Run consistency check inside transaction for fresh data
      try {
        const consistencyCheck = await validateFundingSettlementConsistency(projectId, tx);
        if (!consistencyCheck.isValid) {
          console.warn('펀딩 데이터 일관성 문제:', consistencyCheck.issues);
        }
      } catch (error) {
        console.warn('펀딩 데이터 검증 실패:', error);
      }

      const fundingsList = await tx.query.fundings.findMany({ where: eq(fundings.projectId, projectId) });
      const totalRaised = fundingsList.reduce((acc, f) => acc + f.amount, 0);

      if (totalRaised <= 0) throw buildApiError('펀딩금액이 없습니다.', 409);
      if (totalRaised < project.targetAmount) throw buildApiError('목표 금액에 도달하지 못했습니다.', 409);

      if (project.currentAmount !== totalRaised) {
        console.warn(`프로젝트 currentAmount(${project.currentAmount})와 실제 펀딩 금액(${totalRaised})이 일치하지 않습니다. 업데이트합니다.`);
        await tx.update(projects).set({ currentAmount: totalRaised }).where(eq(projects.id, projectId));
      }

      const partnerShares = (await tx.query.partnerMatches.findMany({ where: eq(partnerMatches.projectId, projectId) }))
        .filter(m => typeof m.settlementShare === 'number' && m.settlementShare > 0)
        .map(m => ({ stakeholderId: m.partnerId, share: m.settlementShare! / 100 }));

      const collaboratorShares = (await tx.query.projectCollaborators.findMany({ where: eq(projectCollaborators.projectId, projectId) }))
        .filter(c => typeof c.share === 'number' && c.share > 0)
        .map(c => ({ stakeholderId: c.userId, share: c.share! / 100 }));

      const breakdown = calculateSettlementBreakdown({
        totalRaised,
        platformFeeRate,
        gatewayFees: gatewayFeeOverride ?? (totalRaised * 0.03),
        partnerShares,
        collaboratorShares,
      });

      const settlementId = randomUUID();
      const now = new Date().toISOString();

      const [createdSettlement] = await tx.insert(settlements).values({
        id: settlementId,
        projectId,
        totalRaised: breakdown.totalRaised,
        platformFee: breakdown.platformFee,
        creatorShare: breakdown.creatorShare,
        partnerShare: breakdown.partners.reduce((s, p) => s + p.amount, 0),
        collaboratorShare: breakdown.collaborators.reduce((s, c) => s + c.amount, 0),
        gatewayFees: breakdown.gatewayFees,
        netAmount: breakdown.netAmount,
        payoutStatus: 'PENDING',
        notes,
        createdAt: now,
        updatedAt: now,
      }).returning();

      const payoutValues = [
        { stakeholderType: 'PLATFORM', stakeholderId: null, amount: breakdown.platformFee, percentage: breakdown.platformFee / breakdown.totalRaised },
        { stakeholderType: 'CREATOR', stakeholderId: project.ownerId, amount: breakdown.creatorShare, percentage: breakdown.creatorShare / breakdown.totalRaised },
        ...breakdown.partners.map(p => ({ stakeholderType: 'PARTNER', ...p })),
        ...breakdown.collaborators.map(c => ({ stakeholderType: 'COLLABORATOR', ...c }))
      ].filter(p => p.amount > 0).map(p => ({
        id: randomUUID(),
        settlementId,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
        ...p,
      }));

      const createdPayouts = await tx.insert(settlementPayouts).values(payoutValues).returning();

      return { ...createdSettlement, payouts: createdPayouts };
    });

    return NextResponse.json(settlement, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error; // Re-throw response errors from buildApiError
    console.error('정산 생성 실패:', error);
    return buildApiError('정산 데이터를 생성할 수 없습니다.', 500);
  }
}
