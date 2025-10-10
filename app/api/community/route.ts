import { NextRequest, NextResponse } from 'next/server';
import { desc, eq, and, count, ilike, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { getDbClient } from '@/lib/db/client';
import { communityPosts, users, projects } from '@/lib/db/schema';
import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { withCSRFProtection } from '@/lib/auth/csrf';

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

    // 조건부 필터
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
        or(...categories.map(cat => eq(communityPosts.category, cat as any)))
      );
    }

    // 정렬 조건
    let orderBy = desc(communityPosts.createdAt);
    if (sort === 'popular') {
      orderBy = desc(communityPosts.likesCount);
    } else if (sort === 'trending') {
      // 최근 7일간 좋아요 기준
      orderBy = desc(communityPosts.likesCount);
    }

    // 커뮤니티 게시글 조회
    const postsQuery = db
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
          avatar: users.avatarUrl
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

    const posts = conditions.length > 0 
      ? await postsQuery.where(and(...conditions)).limit(limit)
      : await postsQuery.limit(limit);

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
          avatar: users.avatarUrl
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
          avatar: users.avatarUrl
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
    const countQuery = db
      .select({ count: count() })
      .from(communityPosts);

    const totalResult = conditions.length > 0 
      ? await countQuery.where(and(...conditions))
      : await countQuery;
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
    console.error('커뮤니티 포스트 조회 오류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      sort: request.nextUrl.searchParams.get('sort') || 'recent'
    });

    // 오류 발생 시 기본 응답 반환
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

export const POST = withCSRFProtection(async (request: NextRequest) => {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDbClient();
    
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 본문입니다.' },
        { status: 400 }
      );
    }

    const { title, content, category, projectId } = body as {
      title?: string;
      content?: string;
      category?: string;
      projectId?: string;
    };

    // 입력 검증
    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    if (title.length < 1 || title.length > 200) {
      return NextResponse.json(
        { error: '제목은 1자 이상 200자 이하여야 합니다.' },
        { status: 400 }
      );
    }

    if (content.length < 1 || content.length > 10000) {
      return NextResponse.json(
        { error: '내용은 1자 이상 10000자 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 카테고리 검증 및 변환
    const validCategories = ['GENERAL', 'NOTICE', 'COLLAB', 'SUPPORT', 'SHOWCASE'];
    const normalizedCategory = category?.toUpperCase() || 'GENERAL';
    
    if (!validCategories.includes(normalizedCategory)) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리입니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 ID 검증 (선택사항)
    if (projectId) {
      const project = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1)
        .then(rows => rows[0] || null);

      if (!project) {
        return NextResponse.json(
          { error: '존재하지 않는 프로젝트입니다.' },
          { status: 404 }
        );
      }
    }

    // 게시글 생성
    const now = new Date().toISOString();
    const [newPost] = await db
      .insert(communityPosts)
      .values({
        id: randomUUID(),
        title: title.trim(),
        content: content.trim(),
        category: normalizedCategory as any,
        authorId: user.id,
        projectId: projectId || null,
        likesCount: 0,
        commentsCount: 0,
        isPinned: false,
        status: 'PUBLISHED',
        createdAt: now,
        updatedAt: now
      })
      .returning();

    if (!newPost) {
      throw new Error('게시글 생성에 실패했습니다.');
    }

    return NextResponse.json(
      {
        id: newPost.id,
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        authorId: newPost.authorId,
        projectId: newPost.projectId,
        createdAt: newPost.createdAt,
        updatedAt: newPost.updatedAt
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('게시글 생성 오류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('user-id') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: '게시글 생성에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});