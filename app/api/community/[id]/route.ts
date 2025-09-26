import type { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

import { jsonError } from '@/lib/api/responses';
import { withPrisma } from '@/lib/api/withPrisma';
import { AuthenticationError, requireUser } from '@/lib/auth/session';

function mapPost(post: {
  id: string;
  title: string;
  content: string;
  projectId: string | null;
  createdAt: Date;
  author: { id: string; name: string | null; email: string } | null;
  _count: { likes: number; comments: number };
}) {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    projectId: post.projectId ?? undefined,
    createdAt: post.createdAt,
    likes: post._count.likes,
    comments: post._count.comments,
    author: post.author
      ? {
          id: post.author.id,
          name: post.author.name,
          email: post.author.email
        }
      : undefined
  };
}

async function resolvePost(prisma: PrismaClient, id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          likes: true,
          comments: true
        }
      }
    }
  });
}

export const GET = withPrisma<{ id: string }>(async ({ params, prisma }) => {
  const post = await resolvePost(prisma, params.id);
  if (!post) {
    return jsonError('게시글을 찾을 수 없습니다.', 404);
  }

  return NextResponse.json(mapPost(post));
});

export const PATCH = withPrisma<{ id: string }>(async ({ request, params, prisma }) => {
  const post = await resolvePost(prisma, params.id);
  if (!post) {
    return jsonError('게시글을 찾을 수 없습니다.', 404);
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

  if (!post.author || post.author.id !== user.id) {
    return jsonError('게시글을 수정할 권한이 없습니다.', 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('요청 본문을 확인할 수 없습니다.');
  }

  const data: { title?: string; content?: string; projectId?: string | null } = {};

  if (typeof body.title === 'string' && body.title.trim()) {
    data.title = body.title.trim();
  }

  if (typeof body.content === 'string' && body.content.trim()) {
    data.content = body.content.trim();
  }

  if (body.projectId !== undefined) {
    if (body.projectId === null) {
      data.projectId = null;
    } else if (typeof body.projectId === 'string') {
      const projectId = body.projectId.trim();
      if (!projectId) {
        data.projectId = null;
      } else {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
          return jsonError('연결된 프로젝트를 찾을 수 없습니다.', 404);
        }
        data.projectId = projectId;
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return jsonError('변경할 항목을 확인할 수 없습니다.', 422);
  }

  const updated = await prisma.post.update({
    where: { id: params.id },
    data,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          likes: true,
          comments: true
        }
      }
    }
  });

  return NextResponse.json(mapPost(updated));
});

export const DELETE = withPrisma<{ id: string }>(async ({ params, prisma }) => {
  const post = await resolvePost(prisma, params.id);
  if (!post) {
    return jsonError('게시글을 찾을 수 없습니다.', 404);
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

  if (!post.author || post.author.id !== user.id) {
    return jsonError('게시글을 삭제할 권한이 없습니다.', 403);
  }

  await prisma.post.delete({ where: { id: params.id } });

  return NextResponse.json({ message: 'Deleted' });
});
