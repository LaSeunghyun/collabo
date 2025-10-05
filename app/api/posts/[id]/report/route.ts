import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/guards';
import { reportPost } from '@/lib/server/post-interactions';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { reason } = body;

    const user = await requireApiUser({}, { headers: request.headers });
    const result = await reportPost(params.id, user.id, reason);

    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('신고 접수 실패:', error);
    return NextResponse.json(
      { message: '신고 접수에 실패했습니다.' },
      { status: 500 }
    );
  }
}
