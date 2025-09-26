import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

import {
  addDemoCommunityComment,
  getDemoCommunityComments
} from '@/lib/data/community';

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

    return NextResponse.json(comments.map((comment) => formatComment(comment)));
  } catch (error) {
    console.error('Failed to load comments from database, using demo data.', error);
    return NextResponse.json(getDemoCommunityComments(params.id));
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const content = body.content?.trim();
  const authorName = body.authorName?.trim() || 'Guest';
  const authorEmail = body.authorEmail?.trim();
  let authorId = body.authorId ? String(body.authorId) : undefined;

  if (!content) {
    return NextResponse.json({ message: 'Content is required.' }, { status: 400 });
  }

  try {
    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    if (authorId) {
      const existing = await prisma.user.findUnique({ where: { id: authorId } });
      if (!existing) {
        authorId = undefined;
      }
    }

    if (!authorId) {
      const safeEmail =
        authorEmail && authorEmail.includes('@')
          ? authorEmail
          : `guest-${crypto.randomUUID()}@example.com`;
      const user = await prisma.user.create({
        data: {
          name: authorName,
          email: safeEmail,
          role: 'fan'
        }
      });
      authorId = user.id;
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: params.id,
        authorId
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
      authorName,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json(fallbackComment, { status: 201 });
  }
}
