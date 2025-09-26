import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

import { findDemoCommunityPost, updateDemoCommunityPost } from '@/lib/data/community';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { postLikes: true, comments: true } }
      }
    });

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: post.id,
      title: post.title,
      content: post.content,
      likes: post._count.postLikes,
      comments: post._count.comments,
      projectId: post.projectId ?? undefined,
      createdAt: post.createdAt.toISOString(),
      liked: false
    });
  } catch (error) {
    console.error('Failed to load post from database, using demo data.', error);
    const post = findDemoCommunityPost(params.id);
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
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

  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { postLikes: true, comments: true } }
      }
    });

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: post.id,
      title: post.title,
      content: post.content,
      likes: post._count.postLikes,
      comments: post._count.comments,
      projectId: post.projectId ?? undefined,
      createdAt: post.createdAt.toISOString(),
      liked: shouldLike
    });
  } catch (error) {
    console.error('Failed to update post likes in database, using demo data.', error);

    const updated = updateDemoCommunityPost(params.id, (post) => ({
      ...post,
      liked: shouldLike,
      likes: Math.max(0, (post.likes ?? 0) + (shouldLike ? 1 : -1))
    }));

    if (!updated) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  }
}
