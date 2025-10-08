import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { communityCategory, post as posts, user as users } from '@/drizzle/schema';
import { getDb } from '@/lib/db/client';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import type { SessionUser } from '@/lib/auth/session';
import { evaluateAuthorization } from '@/lib/auth/session';

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

const parseCategory = (value: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (value === 'all') {
    return undefined;
  }

  const normalized = value.toUpperCase();
  const match = (Object.values(communityCategory.enumValues) as string[]).find(
    (option) => option === normalized
  );

  if (match) {
    return match;
  }

  return undefined;
};

const toCategorySlug = (category: string | null | undefined) =>
  String(category ?? 'GENERAL').toLowerCase();

// const postInclude = {
//   author: { select: { id: true, name: true, avatarUrl: true } },
//   _count: { select: { likes: true, dislikes: true, comments: true } }
// } as const;

type PostWithAuthor = {
  id: string;
  title: string;
  content: string;
  category: string;
  projectId: string | null;
  createdAt: string;
  isPinned: boolean;
  author: { id: string; name: string; avatarUrl: string | null } | null;
  _count: { likes: number; dislikes: number; comments: number };
};

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
  createdAt: String(post.createdAt),
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

  const createdAt = new Date(post.createdAt);
  return (
    createdAt >= thresholdDate &&
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
    // const cursor = searchParams.get('cursor'); // TODO: Drizzle로 전환 필요
    const projectId = searchParams.get('projectId');
    const authorId = searchParams.get('authorId');
    const search = searchParams.get('search')?.trim() ?? '';
    const categoryParams = searchParams.getAll('category');
    const normalizedCategories = categoryParams
      .map((value) => parseCategory(value))
      .filter((value): value is string => Boolean(value));

    const { user: viewer } = await evaluateAuthorization({}, authContext);

    // TODO: Drizzle로 전환 필요
    const posts: PostWithAuthor[] = [];

    // const popularityPoolSize = Math.max(limit * 3, FEED_CONFIG.popularLimit * 3, FEED_CONFIG.trendingLimit * 3); // TODO: Drizzle로 전환 필요

    // TODO: Drizzle로 전환 필요
    const pinnedRaw: PostWithAuthor[] = [];
    const popularityPool: PostWithAuthor[] = [];

    const popularityScore = (post: PostWithAuthor) => post._count.likes * 3 + post._count.comments * 2;

    const popularSorted = [...popularityPool].sort((a, b) => {
      const scoreDiff = popularityScore(b) - popularityScore(a);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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

    // TODO: Drizzle로 전환 필요
    if (viewer && allPostIds.size > 0) {
      likedSet = new Set();
      dislikedSet = new Set();
    }

    // TODO: Drizzle로 전환 필요
    let reportMap: Map<string, number> | undefined;
    if (allPostIds.size > 0) {
      reportMap = new Map();
    }

    const trendingIds = new Set(trendingRaw.map((post) => post.id));

    const response: CommunityFeedResponse = {
      posts: feedPosts.map((post) => mapPostToResponse(post, likedSet, dislikedSet, reportMap, trendingIds)),
      pinned: pinnedRaw.map((post) => mapPostToResponse(post, likedSet, dislikedSet, reportMap, trendingIds)),
      popular: popularRaw.map((post) => mapPostToResponse(post, likedSet, dislikedSet, reportMap, trendingIds)),
      meta: {
        nextCursor,
        total: 0, // TODO: Drizzle로 전환 필요
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
      .filter((value): value is string => Boolean(value));
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
    const category = parseCategory(body.category ?? null) ?? 'GENERAL';
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
      
      // Drizzle로 게시글 생성
      const db = await getDb();
      const [createdPost] = await db
        .insert(posts)
        .values({
          id: randomUUID(),
          title,
          content,
          category: category as 'GENERAL' | 'NOTICE' | 'COLLAB' | 'SUPPORT' | 'SHOWCASE',
          type: 'DISCUSSION',
          projectId: projectId ?? null,
          authorId: sessionUser.id,
          isPinned: false,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          tags: ['RAY'],
          language: 'ko',
          visibility: 'PUBLIC'
        })
        .returning({
          id: posts.id,
          title: posts.title,
          content: posts.content,
          category: posts.category,
          projectId: posts.projectId,
          createdAt: posts.createdAt,
          isPinned: posts.isPinned,
        });

      if (!createdPost) {
        throw new Error('Failed to create post');
      }

      // 작성자 정보 조회
      const [author] = await db
        .select({
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, sessionUser.id))
        .limit(1);

      const post: PostWithAuthor = {
        id: createdPost.id,
        title: createdPost.title,
        content: createdPost.content,
        category: createdPost.category,
        projectId: createdPost.projectId,
        createdAt: createdPost.createdAt,
        isPinned: createdPost.isPinned,
        author: author ? { 
          id: author.id, 
          name: author.name ?? 'Guest', 
          avatarUrl: author.avatarUrl 
        } : null,
        _count: { likes: 0, dislikes: 0, comments: 0 }
      };

      console.log('Post created successfully:', { postId: post.id });
      const created = mapPostToResponse(post);

      return NextResponse.json(created, { status: 201 });
    } catch (error) {
      console.error('Failed to create post in database:', error);
      return NextResponse.json({ 
        message: 'Unable to create community post.',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/community:', error);
    return NextResponse.json({ 
      message: 'Invalid request format.',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 400 });
  }
}


