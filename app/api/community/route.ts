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

const serializePost = (
  post: {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    projectId: string | null;
    category: CommunityCategory;
    isPinned: boolean;
    author: { id: string; name: string; avatarUrl: string | null };
    _count: { likes: number; comments: number };
  },
  trendingIds: Set<string>,
  likedIds: Set<string>
) => ({
  id: post.id,
  title: post.title,
  content: post.content,
  likes: post._count.likes,
  comments: post._count.comments,
  dislikes: 0,
  reports: 0,
  category: post.category.toLowerCase(),
  projectId: post.projectId ?? undefined,
  createdAt: post.createdAt.toISOString(),
  liked: likedIds.has(post.id),
  isPinned: post.isPinned,
  isTrending: trendingIds.has(post.id),
  author: {
    id: post.author.id,
    name: post.author.name,
    avatarUrl: post.author.avatarUrl
  }
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sortParam = searchParams.get('sort');
  const sort = sortParam === 'popular' || sortParam === 'trending' ? sortParam : 'recent';
  const projectId = searchParams.get('projectId') ?? undefined;
  const categoryValues = searchParams
    .getAll('category')
    .map((value) => parseCategory(value))
    .filter((value): value is CommunityCategory => Boolean(value));
  const uniqueCategories = Array.from(new Set(categoryValues));
  const categoryParam = uniqueCategories.length ? uniqueCategories : undefined;
  const searchTerm = searchParams.get('search') ?? undefined;
  const cursor = searchParams.get('cursor') ?? undefined;
  const limitParam = Number.parseInt(searchParams.get('limit') ?? '10', 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 10;
  const authorId = searchParams.get('authorId') ?? undefined;

  try {
    const { user: viewer } = await evaluateAuthorization();
    const viewerId = viewer?.id;

    const baseWhere: Prisma.PostWhereInput = {
      type: PostType.DISCUSSION,
      ...(projectId ? { projectId } : {}),
      ...(categoryParam ? { category: { in: categoryParam } } : {}),
      ...(authorId ? { authorId } : {}),
      ...(searchTerm
        ? {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } }
          ]
        }
        : {})
    };

    const pinnedPosts = await prisma.post.findMany({
      where: { ...baseWhere, isPinned: true },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const trendingCandidates = await prisma.post.findMany({
      where: baseWhere,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: 10
    });

    const trendingIds = new Set(trendingCandidates.slice(0, 5).map((post) => post.id));

    const orderBy: Prisma.PostOrderByWithRelationInput[] = [];
    if (sort === 'recent') {
      orderBy.push({ createdAt: 'desc' });
    } else {
      // For popular/trending, we'll sort by creation date for now
      // TODO: Implement proper like-based sorting with aggregation
      orderBy.push({ createdAt: 'desc' });
    }

    const posts = await prisma.post.findMany({
      where: { ...baseWhere, isPinned: false },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } }
      },
      orderBy,
      take: limit + 1,
      ...(cursor
        ? {
          cursor: { id: cursor },
          skip: 1
        }
        : {})
    });

    const hasNext = posts.length > limit;
    const sliced = hasNext ? posts.slice(0, limit) : posts;

    const total = await prisma.post.count({ where: { ...baseWhere, isPinned: false } });

    const combinedPosts = [
      ...sliced,
      ...pinnedPosts,
      ...trendingCandidates.slice(0, 5)
    ];
    const uniqueIds = Array.from(new Set(combinedPosts.map((post) => post.id)));
    const likedIds = viewerId && uniqueIds.length
      ? new Set(
          (
            await prisma.postLike.findMany({
              where: { userId: viewerId, postId: { in: uniqueIds } },
              select: { postId: true }
            })
          ).map((like) => like.postId)
        )
      : new Set<string>();

    const response: CommunityFeedResponse = {
      posts: sliced.map((post) => serializePost(post, trendingIds, likedIds)),
      pinned: pinnedPosts.map((post) => serializePost(post, trendingIds, likedIds)),
      popular: trendingCandidates
        .slice(0, 5)
        .map((post) => serializePost(post, trendingIds, likedIds)),
      meta: {
        nextCursor: hasNext ? sliced[sliced.length - 1]?.id ?? null : null,
        total,
        sort: sort as 'recent' | 'popular' | 'trending',
        categories: categoryParam?.length
          ? categoryParam.map((category) => category.toLowerCase())
          : ['all'],
        search: searchTerm ?? null,
        authorId: authorId ?? null
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch posts from database.', error);
    return NextResponse.json({ message: 'Unable to load community posts.' }, { status: 500 });
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
        category: post.category.toLowerCase(),
        isPinned: post.isPinned,
        isTrending: false,
        author: {
          id: post.author.id,
          name: post.author.name,
          avatarUrl: post.author.avatarUrl
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create post in database.', error);
    return NextResponse.json({ message: 'Unable to create community post.' }, { status: 500 });
  }
}
