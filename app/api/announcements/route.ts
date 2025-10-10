import { NextRequest, NextResponse } from 'next/server';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { getServerAuthSession } from '@/lib/auth/session';
import { getAnnouncements, createAnnouncement } from '@/lib/server/announcements';
import { UserRole } from '@/types/shared';

// Force dynamic rendering since we use headers() in getServerAuthSession
export const dynamic = 'force-dynamic';

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
    console.error('공�??�항 조회 ?�패:', error);
    return NextResponse.json(
      { error: '공�??�항??불러?�는???�패?�습?�다.' },
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
      { error: '관리자�?공�??�항???�성?????�습?�다.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { title, content, category, isScheduled, scheduledAt } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: '?�목�??�용?� ?�수?�니??' },
        { status: 400 }
      );
    }

    const announcement = await createAnnouncement({
      title,
      content,
      category: category || 'GENERAL',
      isPinned: false,
      publishedAt: scheduledAt ? new Date(scheduledAt) : null
    }, user.id);

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error('공�??�항 ?�성 ?�패:', error);
    return NextResponse.json(
      { error: '공�??�항 ?�성???�패?�습?�다.' },
      { status: 500 }
    );
  }
}
