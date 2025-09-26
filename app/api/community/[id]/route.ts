import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { AuthenticationError, requireUser } from '@/lib/auth/session';

function buildError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

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

async function resolvePost(id: string) {
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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = await resolvePost(params.id);
  if (!post) {
    return buildError('게시글을 찾을 수 없습니다.', 404);
  }

  return NextResponse.json(mapPost(post));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = await resolvePost(params.id);
  if (!post) {
    return buildError('게시글을 찾을 수 없습니다.', 404);
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

  if (!post.author || post.author.id !== user.id) {
    return buildError('게시글을 수정할 권한이 없습니다.', 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return buildError('요청 본문을 확인할 수 없습니다.');
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
          return buildError('연결된 프로젝트를 찾을 수 없습니다.', 404);
        }
        data.projectId = projectId;
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return buildError('변경할 항목을 확인할 수 없습니다.', 422);
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
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = await resolvePost(params.id);
  if (!post) {
    return buildError('게시글을 찾을 수 없습니다.', 404);
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

  if (!post.author || post.author.id !== user.id) {
    return buildError('게시글을 삭제할 권한이 없습니다.', 403);
  }

  await prisma.post.delete({ where: { id: params.id } });

  return NextResponse.json({ message: 'Deleted' });
}
