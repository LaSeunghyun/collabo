import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

class SettlementError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function buildError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return buildError('projectId 파라미터가 필요합니다.');
  }

  const settlements = await prisma.settlement.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(settlements);
}

export async function POST(request: NextRequest) {
  let body: { projectId?: string; creatorRatio?: number };

  try {
    body = await request.json();
  } catch {
    return buildError('요청 본문을 확인할 수 없습니다.');
  }

  const { projectId, creatorRatio = 0.7 } = body;

  if (!projectId) {
    return buildError('프로젝트 정보가 필요합니다.');
  }

  if (Number.isNaN(creatorRatio) || creatorRatio <= 0 || creatorRatio >= 1) {
    return buildError('creatorRatio는 0과 1 사이의 숫자여야 합니다.');
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({ where: { id: projectId } });
      if (!project) {
        throw new SettlementError('해당 프로젝트를 찾을 수 없습니다.', 404);
      }

      const totals = await tx.funding.aggregate({
        where: { projectId },
        _sum: { amount: true }
      });

      const totalAmount = totals._sum.amount ?? 0;
      if (totalAmount < project.targetAmount) {
        throw new SettlementError('목표 금액이 아직 달성되지 않았습니다.', 409);
      }

      const pendingSettlement = await tx.settlement.findFirst({
        where: { projectId, distributed: false },
        orderBy: { createdAt: 'desc' }
      });

      if (pendingSettlement) {
        return { settlement: pendingSettlement, created: false } as const;
      }

      const creatorShare = Math.round(totalAmount * creatorRatio);
      const platformShare = totalAmount - creatorShare;

      const settlement = await tx.settlement.create({
        data: {
          projectId,
          totalAmount,
          distributed: false,
          creatorShare,
          platformShare
        }
      });

      await tx.project.update({
        where: { id: projectId },
        data: { status: 'settlement_pending' }
      });

      return { settlement, created: true } as const;
    });

    return NextResponse.json(result.settlement, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof SettlementError) {
      return buildError(error.message, error.status);
    }

    const message = error instanceof Error ? error.message : '정산 처리 중 오류가 발생했습니다.';
    return buildError(message, 500);
  }
}

export async function PATCH(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return buildError('요청 본문을 확인할 수 없습니다.');
  }

  const settlementId = typeof body.settlementId === 'string' ? body.settlementId.trim() : '';
  const distributed = body.distributed === undefined ? true : Boolean(body.distributed);

  if (!settlementId) {
    return buildError('정산 정보를 확인할 수 없습니다.');
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const settlement = await tx.settlement.findUnique({ where: { id: settlementId } });
      if (!settlement) {
        throw new SettlementError('정산 내역을 찾을 수 없습니다.', 404);
      }

      if (settlement.distributed === distributed) {
        return settlement;
      }

      const nextStatus = distributed ? 'settled' : 'settlement_pending';

      const result = await tx.settlement.update({
        where: { id: settlementId },
        data: { distributed }
      });

      await tx.project.update({
        where: { id: settlement.projectId },
        data: { status: nextStatus }
      });

      return result;
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof SettlementError) {
      return buildError(error.message, error.status);
    }

    const message = error instanceof Error ? error.message : '정산 업데이트 중 오류가 발생했습니다.';
    return buildError(message, 500);
  }
}
