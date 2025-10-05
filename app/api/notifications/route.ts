import { NextRequest, NextResponse } from 'next/server';
import { withAuth, parsePaginationParams } from '@/lib/server/api-utils';
import { createNotification, getNotifications, markAllNotificationsAsRead } from '@/lib/server/notification-service';

export async function POST(request: NextRequest) {
  return withAuth(async (user, req) => {
    const body = await req.json();
    const { type, title, content, metadata, relatedId, relatedType } = body;

    return await createNotification({
      userId: user.id,
      type,
      title,
      content,
      metadata,
      relatedId,
      relatedType
    });
  }, request);
}

export async function GET(request: NextRequest) {
  const pagination = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const filters = {
    userId: searchParams.get('userId') || undefined,
    type: searchParams.get('type') as any || undefined,
    isRead: searchParams.get('isRead') === 'true' ? true : searchParams.get('isRead') === 'false' ? false : undefined,
    page: pagination.page,
    limit: pagination.limit
  };

  const result = await getNotifications(filters);
  
  if (result.success && 'data' in result) {
    return NextResponse.json(result.data);
  } else {
    return NextResponse.json(
      { message: result.message },
      { status: ('statusCode' in result ? result.statusCode : 400) }
    );
  }
}

export async function PATCH(request: NextRequest) {
  return withAuth(async (user, req) => {
    const body = await req.json();
    const { action } = body;

    if (action === 'markAllAsRead') {
      return await markAllNotificationsAsRead(user.id);
    }

    return { success: false, message: '지원하지 않는 액션입니다.' };
  }, request);
}
