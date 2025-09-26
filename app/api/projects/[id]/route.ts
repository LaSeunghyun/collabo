import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { AuthenticationError, requireUser } from '@/lib/auth/session';

function buildError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseTargetAmount(value: unknown) {
  if (typeof value === 'number') {
    return Math.round(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return Number.NaN;
}

function formatProject(project: {
  _count: { fundings: number; settlements: number };
  owner: { id: string; name: string | null; email: string };
} & Record<string, unknown>) {
  const { _count, ...projectData } = project;
  return {
    ...projectData,
    metrics: {
      fundings: _count.fundings,
      settlements: _count.settlements
    }
  };
}

async function resolveProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          fundings: true,
          settlements: true
        }
      }
    }
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await resolveProject(params.id);
  if (!project) {
    return buildError('해당 프로젝트를 찾을 수 없습니다.', 404);
  }

  return NextResponse.json(formatProject(project));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return buildError('요청 본문을 확인할 수 없습니다.');
  }

  const project = await resolveProject(params.id);
  if (!project) {
    return buildError('해당 프로젝트를 찾을 수 없습니다.', 404);
  }

  let user;
  try {
    ({ user } = await requireUser());
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return buildError(error.message, error.status);
    }
    throw error;
  }

  if (project.owner.id !== user.id) {
    return buildError('프로젝트를 수정할 권한이 없습니다.', 403);
  }

  const data: Prisma.ProjectUpdateInput = {};

  if (typeof body.title === 'string' && body.title.trim()) {
    data.title = body.title.trim();
  }

  if (typeof body.description === 'string' && body.description.trim()) {
    data.description = body.description.trim();
  }

  if (typeof body.category === 'string' && body.category.trim()) {
    data.category = body.category.trim();
  }

  if (typeof body.status === 'string' && body.status.trim()) {
    data.status = body.status.trim();
  }

  if (typeof body.thumbnail === 'string') {
    const thumbnail = body.thumbnail.trim();
    data.thumbnail = thumbnail.length > 0 ? thumbnail : null;
  }

  if (body.targetAmount !== undefined) {
    const targetAmount = parseTargetAmount(body.targetAmount);
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      return buildError('목표 금액이 올바르지 않습니다.');
    }
    data.targetAmount = targetAmount;
  }

  if (Object.keys(data).length === 0) {
    return buildError('변경할 항목을 확인할 수 없습니다.', 422);
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          fundings: true,
          settlements: true
        }
      }
    }
  });

  return NextResponse.json(formatProject(updated));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await resolveProject(params.id);
  if (!project) {
    return buildError('해당 프로젝트를 찾을 수 없습니다.', 404);
  }

  let user;
  try {
    ({ user } = await requireUser());
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return buildError(error.message, error.status);
    }
    throw error;
  }

  if (project.owner.id !== user.id) {
    return buildError('프로젝트를 삭제할 권한이 없습니다.', 403);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.funding.deleteMany({ where: { projectId: params.id } });
      await tx.settlement.deleteMany({ where: { projectId: params.id } });
      await tx.post.updateMany({ where: { projectId: params.id }, data: { projectId: null } });
      await tx.project.delete({ where: { id: params.id } });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '프로젝트 삭제 중 오류가 발생했습니다.';
    return buildError(message, 500);
  }

  return NextResponse.json({ message: 'Deleted' });
}
