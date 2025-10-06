
import { db } from '@/lib/drizzle';
import { posts, users, postLikes, postDislikes, moderationReports } from '@/lib/db/schema';
import { eq, and, or, desc, count, like, inArray } from 'drizzle-orm';
import type { SessionUser } from '../auth/session';
import type { CommunityPost, CommunityFeedResponse } from './community';

// Drizzle enum values
const CommunityCategory = {
  GENERAL: 'GENERAL',
  QUESTION: 'QUESTION',
  REVIEW: 'REVIEW',
  SUGGESTION: 'SUGGESTION',
  NOTICE: 'NOTICE',
  COLLAB: 'COLLAB',
  SUPPORT: 'SUPPORT',
  SHOWCASE: 'SHOWCASE',
} as const;

const ModerationTargetType = {
  POST: 'POST',
  COMMENT: 'COMMENT',
} as const;

const PostType = {
  UPDATE: 'UPDATE',
  DISCUSSION: 'DISCUSSION',
  AMA: 'AMA',
} as const;

type CommunityCategory = typeof CommunityCategory[keyof typeof CommunityCategory];
type ModerationTargetType = typeof ModerationTargetType[keyof typeof ModerationTargetType];
type PostType = typeof PostType[keyof typeof PostType];

// Service Implementation
const FEED_CONFIG = {
  pinnedLimit: 5,
  popularLimit: 5,
  trendingLimit: 10,
  trendingDays: 3,
  trendingMinLikes: 5,
  trendingMinComments: 3,
  popularMinLikes: 5,
  popularMinComments: 2,
} as const;

export const parseCommunityCategory = (value: string | null): CommunityCategory | undefined => {
  if (!value || value === 'all') {
    return undefined;
  }
  const normalized = value.toUpperCase();
  const match = (Object.values(CommunityCategory) as string[]).find(
    (option) => option === normalized
  );
  return match ? (match as CommunityCategory) : undefined;
};

export const toCategorySlug = (category: CommunityCategory | null | undefined) =>
  String(category ?? CommunityCategory.GENERAL).toLowerCase();

type PostWithAuthor = {
  id: string;
  title: string;
  content: string;
  category: string;
  projectId: string | null;
  createdAt: Date;
  isPinned: boolean;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  likesCount: number;
  commentsCount: number;
  dislikesCount: number;
};

const mapPostToResponse = (
  post: PostWithAuthor,
  likedSet?: Set<string>,
  dislikedSet?: Set<string>,
  reportMap?: Map<string, number>,
  trendingIds?: Set<string>
): CommunityPost => ({
  id: post.id,
  title: post.title,
  content: post.content,
  likes: post.likesCount,
  comments: post.commentsCount,
  dislikes: post.dislikesCount,
  reports: reportMap?.get(post.id) ?? 0,
  category: toCategorySlug(post.category as CommunityCategory),
  projectId: post.projectId ?? undefined,
  createdAt: post.createdAt.toISOString(),
  liked: likedSet?.has(post.id) ?? false,
  disliked: dislikedSet?.has(post.id) ?? false,
  isPinned: post.isPinned,
  isTrending: trendingIds?.has(post.id) ?? false,
  author: {
    id: post.author?.id ?? '',
    name: post.author?.name ?? '',
    avatarUrl: post.author?.avatarUrl ?? null,
  },
});

const isTrendingCandidate = (post: PostWithAuthor) => {
  const { trendingDays, trendingMinComments, trendingMinLikes } = FEED_CONFIG;
  const thresholdDate = new Date(Date.now() - trendingDays * 24 * 60 * 60 * 1000);

  return (
    post.createdAt >= thresholdDate &&
    (post.commentsCount >= trendingMinComments || post.likesCount >= trendingMinLikes)
  );
};

interface GetCommunityFeedParams {
  sort: 'recent' | 'popular' | 'trending';
  limit: number;
  cursor?: string | null;
  projectId?: string | null;
  authorId?: string | null;
  search?: string | null;
  categories: CommunityCategory[];
  viewer?: SessionUser | null;
}

export async function getCommunityFeed({
  sort,
  limit,
  cursor,
  projectId,
  authorId,
  search,
  categories,
  viewer,
}: GetCommunityFeedParams): Promise<CommunityFeedResponse> {
  // Build base conditions
  const baseConditions = [
    eq(posts.type, PostType.DISCUSSION),
    ...(projectId ? [eq(posts.projectId, projectId)] : []),
    ...(authorId ? [eq(posts.authorId, authorId)] : []),
    ...(categories.length ? [inArray(posts.category, categories)] : []),
    ...(search ? [
      or(
        like(posts.title, `%${search}%`),
        like(posts.content, `%${search}%`)
      )
    ] : []),
  ];

  const baseWhere = and(...baseConditions);

  // Get main posts
  const postsQuery = db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      category: posts.category,
      projectId: posts.projectId,
      createdAt: posts.createdAt,
      isPinned: posts.isPinned,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      dislikesCount: posts.dislikesCount,
      author: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(baseWhere)
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  // Note: Cursor-based pagination with Drizzle requires different approach
  // For now, we'll use offset-based pagination
  if (sort === 'recent' && cursor) {
    // TODO: Implement proper cursor-based pagination
  }

  const postsResult = await postsQuery;

  const popularityPoolSize = Math.max(limit * 3, FEED_CONFIG.popularLimit * 3, FEED_CONFIG.trendingLimit * 3);

  // Get pinned posts
  const pinnedQuery = db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      category: posts.category,
      projectId: posts.projectId,
      createdAt: posts.createdAt,
      isPinned: posts.isPinned,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      dislikesCount: posts.dislikesCount,
      author: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(and(...baseConditions, eq(posts.isPinned, true)))
    .orderBy(desc(posts.updatedAt))
    .limit(FEED_CONFIG.pinnedLimit);

  // Get popularity pool
  const popularityPoolQuery = db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      category: posts.category,
      projectId: posts.projectId,
      createdAt: posts.createdAt,
      isPinned: posts.isPinned,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      dislikesCount: posts.dislikesCount,
      author: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(baseWhere)
    .orderBy(desc(posts.createdAt))
    .limit(popularityPoolSize);

  const [pinnedRaw, popularityPool] = await Promise.all([
    pinnedQuery,
    popularityPoolQuery,
  ]);

  const popularityScore = (post: PostWithAuthor) => post.likesCount * 3 + post.commentsCount * 2;

  const popularSorted = [...popularityPool].sort((a, b) => {
    const scoreDiff = popularityScore(b) - popularityScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const popularRaw = popularSorted
    .filter(
      (post) =>
        post.likesCount >= FEED_CONFIG.popularMinLikes ||
        post.commentsCount >= FEED_CONFIG.popularMinComments
    )
    .slice(0, FEED_CONFIG.popularLimit);

  const trendingRaw = popularityPool
    .filter(isTrendingCandidate)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, FEED_CONFIG.trendingLimit);

  let feedPosts = postsResult;
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
      db.select({ postId: postLikes.postId })
        .from(postLikes)
        .where(and(
          eq(postLikes.userId, viewer.id),
          inArray(postLikes.postId, Array.from(allPostIds))
        )),
      db.select({ postId: postDislikes.postId })
        .from(postDislikes)
        .where(and(
          eq(postDislikes.userId, viewer.id),
          inArray(postDislikes.postId, Array.from(allPostIds))
        )),
    ]);
    likedSet = new Set(likes.map((entry) => entry.postId));
    dislikedSet = new Set(dislikes.map((entry) => entry.postId));
  }

  let reportMap: Map<string, number> | undefined;
  if (allPostIds.size > 0) {
    const reportCounts = await db
      .select({
        targetId: moderationReports.targetId,
        count: count(),
      })
      .from(moderationReports)
      .where(and(
        eq(moderationReports.targetType, ModerationTargetType.POST),
        inArray(moderationReports.targetId, Array.from(allPostIds))
      ))
      .groupBy(moderationReports.targetId);
    
    reportMap = new Map(reportCounts.map((entry) => [entry.targetId, entry.count]));
  }

  const trendingIds = new Set(trendingRaw.map((post) => post.id));

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(posts)
    .where(baseWhere);
  const total = totalResult[0]?.count ?? 0;

  return {
    posts: feedPosts.map((post) => mapPostToResponse(post, likedSet, dislikedSet, reportMap, trendingIds)),
    pinned: pinnedRaw.map((post) => mapPostToResponse(post, likedSet, dislikedSet, reportMap, trendingIds)),
    popular: popularRaw.map((post) => mapPostToResponse(post, likedSet, dislikedSet, reportMap, trendingIds)),
    meta: {
      nextCursor,
      total,
      sort,
      categories: categories.length ? categories.map(toCategorySlug) : ['all'],
      search: search || null,
      authorId: authorId ?? null,
      projectId: projectId ?? null,
    },
  };
}

interface CreatePostParams {
  title: string;
  content: string;
  category: CommunityCategory;
  authorId: string;
  projectId?: string;
}

export async function createCommunityPost(params: CreatePostParams): Promise<CommunityPost> {
  const [post] = await db
    .insert(posts)
    .values({
      ...params,
      type: PostType.DISCUSSION,
    })
    .returning({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      category: posts.category,
      projectId: posts.projectId,
      createdAt: posts.createdAt,
      isPinned: posts.isPinned,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      dislikesCount: posts.dislikesCount,
    });

  // Get author info
  const [author] = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, params.authorId))
    .limit(1);

  const postWithAuthor: PostWithAuthor = {
    ...post,
    author,
  };

  return mapPostToResponse(postWithAuthor);
}
