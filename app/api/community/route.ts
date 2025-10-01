import { NextRequest, NextResponse } from 'next/server';

import { CommunityCategory, ModerationTargetType, PostType } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import type { SessionUser } from '@/lib/auth/session';
import { evaluateAuthorization } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

import type { CommunityFeedResponse } from '@/lib/data/community';

const FEED_CONFIG = {
  pinnedLimit: 5,
  popularLimit: 5,
  trendingLimit: 10,
  trendingDays: 3,
  trendingMinLikes: 5,
  trendingMinComments: 3,
  popularMinLikes: 5,
  popularMinComments: 2
} as const;

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

const toCategorySlug = (category: CommunityCategory | null | undefined) =>
  String(category ?? CommunityCategory.GENERAL).toLowerCase();

const postInclude = {
  author: { select: { id: true, name: true, avatarUrl: true } },
  _count: { select: { likes: true, dislikes: true, comments: true } }
} as const;

type PostWithAuthor = Prisma.PostGetPayload<{ include: typeof postInclude }>;

const mapPostToResponse = (
  post: PostWithAuthor,
  likedSet?: Set<string>,
  dislikedSet?: Set<string>,
  reportMap?: Map<string, number>,
  trendingIds?: Set<string>
) => ({
  id: post.id,
  title: post.title,
  content: post.content,
  likes: post._count.likes,
  comments: post._count.comments,
  dislikes: post._count.dislikes,
  reports: reportMap?.get(post.id) ?? 0,
  category: toCategorySlug(post.category),
  projectId: post.projectId ?? undefined,
  createdAt: post.createdAt.toISOString(),
  liked: likedSet?.has(post.id) ?? false,
  disliked: dislikedSet?.has(post.id) ?? false,
  isPinned: post.isPinned,
  isTrending: trendingIds?.has(post.id) ?? false,
  author: {
    id: post.author?.id ?? '',
    name: post.author?.name ?? '',
    avatarUrl: post.author?.avatarUrl ?? null
  }
});

const isTrendingCandidate = (post: PostWithAuthor) => {
  const { trendingDays, trendingMinComments, trendingMinLikes } = FEED_CONFIG;
  const thresholdDate = new Date(Date.now() - trendingDays * 24 * 60 * 60 * 1000);

  return (
    post.createdAt >= thresholdDate &&
    ((post._count.comments ?? 0) >= trendingMinComments || (post._count.likes ?? 0) >= trendingMinLikes)
  );
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortParam = searchParams.get('sort');
    const sort = sortParam === 'popular' || sortParam === 'trending' ? sortParam : 'recent';
    const limitParam = Number.parseInt(searchParams.get('limit') ?? '10', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 10;
    const cursor = searchParams.get('cursor');
    const projectId = searchParams.get('projectId');
    const authorId = searchParams.get('authorId');
    const search = searchParams.get('search')?.trim() ?? '';
    const categoryParams = searchParams.getAll('category');
    const normalizedCategories = categoryParams
      .map((value) => parseCategory(value))
      .filter((value): value is CommunityCategory => Boolean(value));

    const { user: viewer } = await evaluateAuthorization();

    const baseWhere: Prisma.PostWhereInput = {
      type: PostType.DISCUSSION,
      ...(projectId ? { projectId } : {}),
      ...(authorId ? { authorId } : {}),
      ...(normalizedCategories.length ? { category: { in: normalizedCategories } } : {}),
      ...(search
        ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } }
          ]
        }
        : {})
    };

    const baseOrderBy: Prisma.PostOrderByWithRelationInput[] = [{ createdAt: 'desc' }];

    const applyCursor = sort === 'recent' && cursor;

    const posts = await prisma.post.findMany({
      where: baseWhere,
      include: postInclude,
      orderBy: baseOrderBy,
      take: limit,
      ...(applyCursor ? { skip: 1, cursor: { id: cursor } } : {})
    });

    const popularityPoolSize = Math.max(limit * 3, FEED_CONFIG.popularLimit * 3, FEED_CONFIG.trendingLimit * 3);

    const [pinnedRaw, popularityPool] = await Promise.all([
      prisma.post.findMany({
        where: { ...baseWhere, isPinned: true },
        include: postInclude,
        take: FEED_CONFIG.pinnedLimit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.post.findMany({
        where: baseWhere,
        include: postInclude,
        orderBy: baseOrderBy,
        take: popularityPoolSize
      })
    ]);

    const popularityScore = (post: PostWithAuthor) => post._count.likes * 3 + post._count.comments * 2;

    const popularSorted = [...popularityPool].sort((a, b) => {
      const scoreDiff = popularityScore(b) - popularityScore(a);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const popularRaw = popularSorted
      .filter(
        (post) =>
          (post._count.likes ?? 0) >= FEED_CONFIG.popularMinLikes ||
          (post._count.comments ?? 0) >= FEED_CONFIG.popularMinComments
      )
      .slice(0, FEED_CONFIG.popularLimit);

    const trendingRaw = popularityPool
      .filter(isTrendingCandidate)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, FEED_CONFIG.trendingLimit);

    let feedPosts = posts;

    if (sort === 'popular') {
      feedPosts = popularSorted.slice(0, limit);
    } else if (sort === 'trending') {
      feedPosts = trendingRaw.slice(0, limit);
    }

    const nextCursor =
      sort === 'recent' && feedPosts.length === limit ? feedPosts[feedPosts.length - 1]?.id ?? null : null;

    const allPostIds = new Set<string>();
    for (const collection of [feedPosts, pinnedRaw, popularRaw, trendingRaw]) {
      for (const post of collection) {
        allPostIds.add(post.id);
      }
    }

    let likedSet: Set<string> | undefined;
    let dislikedSet: Set<string> | undefined;

    if (viewer && allPostIds.size > 0) {
      const [likes, dislikes] = await Promise.all([
        prisma.postLike.findMany({
          where: {
            userId: viewer.id,
            postId: { in: Array.from(allPostIds) }
          }
        }),
        prisma.postDislike.findMany({
          where: {
            userId: viewer.id,
            postId: { in: Array.from(allPostIds) }
          }
        })
      ]);

      likedSet = new Set(likes.map((entry) => entry.postId));
      dislikedSet = new Set(dislikes.map((entry) => entry.postId));
    }

    let reportMap: Map<string, number> | undefined;
    if (allPostIds.size > 0) {
      const reportCounts = await prisma.moderationReport.groupBy({
        by: ['targetId'],
        where: {
          targetType: ModerationTargetType.POST,
          targetId: { in: Array.from(allPostIds) }
        },
        _count: { _all: true }
      });
      reportMap = new Map(
        reportCounts.map((entry) => [entry.targetId, entry._count?._all ?? 0])
      );
    }

    const trendingIds = new Set(trendingRaw.map((post) => post.id));

    const response: CommunityFeedResponse = {
      posts: feedPosts.map((post) => mapPostToResponse(post, likedSet, dislikedSet, reportMap, trendingIds)),
      pinned: pinnedRaw.map((post) => mapPostToResponse(post, likedSet, dislikedSet, reportMap, trendingIds)),
      popular: popularRaw.map((post) => mapPostToResponse(post, likedSet, dislikedSet, reportMap, trendingIds)),
      meta: {
        nextCursor,
        total: await prisma.post.count({ where: baseWhere }),
        sort: sort as 'recent' | 'popular' | 'trending',
        categories: normalizedCategories.length
          ? normalizedCategories.map((category) => toCategorySlug(category))
          : ['all'],
        search: search || null,
        authorId: authorId ?? null,
        projectId: projectId ?? null
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch posts from database:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });

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
        author: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { likes: true, dislikes: true, comments: true } }
      }
    });

    const created = mapPostToResponse(post);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create post in database.', error);
    return NextResponse.json({ message: 'Unable to create community post.' }, { status: 500 });
  }
}

