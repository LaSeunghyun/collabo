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

export const GET = withPrisma(async ({ prisma }) => {
  const posts = await prisma.post.findMany({
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
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(posts.map(mapPost));
});

export const POST = withPrisma(async ({ request, prisma }) => {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return jsonError('요청 본문을 확인할 수 없습니다.');
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : undefined;

  if (!title || !content) {
    return jsonError('게시글 제목과 내용을 입력해주세요.');
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

  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return jsonError('연결된 프로젝트를 찾을 수 없습니다.', 404);
    }
  }

  const post = await prisma.post.create({
    data: {
      title,
      content,
      projectId: projectId ?? null,
      authorId: user.id
    },
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

  return NextResponse.json(mapPost(post), { status: 201 });
});
