import { NextRequest, NextResponse } from 'next/server';
import { eq, and, or, desc, count, sql, like, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { communityCategoryEnum, posts, users, postLikes, postDislikes, comments, moderationReports } from '@/lib/db/schema';
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
  const match = (Object.values(communityCategoryEnum.enumValues) as string[]).find(
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

// const isTrendingCandidate = (post: PostWithAuthor) => {
//   const { trendingDays, trendingMinComments, trendingMinLikes } = FEED_CONFIG;
//   const thresholdDate = new Date(Date.now() - trendingDays * 24 * 60 * 60 * 1000);

//   const createdAt = new Date(post.createdAt);
//   return (
//     createdAt >= thresholdDate &&
//     ((post._count.comments ?? 0) >= trendingMinComments || (post._count.likes ?? 0) >= trendingMinLikes)
//   );
// };

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
      .filter((value): value is string => Boolean(value));

    const { user: viewer } = await evaluateAuthorization({}, authContext);
    const db = await getDb();

    // 기본 WHERE 조건 구성
    const whereConditions = [];

    if (projectId) {
      whereConditions.push(eq(posts.projectId, projectId));
    }

    if (authorId) {
      whereConditions.push(eq(posts.authorId, authorId));
    }

    if (normalizedCategories.length > 0) {
      whereConditions.push(inArray(posts.category, normalizedCategories as (typeof communityCategoryEnum.enumValues)[number][]));
    }

    if (search) {
      whereConditions.push(
        or(
          like(posts.title, `%${search}%`),
          like(posts.content, `%${search}%`)
        )
      );
    }

    const baseWhere = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // 전체 게시글 수 조회
    const [totalResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(baseWhere);

    const total = totalResult?.count || 0;

    // 메인 피드 게시글 조회
    const finalWhere = cursor
      ? (baseWhere ? and(baseWhere, sql`${posts.id} < ${cursor}`) : sql`${posts.id} < ${cursor}`)
      : baseWhere;

    const feedQuery = db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        category: posts.category,
        projectId: posts.projectId,
        createdAt: posts.createdAt,
        isPinned: posts.isPinned,
        author: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(finalWhere)
      .orderBy(desc(posts.createdAt));

    const feedPosts = await feedQuery.limit(limit);

    // 고정 게시글 조회
    const pinnedPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        category: posts.category,
        projectId: posts.projectId,
        createdAt: posts.createdAt,
        isPinned: posts.isPinned,
        author: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(baseWhere, eq(posts.isPinned, true)))
      .limit(FEED_CONFIG.pinnedLimit);

    // 인기 게시글 조회 (좋아요/댓글 수 기반)
    const popularPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        category: posts.category,
        projectId: posts.projectId,
        createdAt: posts.createdAt,
        isPinned: posts.isPinned,
        author: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(baseWhere)
      .orderBy(desc(posts.createdAt))
      .limit(FEED_CONFIG.popularLimit);

    // 모든 게시글 ID 수집
    const allPostIds = new Set<string>();
    for (const post of [...feedPosts, ...pinnedPosts, ...popularPosts]) {
      allPostIds.add(post.id);
    }

    // 사용자별 좋아요/싫어요 상태 조회
    let likedSet: Set<string> | undefined;
    let dislikedSet: Set<string> | undefined;

    if (viewer && allPostIds.size > 0) {
      const [likesResult, dislikesResult] = await Promise.all([
        db.select({ postId: postLikes.postId })
          .from(postLikes)
          .where(and(eq(postLikes.userId, viewer.id), inArray(postLikes.postId, Array.from(allPostIds)))),
        db.select({ postId: postDislikes.postId })
          .from(postDislikes)
          .where(and(eq(postDislikes.userId, viewer.id), inArray(postDislikes.postId, Array.from(allPostIds))))
      ]);

      likedSet = new Set(likesResult.map(l => l.postId));
      dislikedSet = new Set(dislikesResult.map(d => d.postId));
    }

    // 신고 수 조회
    let reportMap: Map<string, number> | undefined;
    if (allPostIds.size > 0) {
      const reportsResult = await db
        .select({
          targetId: moderationReports.targetId,
          count: count()
        })
        .from(moderationReports)
        .where(and(
          eq(moderationReports.targetType, 'POST'),
          inArray(moderationReports.targetId, Array.from(allPostIds))
        ))
        .groupBy(moderationReports.targetId);

      reportMap = new Map(reportsResult.map(r => [r.targetId, r.count]));
    }

    // 각 게시글의 좋아요/싫어요/댓글 수 조회 - 배치 쿼리로 최적화
    const postCounts = new Map<string, { likes: number; dislikes: number; comments: number }>();

    if (allPostIds.size > 0) {
      const [allLikes, allDislikes, allComments] = await Promise.all([
        db.select({ postId: postLikes.postId, count: count() })
          .from(postLikes)
          .where(inArray(postLikes.postId, Array.from(allPostIds)))
          .groupBy(postLikes.postId),
        db.select({ postId: postDislikes.postId, count: count() })
          .from(postDislikes)
          .where(inArray(postDislikes.postId, Array.from(allPostIds)))
          .groupBy(postDislikes.postId),
        db.select({ postId: comments.postId, count: count() })
          .from(comments)
          .where(inArray(comments.postId, Array.from(allPostIds)))
          .groupBy(comments.postId)
      ]);

      // Map으로 변환
      const likesMap = new Map(allLikes.map(r => [r.postId, r.count]));
      const dislikesMap = new Map(allDislikes.map(r => [r.postId, r.count]));
      const commentsMap = new Map(allComments.map(r => [r.postId, r.count]));

      for (const postId of allPostIds) {
        postCounts.set(postId, {
          likes: likesMap.get(postId) || 0,
          dislikes: dislikesMap.get(postId) || 0,
          comments: commentsMap.get(postId) || 0
        });
      }
    }

    // 트렌딩 게시글 ID 계산
    const trendingIds = new Set<string>();
    const now = new Date();
    const trendingThreshold = new Date(now.getTime() - FEED_CONFIG.trendingDays * 24 * 60 * 60 * 1000);

    for (const post of [...feedPosts, ...pinnedPosts, ...popularPosts]) {
      const counts = postCounts.get(post.id);
      const createdAt = new Date(post.createdAt);

      if (counts && createdAt >= trendingThreshold &&
        (counts.comments >= FEED_CONFIG.trendingMinComments || counts.likes >= FEED_CONFIG.trendingMinLikes)) {
        trendingIds.add(post.id);
      }
    }

    // 응답 데이터 구성
    const mapPost = (post: any) => {
      const counts = postCounts.get(post.id) || { likes: 0, dislikes: 0, comments: 0 };
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        likes: counts.likes,
        comments: counts.comments,
        dislikes: counts.dislikes,
        reports: reportMap?.get(post.id) || 0,
        category: toCategorySlug(post.category),
        projectId: post.projectId ?? undefined,
        createdAt: post.createdAt instanceof Date
          ? post.createdAt.toISOString()
          : String(post.createdAt),
        liked: likedSet?.has(post.id) || false,
        disliked: dislikedSet?.has(post.id) || false,
        isPinned: post.isPinned,
        isTrending: trendingIds.has(post.id),
        views: 0, // 조회수는 추후 구현
        author: {
          id: post.author.id,
          name: post.author.name || 'Unknown',
          avatarUrl: post.author.avatarUrl
        }
      };
    };

    const nextCursor = feedPosts.length === limit ? feedPosts[feedPosts.length - 1]?.id ?? null : null;

    const response: CommunityFeedResponse = {
      posts: feedPosts.map(mapPost),
      pinned: pinnedPosts.map(mapPost),
      popular: popularPosts.map(mapPost),
      meta: {
        nextCursor,
        total,
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
          category: category as (typeof communityCategoryEnum.enumValues)[number],
          type: 'DISCUSSION',
          projectId: projectId ?? null,
          authorId: sessionUser.id,
          isPinned: false,
          updatedAt: new Date().toISOString(),
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


