import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';

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
    return buildError('projectId �Ķ���Ͱ� �ʿ��մϴ�.');
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
    console.error('���� ��ȸ ����:', error);
    return buildError('���� ������ ��ȸ�� �� �����ϴ�.', 500);
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
    return buildError('��û ������ Ȯ���� �� �����ϴ�.');
  }

  const { projectId, platformFeeRate = 0.05, gatewayFeeOverride, notes } = payload;

  try {
    const db = await getDb();
    
    // ������Ʈ ���� ��ȸ
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
      return buildError('�ش� ������Ʈ�� ã�� �� �����ϴ�.', 404);
    }

    if (
      project.status !== 'SUCCESSFUL' &&
      project.status !== 'EXECUTING' &&
      project.status !== 'COMPLETED'
    ) {
      return buildError('������ ������ ������ ������Ʈ�� ������ ������ �� �ֽ��ϴ�.', 409);
    }

    // ���� ��� ���� ���� Ȯ��
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

    // �ݵ� ���� ��ȸ
    const fundingsList = await db
      .select({
        id: fundings.id,
        amount: fundings.amount
      })
      .from(fundings)
      .where(eq(fundings.projectId, projectId));

    const totalRaised = fundingsList.reduce((acc, funding) => acc + funding.amount, 0);
    if (totalRaised <= 0) {
      return buildError('��ݾ��� �����մϴ�.', 409);
    }

    if (totalRaised < project.targetAmount) {
      return buildError('��ǥ �ݾ��� ���� �޼����� ���߽��ϴ�.', 409);
    }

    // ������Ʈ currentAmount�� �ֱ� ���� �ݾ� ��ġ ���� Ȯ��
    if (project.currentAmount !== totalRaised) {
      console.warn(`������Ʈ currentAmount(${project.currentAmount})�� �ֱ� ���� �ݾ�(${totalRaised})�� ��ġ���� �ʽ��ϴ�.`);
      // ������ �ϰ����� ���� currentAmount�� ������Ʈ
      await db
        .update(projects)
        .set({ currentAmount: totalRaised })
        .where(eq(projects.id, projectId));
    }

    // Gateway fee�� ������ ����ϰų� �⺻�� ���
    const inferredGatewayFees = gatewayFeeOverride ?? (totalRaised * 0.03); // �⺻ 3% ������

    // ��Ʈ�� ��ġ ���� ��ȸ
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

    // ������ ���� ��ȸ
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
    const message = error instanceof Error ? error.message : '���� ��� ��꿡 �����߽��ϴ�.';
    return buildError(message, 422);
  }

    // Drizzle Ʈ��������� ���� ����
    const settlement = await db.transaction(async (tx) => {
      const settlementId = crypto.randomUUID();
      const now = new Date().toISOString();

      // ���� ����
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

      // ���� ���� ���� ����
      const payoutValues = payoutPayload.map((payout) => ({
        id: crypto.randomUUID(),
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
    console.error('���� ���� ����:', error);
    return buildError('���� ������ �����߽��ϴ�.', 500);
  }
}

function normaliseShare(value: number, hundredScale = false) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  const normalised = hundredScale ? value / 100 : value;
  return normalised > 1 ? normalised / 100 : normalised;
}
