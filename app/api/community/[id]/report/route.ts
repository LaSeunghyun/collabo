import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient } from '@/lib/db/client';
import { communityPosts, communityReports } from '@/lib/db/schema';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDbClient();
    
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined;

    if (!params.id) {
      return NextResponse.json({ message: 'Post ID is required.' }, { status: 400 });
    }

    // 게시글 조회
    const [post] = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        authorId: communityPosts.authorId,
        status: communityPosts.status
      })
      .from(communityPosts)
      .where(eq(communityPosts.id, params.id))
      .limit(1);

    if (!post) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    // 게시글 작성자는 자신의 게시글을 신고할 수 없음
    if (post.authorId === user.id) {
      return NextResponse.json({ message: 'Cannot report your own post.' }, { status: 400 });
    }

    // 기존 신고 확인
    const [existingReport] = await db
      .select({ id: communityReports.id })
      .from(communityReports)
      .where(
        and(
          eq(communityReports.reporterId, user.id),
          eq(communityReports.targetType, 'POST'),
          eq(communityReports.targetId, params.id)
        )
      )
      .limit(1);

    if (existingReport) {
      return NextResponse.json({ message: 'Report already submitted.' }, { status: 409 });
    }

    // 신고 생성
    const now = new Date().toISOString();
    const [report] = await db
      .insert(communityReports)
      .values({
        id: randomUUID(),
        reporterId: user.id,
        targetType: 'POST',
        targetId: params.id,
        reason: reason && reason.length > 0 ? reason : 'No reason provided',
        status: 'PENDING',
        createdAt: now,
        updatedAt: now
      })
      .returning();

    if (!report) {
      throw new Error('Failed to create report');
    }

    return NextResponse.json(
      {
        id: report.id,
        status: report.status,
        createdAt: report.createdAt
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create moderation report:', error);
    return NextResponse.json(
      { message: 'Failed to create moderation report' },
      { status: 500 }
    );
  }
}