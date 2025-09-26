import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import prisma from '@/lib/prisma';

function buildError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
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
    orderBy: { createdAt: 'desc' }
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

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return buildError('해당 프로젝트를 찾을 수 없습니다.', 404);
  }

  const totals = await prisma.funding.aggregate({
    where: { projectId },
    _sum: { amount: true }
  });

  const totalAmount = totals._sum.amount ?? 0;
  if (totalAmount < project.targetAmount) {
    return buildError('목표 금액이 아직 달성되지 않았습니다.', 409);
  }

  const pendingSettlement = await prisma.settlement.findFirst({
    where: { projectId, distributed: false },
    orderBy: { createdAt: 'desc' }
  });

  if (pendingSettlement) {
    return NextResponse.json(pendingSettlement);
  }

  const creatorShare = Math.round(totalAmount * creatorRatio);
  const platformShare = totalAmount - creatorShare;

  const settlement = await prisma.settlement.create({
    data: {
      projectId,
      totalAmount,
      distributed: false,
      creatorShare,
      platformShare
    }
  });

  return NextResponse.json(settlement, { status: 201 });
}
