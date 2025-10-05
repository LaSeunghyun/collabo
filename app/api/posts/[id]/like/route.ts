import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/guards';
import { togglePostLike } from '@/lib/server/post-interactions';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser({}, { headers: request.headers });
    const result = await togglePostLike(params.id, user.id);

    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('좋아요 처리 실패:', error);
    return NextResponse.json(
      { message: '좋아요 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser({}, { headers: request.headers });
    const result = await togglePostLike(params.id, user.id);

    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('좋아요 취소 실패:', error);
    return NextResponse.json(
      { message: '좋아요 취소에 실패했습니다.' },
      { status: 500 }
    );
  }
}
