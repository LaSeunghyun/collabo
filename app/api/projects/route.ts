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

export async function GET() {
  const projects = await prisma.project.findMany({
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
    },
    orderBy: { createdAt: 'desc' }
  });

  const formatted = projects.map(({ _count, owner, ...project }) => ({
    ...project,
    owner,
    metrics: {
      fundings: _count.fundings,
      settlements: _count.settlements
    }
  }));

  return NextResponse.json(formatted);
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return buildError('요청 본문을 확인할 수 없습니다.');
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const thumbnail = typeof body.thumbnail === 'string' ? body.thumbnail.trim() : undefined;
  const targetAmount = parseTargetAmount(body.targetAmount);

  if (!title || !description || !category) {
    return buildError('프로젝트 정보가 충분하지 않습니다.');
  }

  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    return buildError('목표 금액이 올바르지 않습니다.');
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

  const project = await prisma.project.create({
    data: {
      title,
      description,
      category,
      targetAmount,
      thumbnail,
      ownerId: user.id
    },
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

  const { _count, ...projectData } = project;

  return NextResponse.json(
    {
      ...projectData,
      metrics: {
        fundings: _count.fundings,
        settlements: _count.settlements
      }
    },
    { status: 201 }
  );
}
