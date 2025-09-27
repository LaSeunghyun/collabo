import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

import {
  addDemoCommunityComment,
  getDemoCommunityComments
} from '@/lib/data/community';
import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import type { SessionUser } from '@/lib/auth/session';

function formatComment(comment: {
  id: string;
  postId: string;
  content: string;
  createdAt: Date;
  author?: { name: string | null } | null;
}) {
  return {
    id: comment.id,
    postId: comment.postId,
    content: comment.content,
    authorName: comment.author?.name ?? 'Guest',
    createdAt: comment.createdAt.toISOString()
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: params.id },
      include: { author: true },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(comments.map((comment: { id: string; postId: string; content: string; createdAt: Date; author?: { name: string | null } | null }) => formatComment(comment)));
  } catch (error) {
    console.error('Failed to load comments from database, using demo data.', error);
    return NextResponse.json(getDemoCommunityComments(params.id));
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const body = await request.json();
  const content = body.content?.trim();

  if (!content) {
    return NextResponse.json({ message: 'Content is required.' }, { status: 400 });
  }

  try {
    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: params.id,
        authorId: sessionUser.id
      },
      include: { author: true }
    });

    return NextResponse.json(formatComment(comment), { status: 201 });
  } catch (error) {
    console.error('Failed to create comment in database, using demo data.', error);
    const fallbackComment = addDemoCommunityComment(params.id, {
      id: crypto.randomUUID(),
      postId: params.id,
      content,
      authorName: sessionUser.name ?? 'Guest',
      createdAt: new Date().toISOString()
    });

    return NextResponse.json(fallbackComment, { status: 201 });
  }
}
