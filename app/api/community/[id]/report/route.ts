import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { moderationReports, posts } from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';
import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import type { SessionUser } from '@/lib/auth/session';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let sessionUser: SessionUser;
  const authContext = { headers: request.headers };

  try {
    sessionUser = await requireApiUser({}, authContext);
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined;

    if (!params.id) {
      return NextResponse.json({ message: 'Post ID is required.' }, { status: 400 });
    }

    const db = await getDb();

    // 게시글 존재 여부 확인
    const postExists = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, params.id))
      .limit(1);

    if (!postExists[0]) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    // 중복 신고 확인
    const existingReport = await db
      .select({ id: moderationReports.id })
      .from(moderationReports)
      .where(and(
        eq(moderationReports.reporterId, sessionUser.id),
        eq(moderationReports.targetType, 'POST'),
        eq(moderationReports.targetId, params.id)
      ))
      .limit(1);

    if (existingReport[0]) {
      return NextResponse.json({ message: 'Report already submitted.' }, { status: 409 });
    }

    // 신고 생성
    const [newReport] = await db
      .insert(moderationReports)
      .values({
        id: randomUUID(),
        reporterId: sessionUser.id,
        targetType: 'POST',
        targetId: params.id,
        reason: reason && reason.length > 0 ? reason : 'No reason provided',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      })
      .returning({
        id: moderationReports.id,
        status: moderationReports.status,
        createdAt: moderationReports.createdAt
      });

    return NextResponse.json(
      {
        id: newReport.id,
        status: newReport.status,
        createdAt: newReport.createdAt
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create moderation report:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { message: 'Unable to submit report.', error: errorMessage },
      { status: 500 }
    );
  }
}
