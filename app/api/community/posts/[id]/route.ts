import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient } from '@/lib/db/client';
import { posts, users, categories } from '@/lib/db/schema/tables';
import { eq, and, sql } from 'drizzle-orm';
import { PostScope, PostStatus } from '@/lib/constants/enums';

const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  categoryId: z.string().uuid().optional(),
  attachments: z.array(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDbClient();
    const post = await db
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
        viewCount: posts.viewCount,
        reportCount: posts.reportCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(
        and(
          eq(posts.id, params.id),
          eq(posts.scope, PostScope.GLOBAL),
          eq(posts.status, PostStatus.PUBLISHED)
        )
      )
      .limit(1);

    if (post.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 조회수 증가
    await db
      .update(posts)
      .set({
        viewCount: sql`${posts.viewCount} + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(posts.id, params.id));

    return NextResponse.json({
      success: true,
      post: {
        ...post[0],
        viewCount: post[0].viewCount + 1,
      },
    });
  } catch (error) {
    console.error('게시글 조회 오류:', error);
    return NextResponse.json(
      { error: '게시글을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDbClient();
    const user = await requireApiUser(
      {} as GuardRequirement,
      { headers: request.headers }
    );

    const body = await request.json();
    const validatedData = updatePostSchema.parse(body);

    // 게시글 존재 및 권한 확인
    const existingPost = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.id, params.id),
          eq(posts.scope, PostScope.GLOBAL),
          eq(posts.status, PostStatus.PUBLISHED)
        )
      )
      .limit(1);

    if (existingPost.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 작성자만 수정 가능
    if (existingPost[0].authorId !== user.id) {
      return NextResponse.json(
        { error: '게시글을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

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

    const updatedPost = await db
      .update(posts)
      .set({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(posts.id, params.id))
      .returning();

    return NextResponse.json({
      success: true,
      post: updatedPost[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: error.issues },
        { status: 400 }
      );
    }

    console.error('게시글 수정 오류:', error);
    return NextResponse.json(
      { error: '게시글 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDbClient();
    const user = await requireApiUser(
      {} as GuardRequirement,
      { headers: request.headers }
    );

    // 게시글 존재 및 권한 확인
    const existingPost = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.id, params.id),
          eq(posts.scope, PostScope.GLOBAL),
          eq(posts.status, PostStatus.PUBLISHED)
        )
      )
      .limit(1);

    if (existingPost.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 작성자만 삭제 가능
    if (existingPost[0].authorId !== user.id) {
      return NextResponse.json(
        { error: '게시글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 소프트 삭제
    const deletedPost = await db
      .update(posts)
      .set({
        status: PostStatus.DELETED,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(posts.id, params.id))
      .returning();

    return NextResponse.json({
      success: true,
      message: '게시글이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    return NextResponse.json(
      { error: '게시글 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
