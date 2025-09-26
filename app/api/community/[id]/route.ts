import { NextRequest, NextResponse } from 'next/server';

import {
  demoCommunityPosts,
  type CommunityPost,
  type CommunityComment
} from '@/lib/data/community';
import { prisma } from '@/lib/prisma';

const DEMO_USER = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@collaborium.ai'
};

function mapPost(post: any): CommunityPost {
  const comments: CommunityComment[] = (post.comments ?? []).map((comment: any) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt?.toISOString?.() ?? comment.createdAt,
    author: comment.author
      ? {
          id: comment.author.id,
          name: comment.author.name,
          image: comment.author.image ?? null
        }
      : undefined
  }));

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    likes:
      post._count?.likes ??
      (Array.isArray(post.likes) ? post.likes.length : post.likes ?? 0),
    commentsCount:
      post._count?.comments ??
      (typeof post.commentsCount === 'number'
        ? post.commentsCount
        : comments.length),
    projectId: post.projectId ?? undefined,
    createdAt: post.createdAt?.toISOString?.() ?? post.createdAt,
    author: post.author
      ? {
          id: post.author.id,
          name: post.author.name,
          image: post.author.image ?? null
        }
      : undefined,
    comments,
    likedBy: Array.isArray(post.likedBy)
      ? post.likedBy
      : Array.isArray(post.likes)
        ? post.likes.map((like: any) =>
            typeof like === 'string' ? like : like?.userId ?? ''
          ).filter(Boolean)
        : []
  };
}

async function ensureDemoUser() {
  try {
    await prisma.user.upsert({
      where: { id: DEMO_USER.id },
      update: { name: DEMO_USER.name, email: DEMO_USER.email },
      create: {
        id: DEMO_USER.id,
        name: DEMO_USER.name,
        email: DEMO_USER.email
      }
    });
  } catch (error) {
    console.error('[communityId.ensureDemoUser]', error);
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        likes: true,
        _count: {
          select: {
            comments: true,
            likes: true
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(mapPost(post));
  } catch (error) {
    console.error('[communityId.GET]', error);
    const fallback = demoCommunityPosts.find((item) => item.id === params.id);
    if (!fallback) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json(fallback);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  if (body.action !== 'toggleLike') {
    return NextResponse.json({ message: 'Unsupported action' }, { status: 400 });
  }

  const userId = body.userId ?? DEMO_USER.id;

  try {
    await ensureDemoUser();

    const existingLike = await prisma.like.findFirst({
      where: {
        postId: params.id,
        userId
      }
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
    } else {
      await prisma.like.create({
        data: {
          postId: params.id,
          userId
        }
      });
    }

    const likes = await prisma.like.count({
      where: { postId: params.id }
    });

    return NextResponse.json({ liked: !existingLike, likes });
  } catch (error) {
    console.error('[communityId.PATCH]', error);
    return NextResponse.json(
      {
        liked: body.nextLiked ?? false,
        likes: body.nextLikes ?? body.currentLikes ?? 0
      },
      { status: 200 }
    );
  }
}
