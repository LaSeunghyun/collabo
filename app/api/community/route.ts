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
    const authContext = { headers: request.headers };
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

    const { user: viewer } = await evaluateAuthorization({}, authContext);

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
    console.error('Failed to fetch posts from database:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
      timestamp: new Date().toISOString()
    });

    const { searchParams } = new URL(request.url);
    const sortParam = searchParams.get('sort');
    const fallbackSort = (sortParam === 'popular' || sortParam === 'trending' ? sortParam : 'recent') as 'recent' | 'popular' | 'trending';
    const fallbackCategories = searchParams
      .getAll('category')
      .map((value) => parseCategory(value))
      .filter((value): value is CommunityCategory => Boolean(value));
    const fallbackCategorySlugs = fallbackCategories.length
      ? fallbackCategories.map((category) => toCategorySlug(category))
      : ['all'];

    const fallbackResponse: CommunityFeedResponse = {
      posts: [],
      pinned: [],
      popular: [],
      meta: {
        nextCursor: null,
        total: 0,
        sort: fallbackSort,
        categories: fallbackCategorySlugs,
        search: searchParams.get('search')?.trim() || null,
        authorId: searchParams.get('authorId'),
        projectId: searchParams.get('projectId')
      }
    };

    return NextResponse.json(fallbackResponse);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received POST request body:', { 
      title: body.title?.substring(0, 50) + '...', 
      content: body.content?.substring(0, 50) + '...', 
      category: body.category,
      hasProjectId: !!body.projectId 
    });
    
    const title = body.title?.trim();
    const content = body.content?.trim();
    const projectId = body.projectId ? String(body.projectId) : undefined;
    const category = parseCategory(body.category ?? null) ?? CommunityCategory.GENERAL;
    const authContext = { headers: request.headers };

    if (!title || !content) {
      console.log('Validation failed: missing title or content', { title: !!title, content: !!content });
      return NextResponse.json({ message: 'Title and content are required.' }, { status: 400 });
    }

    let sessionUser: SessionUser;

    try {
      sessionUser = await requireApiUser({}, authContext);
      console.log('User authenticated:', { userId: sessionUser.id, userRole: sessionUser.role });
    } catch (error) {
      console.error('Authentication failed:', error);
      const response = handleAuthorizationError(error);
      if (response) {
        return response;
      }

      throw error;
    }

    try {
      console.log('Creating post with data:', { 
        title: title.substring(0, 50) + '...', 
        category, 
        authorId: sessionUser.id,
        projectId: projectId || 'none'
      });
      
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

      console.log('Post created successfully:', { postId: post.id });
      const created = mapPostToResponse(post);

      return NextResponse.json(created, { status: 201 });
    } catch (error) {
      console.error('Failed to create post in database:', error);
      return NextResponse.json({ 
        message: 'Unable to create community post.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/community:', error);
    return NextResponse.json({ 
      message: 'Invalid request format.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 400 });
  }
}


