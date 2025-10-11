import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient } from '@/lib/db/client';
import { moderationReports, posts, users } from '@/lib/db/schema/tables';
import { eq, and, desc } from 'drizzle-orm';
import { PostScope, PostStatus, ModerationTargetType } from '@/lib/constants/enums';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
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

    // 신고 내역 조회
    const userReports = await db
      .select({
        id: moderationReports.id,
        targetType: moderationReports.targetType,
        targetId: moderationReports.targetId,
        reason: moderationReports.reason,
        status: moderationReports.status,
        createdAt: moderationReports.createdAt,
        resolvedAt: moderationReports.resolvedAt,
        // 게시글 정보 (POST 타입인 경우)
        postTitle: posts.title,
        postScope: posts.scope,
        postAuthorName: users.name,
      })
      .from(moderationReports)
      .leftJoin(posts, and(
        eq(moderationReports.targetId, posts.id),
        eq(moderationReports.targetType, ModerationTargetType.POST)
      ))
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(moderationReports.reporterId, user.id))
      .orderBy(desc(moderationReports.createdAt))
      .limit(query.limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      reports: userReports,
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

    console.error('내 신고 조회 오류:', error);
    return NextResponse.json(
      { error: '신고 내역을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
