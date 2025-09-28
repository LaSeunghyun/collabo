import { NextRequest, NextResponse } from 'next/server';

import { CommunityCategory } from '@prisma/client';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { evaluateAuthorization } from '@/lib/auth/session';
import type { SessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const buildPostResponse = async (postId: string, viewerId?: string | null) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } }
    }
  });

  if (!post) {
    return null;
  }

  const liked = viewerId
    ? Boolean(
        await prisma.postLike.findUnique({
          where: { postId_userId: { postId, userId: viewerId } }
        })
      )
    : false;

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    likes: post._count.likes,
    comments: post._count.comments,
    dislikes: 0,
    reports: 0,
    projectId: post.projectId ?? undefined,
    createdAt: post.createdAt.toISOString(),
    liked,
    category: (post.category as CommunityCategory).toLowerCase(),
    isPinned: post.isPinned,
    isTrending: false,
    author: {
      id: post.author.id,
      name: post.author.name,
      avatarUrl: post.author.avatarUrl
    }
  };
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user: viewer } = await evaluateAuthorization();
    const post = await buildPostResponse(params.id, viewer?.id);

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Failed to load post.', error);
    return NextResponse.json({ message: 'Unable to load post.' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const likeValue: unknown = body.like ?? body.liked ?? body.action;
  const shouldLike =
    typeof likeValue === 'string'
      ? likeValue === 'like'
      : typeof likeValue === 'boolean'
        ? likeValue
        : body.action === 'like';

  let sessionUser: SessionUser;

  try {
    sessionUser = await requireApiUser({});
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

  try {
    const existing = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true } });

    if (!existing) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    if (shouldLike) {
      await prisma.postLike.upsert({
        where: {
          postId_userId: {
            postId: params.id,
            userId: sessionUser.id
          }
        },
        create: {
          postId: params.id,
          userId: sessionUser.id
        },
        update: {}
      });
    } else {
      await prisma.postLike.deleteMany({
        where: {
          postId: params.id,
          userId: sessionUser.id
        }
      });
    }

    const updated = await buildPostResponse(params.id, sessionUser.id);

    if (!updated) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update post likes.', error);
    return NextResponse.json({ message: 'Unable to update like state.' }, { status: 500 });
  }
}
