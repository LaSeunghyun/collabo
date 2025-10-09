import { NextRequest, NextResponse } from 'next/server';
import { desc, eq, and, count, ilike, or } from 'drizzle-orm';

import { getDbClient } from '@/lib/db/client';
import { communityPosts, users, projects } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const db = await getDbClient();
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') || 'recent';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    // const cursor = searchParams.get('cursor');
    const projectId = searchParams.get('projectId');
    const authorId = searchParams.get('authorId');
    const search = searchParams.get('search');
    const categories = searchParams.getAll('category');

    // 조건부 필터링
    const conditions = [];
    
    if (projectId) {
      conditions.push(eq(communityPosts.projectId, projectId));
    }
    
    if (authorId) {
      conditions.push(eq(communityPosts.authorId, authorId));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(communityPosts.title, `%${search}%`),
          ilike(communityPosts.content, `%${search}%`)
        )
      );
    }
    
    if (categories.length > 0) {
      conditions.push(
        or(...categories.map(cat => eq(communityPosts.category, cat)))
      );
    }

    // 정렬 조건
    let orderBy = desc(communityPosts.createdAt);
    if (sort === 'popular') {
      orderBy = desc(communityPosts.likesCount);
    } else if (sort === 'trending') {
      // 최근 7일간의 좋아요 수 기준
      orderBy = desc(communityPosts.likesCount);
    }

    // 커뮤니티 게시글 조회
    let postsQuery = db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        content: communityPosts.content,
        category: communityPosts.category,
        authorId: communityPosts.authorId,
        projectId: communityPosts.projectId,
        likesCount: communityPosts.likesCount,
        commentsCount: communityPosts.commentsCount,
        isPinned: communityPosts.isPinned,
        status: communityPosts.status,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar
        },
        project: {
          id: projects.id,
          title: projects.title,
          ownerId: projects.ownerId
        }
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.authorId, users.id))
      .leftJoin(projects, eq(communityPosts.projectId, projects.id))
      .orderBy(orderBy);

    if (conditions.length > 0) {
      postsQuery = postsQuery.where(and(...conditions));
    }

    const posts = await postsQuery.limit(limit);

    // 고정 게시글 조회
    const pinnedPosts = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        content: communityPosts.content,
        category: communityPosts.category,
        authorId: communityPosts.authorId,
        projectId: communityPosts.projectId,
        likesCount: communityPosts.likesCount,
        commentsCount: communityPosts.commentsCount,
        isPinned: communityPosts.isPinned,
        status: communityPosts.status,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar
        },
        project: {
          id: projects.id,
          title: projects.title,
          ownerId: projects.ownerId
        }
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.authorId, users.id))
      .leftJoin(projects, eq(communityPosts.projectId, projects.id))
      .where(eq(communityPosts.isPinned, true))
      .orderBy(desc(communityPosts.createdAt))
      .limit(5);

    // 인기 게시글 조회 (최근 7일간)
    const popularPosts = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        content: communityPosts.content,
        category: communityPosts.category,
        authorId: communityPosts.authorId,
        projectId: communityPosts.projectId,
        likesCount: communityPosts.likesCount,
        commentsCount: communityPosts.commentsCount,
        isPinned: communityPosts.isPinned,
        status: communityPosts.status,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar
        },
        project: {
          id: projects.id,
          title: projects.title,
          ownerId: projects.ownerId
        }
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.authorId, users.id))
      .leftJoin(projects, eq(communityPosts.projectId, projects.id))
      .where(
        and(
          eq(communityPosts.status, 'PUBLISHED'),
          eq(communityPosts.isPinned, false)
        )
      )
      .orderBy(desc(communityPosts.likesCount))
      .limit(5);

    // 전체 개수 조회
    let countQuery = db
      .select({ count: count() })
      .from(communityPosts);

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const totalResult = await countQuery;
    const total = totalResult[0]?.count || 0;

    const result = {
      posts,
      pinned: pinnedPosts,
      popular: popularPosts,
      meta: {
        total,
        hasMore: posts.length === limit,
        nextCursor: posts.length === limit ? posts[posts.length - 1]?.id : null
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