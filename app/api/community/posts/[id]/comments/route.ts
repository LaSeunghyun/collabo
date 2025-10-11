import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient } from '@/lib/db/client';
import { posts, comments, users } from '@/lib/db/schema/tables';
import { eq, and, desc } from 'drizzle-orm';
import { PostScope, PostStatus } from '@/lib/constants/enums';

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentCommentId: z.string().uuid().optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDbClient();
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const offset = (query.page - 1) * query.limit;

    // 게시글 존재 확인
    const post = await db
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

    if (post.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 댓글 조회
    const commentsList = await db
      .select({
        id: comments.id,
        content: comments.content,
        authorId: comments.authorId,
        authorName: users.name,
        authorAvatar: users.avatarUrl,
        parentCommentId: comments.parentCommentId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        editedAt: comments.editedAt,
        isDeleted: comments.isDeleted,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(
        and(
          eq(comments.postId, params.id),
          eq(comments.isDeleted, false)
        )
      )
      .orderBy(desc(comments.createdAt))
      .limit(query.limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      comments: commentsList,
      pagination: {
        page: query.page,
        limit: query.limit,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '쿼리 파라미터가 올바르지 않습니다.', details: error.issues },
        { status: 400 }
      );
    }

    console.error('댓글 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '댓글을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const validatedData = createCommentSchema.parse(body);

    // 게시글 존재 확인
    const post = await db
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

    if (post.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 부모 댓글 확인 (대댓글인 경우)
    if (validatedData.parentCommentId) {
      const parentComment = await db
        .select()
        .from(comments)
        .where(
          and(
            eq(comments.id, validatedData.parentCommentId),
            eq(comments.postId, params.id),
            eq(comments.isDeleted, false)
          )
        )
        .limit(1);

      if (parentComment.length === 0) {
        return NextResponse.json(
          { error: '부모 댓글을 찾을 수 없습니다.' },
          { status: 400 }
        );
      }
    }

    const newComment = await db
      .insert(comments)
      .values({
        id: crypto.randomUUID(),
        postId: params.id,
        authorId: user.id,
        content: validatedData.content,
        parentCommentId: validatedData.parentCommentId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      comment: newComment[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: error.issues },
        { status: 400 }
      );
    }

    console.error('댓글 작성 오류:', error);
    return NextResponse.json(
      { error: '댓글 작성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
