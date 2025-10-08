import { NextRequest, NextResponse } from 'next/server';

// import { getCommunityFeed } from '@/lib/server/community';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') || 'recent';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor');
    const projectId = searchParams.get('projectId');
    const authorId = searchParams.get('authorId');
    const search = searchParams.get('search');
    const categories = searchParams.getAll('category');

    // 임시로 빈 응답 반환
    const result = {
      posts: [],
      pinned: [],
      popular: [],
      meta: {
        total: 0,
        hasMore: false,
        nextCursor: null
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('커뮤니티 피드 조회 중 오류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      sort: request.nextUrl.searchParams.get('sort') || 'recent'
    });

    // 오류 발생 시 빈 응답 반환
    const fallbackResponse = {
      posts: [],
      pinned: [],
      popular: [],
      meta: {
        total: 0,
        hasMore: false,
        nextCursor: null
      },
      filters: {
        sort: request.nextUrl.searchParams.get('sort') || 'recent',
        categories: request.nextUrl.searchParams.getAll('category'),
        search: request.nextUrl.searchParams.get('search'),
        projectId: request.nextUrl.searchParams.get('projectId')
      }
    };

    return NextResponse.json(fallbackResponse);
  }
}