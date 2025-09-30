import { NextRequest, NextResponse } from 'next/server';
import { CommunityCategory, PostType } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { evaluateAuthorization } from '@/lib/auth/session';
import type { SessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

import type { CommunityFeedResponse } from '@/lib/data/community';

const parseCategory = (value: string | null): CommunityCategory | undefined => {
  if (!value) {
    return undefined;
  }

  if (value === 'all') {
    return undefined;
  }

  const normalized = value.toUpperCase();
  const match = (Object.values(CommunityCategory) as string[]).find(
    (option) => option === normalized
  );

  if (match) {
    return match as CommunityCategory;
  }

  return undefined;
};


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortParam = searchParams.get('sort');
    const sort = sortParam === 'popular' || sortParam === 'trending' ? sortParam : 'recent';
    const limitParam = Number.parseInt(searchParams.get('limit') ?? '10', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 10;

    await evaluateAuthorization();

    // 기본 쿼리 조건
    const baseWhere: Prisma.PostWhereInput = {
      type: PostType.DISCUSSION
    };

    // 트렌딩의 경우 최근 7일 내 게시글만 필터링
    if (sort === 'trending') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      baseWhere.createdAt = {
        gte: sevenDaysAgo
      };
    }

    // 게시글 조회를 위한 include 설정
    const postInclude = {
      author: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } }
    } as const;
    type PostWithAuthor = Prisma.PostGetPayload<{ include: typeof postInclude }>;

    // 정렬 방식에 따른 orderBy 설정
    let orderBy: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[];
    switch (sort) {
      case 'trending':
        // 트렌딩: 최근 7일 내 게시글 중 좋아요와 댓글 수가 많은 순
        orderBy = [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ];
        break;
      case 'popular':
        // 인기: 전체 기간 동안 좋아요와 댓글 수가 많은 순
        orderBy = [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ];
        break;
      default:
        // 최신: 생성일 기준 내림차순
        orderBy = [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ];
    }

    const posts: PostWithAuthor[] = await prisma.post.findMany({
      where: baseWhere,
      include: postInclude,
      orderBy,
      take: Math.min(limit, 20) // 최대 20개로 제한
    });

    // 기본 응답 구조
    const response: CommunityFeedResponse = {
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        likes: post._count.likes,
        comments: post._count.comments,
        dislikes: 0,
        reports: 0,
        category: String(post.category ?? CommunityCategory.GENERAL).toLowerCase(),
        projectId: post.projectId ?? undefined,
        createdAt: post.createdAt.toISOString(),
        liked: false,
        isPinned: post.isPinned,
        isTrending: false,
        author: {
          id: post.author?.id || '',
          name: post.author?.name || '',
          avatarUrl: post.author?.avatarUrl || null
        }
      })),
      pinned: [],
      popular: [],
      meta: {
        nextCursor: null,
        total: posts.length,
        sort: sort as 'recent' | 'popular' | 'trending',
        categories: ['all'],
        search: null,
        authorId: null
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch posts from database.', error);

    // 더 자세한 에러 정보 제공
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json({
      message: 'Unable to load community posts',
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = body.title?.trim();
  const content = body.content?.trim();
  const projectId = body.projectId ? String(body.projectId) : undefined;
  const category = parseCategory(body.category ?? null) ?? CommunityCategory.GENERAL;

  if (!title || !content) {
    return NextResponse.json({ message: 'Title and content are required.' }, { status: 400 });
  }

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
    const post = await prisma.post.create({
      data: {
        title,
        content,
        type: PostType.DISCUSSION,
        category,
        authorId: sessionUser.id,
        projectId: projectId ?? undefined
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    return NextResponse.json(
      {
        id: post.id,
        title: post.title,
        content: post.content,
        likes: 0,
        comments: 0,
        dislikes: 0,
        reports: 0,
        projectId: post.projectId ?? undefined,
        createdAt: post.createdAt.toISOString(),
        liked: false,
        category: String(post.category ?? CommunityCategory.GENERAL).toLowerCase(),
        isPinned: post.isPinned,
        isTrending: false,
        author: {
          id: post.author?.id || '',
          name: post.author?.name || '',
          avatarUrl: post.author?.avatarUrl || null
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create post in database.', error);
    return NextResponse.json({ message: 'Unable to create community post.' }, { status: 500 });
  }
}
