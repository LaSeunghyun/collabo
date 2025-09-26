import { NextResponse } from 'next/server';

import { formatProject, projectWithMetricsInclude } from '@/lib/api/projects';
import { jsonError } from '@/lib/api/responses';
import { withPrisma } from '@/lib/api/withPrisma';
import { AuthenticationError, requireUser } from '@/lib/auth/session';

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

export const GET = withPrisma(async ({ prisma }) => {
  const projects = await prisma.project.findMany({
    include: projectWithMetricsInclude,
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(projects.map(formatProject));
});

export const POST = withPrisma(async ({ request, prisma }) => {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return jsonError('요청 본문을 확인할 수 없습니다.');
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const thumbnail = typeof body.thumbnail === 'string' ? body.thumbnail.trim() : undefined;
  const targetAmount = parseTargetAmount(body.targetAmount);

  if (!title || !description || !category) {
    return jsonError('프로젝트 정보가 충분하지 않습니다.');
  }

  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    return jsonError('목표 금액이 올바르지 않습니다.');
  }

  let user;
  try {
    ({ user } = await requireUser());
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return jsonError(error.message, error.status);
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
    include: projectWithMetricsInclude
  });

  return NextResponse.json(formatProject(project), { status: 201 });
});
