import { NextRequest, NextResponse } from 'next/server';

import { CommunityCategory, PostType, Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import {
  addDemoCommunityPost,
  listDemoCommunityPosts,
  type CommunityFeedResponse
} from '@/lib/data/community';

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
  trendingIds: Set<string>
) => ({
  id: post.id,
  title: post.title,
  content: post.content,
  likes: post._count.likes,
  comments: post._count.comments,
  category: post.category.toLowerCase(),
  projectId: post.projectId ?? undefined,
  createdAt: post.createdAt.toISOString(),
  liked: false,
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
  const categoryParam = parseCategory(searchParams.get('category'));
  const searchTerm = searchParams.get('search') ?? undefined;
  const cursor = searchParams.get('cursor') ?? undefined;
  const limitParam = Number.parseInt(searchParams.get('limit') ?? '10', 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 10;

  try {
    const baseWhere: Prisma.PostWhereInput = {
      type: PostType.DISCUSSION,
      ...(projectId ? { projectId } : {}),
      ...(categoryParam ? { category: categoryParam } : {}),
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
        { likes: { _count: 'desc' } },
        { createdAt: 'desc' }
      ],
      take: 10
    });

    const trendingIds = new Set(trendingCandidates.slice(0, 5).map((post) => post.id));

    const orderBy: Prisma.PostOrderByWithRelationInput[] = [];
    if (sort === 'recent') {
      orderBy.push({ createdAt: 'desc' });
    } else {
      orderBy.push({ likes: { _count: 'desc' } });
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

    const response: CommunityFeedResponse = {
      posts: sliced.map((post) => serializePost(post, trendingIds)),
      pinned: pinnedPosts.map((post) => serializePost(post, trendingIds)),
      popular: trendingCandidates.slice(0, 5).map((post) => serializePost(post, trendingIds)),
      meta: {
        nextCursor: hasNext ? sliced[sliced.length - 1]?.id ?? null : null,
        total,
        sort: sort as 'recent' | 'popular' | 'trending',
        category: categoryParam ? categoryParam.toLowerCase() : null,
        search: searchTerm ?? null
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch posts from database, using demo data instead.', error);
    return NextResponse.json(
      listDemoCommunityPosts({
        projectId,
        sort: sort as 'recent' | 'popular' | 'trending',
        category: categoryParam ? categoryParam.toLowerCase() : undefined,
        search: searchTerm ?? undefined,
        cursor,
        limit
      })
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = body.title?.trim();
  const content = body.content?.trim();
  const projectId = body.projectId ? String(body.projectId) : undefined;
  const authorId = body.authorId ? String(body.authorId) : undefined;
  const category = parseCategory(body.category ?? null) ?? CommunityCategory.GENERAL;

  if (!title || !content) {
    return NextResponse.json({ message: 'Title and content are required.' }, { status: 400 });
  }

  try {
    if (!authorId) {
      throw new Error('Missing authorId for persistent post creation.');
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        type: PostType.DISCUSSION,
        category,
        ...(projectId
          ? {
            project: {
              connect: { id: projectId }
            }
          }
          : {}),
        author: {
          connect: { id: authorId }
        }
      }
    });

    return NextResponse.json(
      {
        id: post.id,
        title: post.title,
        content: post.content,
        likes: 0,
        comments: 0,
        projectId: post.projectId ?? undefined,
        createdAt: post.createdAt.toISOString(),
        liked: false,
        category: post.category.toLowerCase(),
        isPinned: post.isPinned,
        isTrending: false
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create post in database, falling back to demo store.', error);

    const fallbackPost = addDemoCommunityPost({
      id: crypto.randomUUID(),
      title,
      content,
      likes: 0,
      comments: 0,
      projectId,
      createdAt: new Date().toISOString(),
      liked: false,
      category: category.toLowerCase(),
      isPinned: false,
      isTrending: false
    });

    return NextResponse.json(fallbackPost, { status: 201 });
  }
}
