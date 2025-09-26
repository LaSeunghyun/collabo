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

function mapPostToResponse(post: any): CommunityPost {
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
    console.error('[community.ensureDemoUser]', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') ?? undefined;

    const posts = await prisma.post.findMany({
      where: projectId
        ? {
            projectId
          }
        : undefined,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(posts.map(mapPostToResponse));
  } catch (error) {
    console.error('[community.GET]', error);
    return NextResponse.json(
      demoCommunityPosts.map((post) => ({
        ...post,
        comments: post.comments.map((comment) => ({
          ...comment
        }))
      })),
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    await ensureDemoUser();

    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        projectId: body.projectId ?? undefined,
        authorId: body.authorId ?? DEMO_USER.id
      },
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

    return NextResponse.json(mapPostToResponse(post), { status: 201 });
  } catch (error) {
    console.error('[community.POST]', error);
    return NextResponse.json(
      {
        id: crypto.randomUUID(),
        title: body.title,
        content: body.content,
        projectId: body.projectId ?? undefined,
        createdAt: new Date().toISOString(),
        likes: 0,
        commentsCount: 0,
        comments: [],
        likedBy: [],
        author: {
          id: DEMO_USER.id,
          name: DEMO_USER.name
        }
      },
      { status: 201 }
    );
  }
}
