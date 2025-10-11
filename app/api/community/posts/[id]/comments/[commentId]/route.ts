import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient } from '@/lib/db/client';
import { comments } from '@/lib/db/schema/tables';
import { eq, and } from 'drizzle-orm';

const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const db = await getDbClient();
    const user = await requireApiUser(
      {} as GuardRequirement,
      { headers: request.headers }
    );

    const body = await request.json();
    const validatedData = updateCommentSchema.parse(body);

    // 댓글 존재 및 권한 확인
    const existingComment = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.id, params.commentId),
          eq(comments.postId, params.id),
          eq(comments.isDeleted, false)
        )
      )
      .limit(1);

    if (existingComment.length === 0) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 작성자만 수정 가능
    if (existingComment[0].authorId !== user.id) {
      return NextResponse.json(
        { error: '댓글을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const updatedComment = await db
      .update(comments)
      .set({
        content: validatedData.content,
        editedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(comments.id, params.commentId))
      .returning();

    return NextResponse.json({
      success: true,
      comment: updatedComment[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }

    console.error('댓글 수정 오류:', error);
    return NextResponse.json(
      { error: '댓글 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const db = await getDbClient();
    const user = await requireApiUser(
      {} as GuardRequirement,
      { headers: request.headers }
    );

    // 댓글 존재 및 권한 확인
    const existingComment = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.id, params.commentId),
          eq(comments.postId, params.id),
          eq(comments.isDeleted, false)
        )
      )
      .limit(1);

    if (existingComment.length === 0) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 작성자만 삭제 가능
    if (existingComment[0].authorId !== user.id) {
      return NextResponse.json(
        { error: '댓글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 소프트 삭제
    const deletedComment = await db
      .update(comments)
      .set({
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(comments.id, params.commentId))
      .returning();

    return NextResponse.json({
      success: true,
      message: '댓글이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    return NextResponse.json(
      { error: '댓글 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
