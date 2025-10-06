
import { CommunityCategory, ModerationTargetType, PostType } from '@/types/drizzle';
// Prisma types removed - using Drizzle types

import { prisma } from '@/lib/prisma';
import type { SessionUser } from '../auth/session';
import type { CommunityPost, CommunityFeedResponse } from './community';

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

const postInclude = {
  author: { select: { id: true, name: true, avatarUrl: true } },
  _count: { select: { likes: true, dislikes: true, comments: true } },
} as const;

type PostWithAuthor = Prisma.PostGetPayload<{ include: typeof postInclude }>;

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
    avatarUrl: post.author?.avatarUrl ?? null,
  },
});

const isTrendingCandidate = (post: PostWithAuthor) => {
  const { trendingDays, trendingMinComments, trendingMinLikes } = FEED_CONFIG;
  const thresholdDate = new Date(Date.now() - trendingDays * 24 * 60 * 60 * 1000);

  return (
    post.createdAt >= thresholdDate &&
    (post._count.comments >= trendingMinComments || post._count.likes >= trendingMinLikes)
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
  const baseWhere: Prisma.PostWhereInput = {
    type: PostType.DISCUSSION,
    ...(projectId ? { projectId } : {}),
    ...(authorId ? { authorId } : {}),
    ...(categories.length ? { category: { in: categories } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const baseOrderBy: Prisma.PostOrderByWithRelationInput[] = [{ createdAt: 'desc' }];
  const applyCursor = sort === 'recent' && cursor;

  const posts = await prisma.post.findMany({
    where: baseWhere,
    include: postInclude,
    orderBy: baseOrderBy,
    take: limit,
    ...(applyCursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const popularityPoolSize = Math.max(limit * 3, FEED_CONFIG.popularLimit * 3, FEED_CONFIG.trendingLimit * 3);

  const [pinnedRaw, popularityPool] = await Promise.all([
    prisma.post.findMany({
      where: { ...baseWhere, isPinned: true },
      include: postInclude,
      take: FEED_CONFIG.pinnedLimit,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.post.findMany({
      where: baseWhere,
      include: postInclude,
      orderBy: baseOrderBy,
      take: popularityPoolSize,
    }),
  ]);

  const popularityScore = (post: PostWithAuthor) => post._count.likes * 3 + post._count.comments * 2;

  const popularSorted = [...popularityPool].sort((a, b) => {
    const scoreDiff = popularityScore(b) - popularityScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const popularRaw = popularSorted
    .filter(
      (post) =>
        post._count.likes >= FEED_CONFIG.popularMinLikes ||
        post._count.comments >= FEED_CONFIG.popularMinComments
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
      prisma.postLike.findMany({ where: { userId: viewer.id, postId: { in: Array.from(allPostIds) } } }),
      prisma.postDislike.findMany({ where: { userId: viewer.id, postId: { in: Array.from(allPostIds) } } }),
    ]);
    likedSet = new Set(likes.map((entry) => entry.postId));
    dislikedSet = new Set(dislikes.map((entry) => entry.postId));
  }

  let reportMap: Map<string, number> | undefined;
  if (allPostIds.size > 0) {
    const reportCounts = await prisma.moderationReport.groupBy({
      by: ['targetId'],
      where: { targetType: ModerationTargetType.POST, targetId: { in: Array.from(allPostIds) } },
      _count: { _all: true },
    });
    reportMap = new Map(reportCounts.map((entry) => [entry.targetId, entry._count?._all ?? 0]));
  }

  const trendingIds = new Set(trendingRaw.map((post) => post.id));

  return {
    posts: feedPosts.map((post) => mapPostToResponse(post, likedSet, dislikedSet, reportMap, trendingIds)),
    pinned: pinnedRaw.map((post) => mapPostToResponse(post, likedSet, dislikedSet, reportMap, trendingIds)),
    popular: popularRaw.map((post) => mapPostToResponse(post, likedSet, dislikedSet, reportMap, trendingIds)),
    meta: {
      nextCursor,
      total: await prisma.post.count({ where: baseWhere }),
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
  const post = await prisma.post.create({
    data: {
      ...params,
      type: PostType.DISCUSSION,
    },
    include: postInclude,
  });

  return mapPostToResponse(post);
}
