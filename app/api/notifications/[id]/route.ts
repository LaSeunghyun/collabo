import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/api-utils';
import { getNotification, markNotificationAsRead, deleteNotification } from '@/lib/server/notification-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await getNotification(params.id);
  
  if (result.success && 'data' in result) {
    return NextResponse.json(result.data);
  } else {
    return NextResponse.json(
      { message: result.message },
      { status: ('statusCode' in result ? result.statusCode : 404) }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (user, _req) => {
    const body = await _req.json();
    const { action } = body;

    if (action === 'markAsRead') {
      return await markNotificationAsRead(params.id, user.id);
    }

    return { success: false, message: '지원하지 않는 액션입니다.' };
  }, request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (user) => {
    return await deleteNotification(params.id, user.id);
  }, request);
}
