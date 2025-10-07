import { NextRequest, NextResponse } from 'next/server';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { getServerAuthSession } from '@/lib/auth/session';
import { getAnnouncements, createAnnouncement } from '@/lib/server/announcements';
import { UserRole } from '@/types/auth';

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

    if (meta === 'unread-count') {
      return NextResponse.json({ unreadCount });
    }

    return NextResponse.json({ announcements, unreadCount });
  } catch (error) {
    console.error('Failed to load announcements', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authContext = { headers: request.headers };
  let admin;

  try {
    admin = await requireApiUser({ roles: [UserRole.ADMIN] }, authContext);
  } catch (error) {
    const response = handleAuthorizationError(error);

    if (response) {
      return response;
    }

    throw error;
  }

  try {
    const payload = await request.json();

    if (!payload?.title || !payload?.content) {
      return NextResponse.json(
        { message: '?úÎ™©Í≥??¥Ïö©??Î™®Îëê ?ÖÎ†•??Ï£ºÏÑ∏??' },
        { status: 400 }
      );
    }

    const announcement = await createAnnouncement(
      {
        title: payload.title,
        content: payload.content,
        category: payload.category,
        isPinned: Boolean(payload.isPinned),
        publishedAt: payload.publishedAt
      },
      admin.id
    );

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error('Failed to create announcement', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
