import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/guards';
import { UserRole } from '@/types/shared';
import { getReportedPostDetails, updateModerationStatus } from '@/lib/server/moderation';
import { moderationStatusEnum } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    await requireApiUser({ roles: [UserRole.ADMIN] });
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ message: 'Post ID is required' }, { status: 400 });
    }

    const details = await getReportedPostDetails(postId);
    return NextResponse.json(details);
  } catch (error) {
    console.error('Failed to get reported post details:', error);
    return NextResponse.json(
      { message: 'Failed to get post details' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireApiUser({ roles: [UserRole.ADMIN] });
    const body = await request.json();
    const { reportId, status, actionNote } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { message: 'Report ID and status are required' },
        { status: 400 }
      );
    }

    // ?†Ìö®???ÅÌÉú?∏Ï? ?ïÏù∏
    if (!Object.values(moderationStatusEnum.enumValues).includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      );
    }

    const updatedReport = await updateModerationStatus(
      reportId,
      status,
      user.id,
      actionNote
    );

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Failed to update moderation status:', error);
    return NextResponse.json(
      { message: 'Failed to update moderation status' },
      { status: 500 }
    );
  }
}
