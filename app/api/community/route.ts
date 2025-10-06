import { NextRequest, NextResponse } from 'next/server';
import { CommunityCategory } from '@prisma/client';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { evaluateAuthorization } from '@/lib/auth/session';
import {
  createCommunityPost,
  getCommunityFeed,
  parseCommunityCategory,
  toCategorySlug,
} from '@/lib/data/community.service';
import type { CommunityFeedResponse } from '@/lib/data/community';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sortParam = searchParams.get('sort');
  const sort =
    sortParam === 'popular' || sortParam === 'trending' ? sortParam : 'recent';
  const limitParam = Number.parseInt(searchParams.get('limit') ?? '10', 10);
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, 50)
      : 10;

  const categoryParams = searchParams.getAll('category');
  const categories = categoryParams
    .map(parseCommunityCategory)
    .filter((value): value is CommunityCategory => Boolean(value));

  try {
    const { user: viewer } = await evaluateAuthorization(
      {},
      { headers: request.headers }
    );

    const feed = await getCommunityFeed({
      sort,
      limit,
      categories,
      viewer,
      cursor: searchParams.get('cursor'),
      projectId: searchParams.get('projectId'),
      authorId: searchParams.get('authorId'),
      search: searchParams.get('search'),
    });

    return NextResponse.json(feed);
  } catch (error) {
    console.error('Failed to fetch community feed:', {
      error: error instanceof Error ? error.message : String(error),
      url: request.url,
    });

    // Return a fallback response on error
    const fallbackResponse: CommunityFeedResponse = {
      posts: [],
      pinned: [],
      popular: [],
      meta: {
        nextCursor: null,
        total: 0,
        sort,
        categories: categories.length
          ? categories.map(toCategorySlug)
          : ['all'],
        search: searchParams.get('search')?.trim() || null,
        authorId: searchParams.get('authorId'),
        projectId: searchParams.get('projectId'),
      },
    };
    return NextResponse.json(fallbackResponse);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireApiUser({}, { headers: request.headers });

    const body = await request.json();
    const title = body.title?.trim();
    const content = body.content?.trim();

    if (!title || !content) {
      return NextResponse.json(
        { message: 'Title and content are required.' },
        { status: 400 }
      );
    }

    const category =
      parseCommunityCategory(body.category ?? null) ??
      CommunityCategory.GENERAL;

    const createdPost = await createCommunityPost({
      title,
      content,
      category,
      authorId: sessionUser.id,
      projectId: body.projectId ? String(body.projectId) : undefined,
    });

    return NextResponse.json(createdPost, { status: 201 });
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    console.error('Failed to create community post:', {
      error: error instanceof Error ? error.message : String(error),
    });

    const message =
      error instanceof TypeError
        ? 'Invalid request format.'
        : 'Unable to create community post.';

    return NextResponse.json({ message }, { status: 500 });
  }
}


