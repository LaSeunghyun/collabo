import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient } from '@/lib/db/client';
import { posts, users, categories } from '@/lib/db/schema/tables';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { PostScope, PostStatus } from '@/lib/constants/enums';

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  categoryId: z.string().uuid().optional(),
  attachments: z.array(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

const querySchema = z.object({
  category: z.string().optional(),
  sort: z.enum(['latest', 'popular', 'comments']).default('latest'),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const db = await getDbClient();
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const offset = (query.page - 1) * query.limit;

    // 기본 쿼리 조건
    let whereConditions = and(
      eq(posts.scope, PostScope.GLOBAL),
      eq(posts.status, PostStatus.PUBLISHED)
    );

    // 카테고리 필터
    if (query.category) {
      whereConditions = and(whereConditions, eq(posts.categoryId, query.category));
    }

    // 검색 필터
    if (query.search) {
      whereConditions = and(
        whereConditions,
        sql`(${posts.title} ILIKE ${`%${query.search}%`} OR ${posts.content} ILIKE ${`%${query.search}%`})`
      );
    }

    // 정렬 조건
    let orderBy;
    switch (query.sort) {
      case 'popular':
        // 조회수와 좋아요 수를 고려한 인기순 정렬
        orderBy = desc(sql`${posts.viewCount} + (SELECT COUNT(*) FROM "PostLike" WHERE "postId" = ${posts.id})`);
        break;
      case 'comments':
        // 댓글 수 기준 정렬
        orderBy = desc(sql`(SELECT COUNT(*) FROM "Comment" WHERE "postId" = ${posts.id} AND "isDeleted" = false)`);
        break;
      case 'latest':
      default:
        orderBy = desc(posts.createdAt);
        break;
    }

    // 게시글 조회 (댓글 수 포함)
    const postsWithStats = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        excerpt: posts.excerpt,
        authorId: posts.authorId,
        authorName: users.name,
        authorAvatar: users.avatarUrl,
        categoryId: posts.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        attachments: posts.attachments,
        tags: posts.tags,
        isPinned: posts.isPinned,
        likesCount: sql<number>`(SELECT COUNT(*) FROM "PostLike" WHERE "postId" = ${posts.id})::int`,
        commentsCount: sql<number>`(SELECT COUNT(*) FROM "Comment" WHERE "postId" = ${posts.id} AND "isDeleted" = false)::int`,
        viewCount: posts.viewCount,
        reportCount: posts.reportCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(whereConditions)
      .orderBy(desc(posts.isPinned), orderBy) // 상단 고정글을 먼저 정렬
      .limit(query.limit)
      .offset(offset);

    // 전체 개수 조회
    const totalCountResult = await db
      .select({ count: count() })
      .from(posts)
      .where(whereConditions);

    const totalCount = totalCountResult[0]?.count || 0;

    return NextResponse.json({
      success: true,
      posts: postsWithStats,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / query.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '쿼리 파라미터가 올바르지 않습니다.', details: error.issues },
        { status: 400 }
      );
    }

    console.error('게시글 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '게시글을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDbClient();
    const user = await requireApiUser(
      { permissions: ['community:create'] } as GuardRequirement,
      { headers: request.headers }
    );

    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    // 카테고리 존재 확인
    if (validatedData.categoryId) {
      const category = await db
        .select()
        .from(categories)
        .where(and(eq(categories.id, validatedData.categoryId), eq(categories.isActive, true)))
        .limit(1);

      if (category.length === 0) {
        return NextResponse.json(
          { error: '존재하지 않는 카테고리입니다.' },
          { status: 400 }
        );
      }
    }

    const newPost = await db
      .insert(posts)
      .values({
        id: crypto.randomUUID(),
        authorId: user.id,
        title: validatedData.title,
        content: validatedData.content,
        excerpt: validatedData.content.substring(0, 200),
        categoryId: validatedData.categoryId,
        attachments: validatedData.attachments,
        tags: validatedData.tags || [],
        scope: PostScope.GLOBAL,
        status: PostStatus.PUBLISHED,
        visibility: 'PUBLIC',
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      post: newPost[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: error.issues },
        { status: 400 }
      );
    }

    console.error('게시글 작성 오류:', error);
    return NextResponse.json(
      { error: '게시글 작성에 실패했습니다.' },
      { status: 500 }
    );
  }
}