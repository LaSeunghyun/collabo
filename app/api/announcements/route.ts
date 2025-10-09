import { NextRequest, NextResponse } from 'next/server';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { getServerAuthSession } from '@/lib/auth/session';
import { getAnnouncements, createAnnouncement } from '@/lib/server/announcements';
import { UserRole } from '@/types/shared';

const parseCategory = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  return value;
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const category = parseCategory(url.searchParams.get('category'));
  const includeScheduled = url.searchParams.get('includeScheduled') === 'true';
  const meta = url.searchParams.get('meta');

  try {
    const session = await getServerAuthSession();
    const userId = session?.user?.id ?? null;
    const userRole = session?.user?.role ?? null;

    const { announcements, unreadCount } = await getAnnouncements({
      userId,
      category,
      includeScheduled: includeScheduled && userRole === UserRole.ADMIN
    });

    const response: any = { announcements };

    if (meta === 'true') {
      response.unreadCount = unreadCount;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('공지사항 조회 실패:', error);
    return NextResponse.json(
      { error: '공지사항을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let user;
  const authContext = { headers: request.headers };

  try {
    user = await requireApiUser(authContext as any);
  } catch (error) {
    return handleAuthorizationError(error);
  }

  if (user.role !== UserRole.ADMIN) {
    return NextResponse.json(
      { error: '관리자만 공지사항을 작성할 수 있습니다.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { title, content, category, isScheduled, scheduledAt } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    const announcement = await createAnnouncement({
      title,
      content,
      category: category || 'GENERAL',
      isScheduled: isScheduled || false,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      authorId: user.id
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error('공지사항 생성 실패:', error);
    return NextResponse.json(
      { error: '공지사항 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}