import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient } from '@/lib/db/client';
import { posts, moderationReports } from '@/lib/db/schema/tables';
import { eq, and } from 'drizzle-orm';
import { PostScope, PostStatus, ModerationTargetType } from '@/lib/constants/enums';

const reportSchema = z.object({
  reason: z.string().min(1).max(500),
});

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
    const validatedData = reportSchema.parse(body);

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

    // 자신의 게시글은 신고할 수 없음
    if (post[0].authorId === user.id) {
      return NextResponse.json(
        { error: '자신의 게시글은 신고할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 신고 생성
    await db.insert(moderationReports).values({
      id: crypto.randomUUID(),
      reporterId: user.id,
      targetType: ModerationTargetType.POST,
      targetId: params.id,
      reason: validatedData.reason,
    });

    // 신고 횟수 증가
    await db
      .update(posts)
      .set({
        reportCount: posts.reportCount + 1,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(posts.id, params.id));

    // 신고 3회 이상 시 자동 숨김
    if (post[0].reportCount + 1 >= 3) {
      await db
        .update(posts)
        .set({
          status: PostStatus.HIDDEN,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(posts.id, params.id));
    }

    return NextResponse.json({
      success: true,
      message: '신고가 접수되었습니다.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }

    console.error('신고 접수 오류:', error);
    return NextResponse.json(
      { error: '신고 접수에 실패했습니다.' },
      { status: 500 }
    );
  }
}
