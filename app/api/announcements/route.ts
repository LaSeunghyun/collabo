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
    console.error('ê³µì??¬í•­ ì¡°íšŒ ?¤íŒ¨:', error);
    return NextResponse.json(
      { error: 'ê³µì??¬í•­??ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤.' },
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
      { error: 'ê´€ë¦¬ìë§?ê³µì??¬í•­???‘ì„±?????ˆìŠµ?ˆë‹¤.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { title, content, category, isScheduled, scheduledAt } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: '?œëª©ê³??´ìš©?€ ?„ìˆ˜?…ë‹ˆ??' },
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
    console.error('ê³µì??¬í•­ ?ì„± ?¤íŒ¨:', error);
    return NextResponse.json(
      { error: 'ê³µì??¬í•­ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.' },
      { status: 500 }
    );
  }
}
