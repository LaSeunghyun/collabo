import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient } from '@/lib/db/client';
import { comments, posts, users } from '@/lib/db/schema/tables';
import { eq, and, desc } from 'drizzle-orm';
import { PostScope, PostStatus } from '@/lib/constants/enums';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  scope: z.enum(['GLOBAL', 'PROJECT', 'ALL']).default('ALL'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const db = await getDbClient();
    const user = await requireApiUser(
      {} as GuardRequirement,
      { headers: request.headers }
    );

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const offset = (query.page - 1) * query.limit;

    // 기본 쿼리 조건
    let whereConditions = and(
      eq(comments.authorId, user.id),
      eq(comments.isDeleted, false),
      eq(posts.status, PostStatus.PUBLISHED)
    );

    // 스코프 필터
    if (query.scope !== 'ALL') {
      whereConditions = and(whereConditions, eq(posts.scope, query.scope));
    }

    // 댓글 조회
    const userComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        postId: comments.postId,
        postTitle: posts.title,
        postScope: posts.scope,
        parentCommentId: comments.parentCommentId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        editedAt: comments.editedAt,
      })
      .from(comments)
      .leftJoin(posts, eq(comments.postId, posts.id))
      .where(whereConditions)
      .orderBy(desc(comments.createdAt))
      .limit(query.limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      comments: userComments,
      pagination: {
        page: query.page,
        limit: query.limit,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '쿼리 파라미터가 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }

    console.error('내 댓글 조회 오류:', error);
    return NextResponse.json(
      { error: '댓글을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
