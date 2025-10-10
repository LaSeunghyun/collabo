import { NextRequest, NextResponse } from 'next/server';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import {
  deleteAnnouncement,
  getAnnouncementDetail,
  markAnnouncementAsRead,
  updateAnnouncement
} from '@/lib/server/announcements';

// Force dynamic rendering since we use headers() in getServerSession
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;
    const announcement = await getAnnouncementDetail(params.id, userId);

    if (!announcement) {
      return NextResponse.json({ message: '존재하지 않는 공지입니다.' }, { status: 404 });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Failed to load announcement', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const authContext = { headers: request.headers };

  if (body?.markAsRead) {
    let user;

    try {
      user = await requireApiUser({}, authContext);
    } catch (error) {
      const response = handleAuthorizationError(error);

      if (response) {
        return response;
      }

      throw error;
    }

    try {
      await markAnnouncementAsRead(params.id, user.id);
      const announcement = await getAnnouncementDetail(params.id, user.id);

      return NextResponse.json({ status: 'ok', announcement });
    } catch (error) {
      console.error('Failed to mark announcement as read', error);
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
  }

  try {
    await requireApiUser({ roles: ['ADMIN'] }, authContext);
  } catch (error) {
    const response = handleAuthorizationError(error);

    if (response) {
      return response;
    }

    throw error;
  }

  try {
    if (!body?.title || !body?.content) {
      return NextResponse.json(
        { message: '제목과 내용을 모두 입력해 주세요.' },
        { status: 400 }
      );
    }

    const announcement = await updateAnnouncement(params.id, {
      title: body.title,
      content: body.content,
      category: body.category,
      isPinned: Boolean(body.isPinned),
      publishedAt: body.publishedAt
    });

    if (!announcement) {
      return NextResponse.json({ message: '존재하지 않는 공지입니다.' }, { status: 404 });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Failed to update announcement', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authContext = { headers: request.headers };
  try {
    await requireApiUser({ roles: ['ADMIN'] }, authContext);
  } catch (error) {
    const response = handleAuthorizationError(error);

    if (response) {
      return response;
    }

    throw error;
  }

  try {
    await deleteAnnouncement(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete announcement', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
