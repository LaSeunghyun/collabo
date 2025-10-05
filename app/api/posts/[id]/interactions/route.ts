import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/guards';
import { togglePostLike, togglePostDislike, reportPost, getPostInteractionStatus } from '@/lib/server/post-interactions';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, reason } = body;

    const user = await requireApiUser({}, { headers: request.headers });

    let result;

    switch (action) {
      case 'like':
        result = await togglePostLike(params.id, user.id);
        break;
      case 'dislike':
        result = await togglePostDislike(params.id, user.id);
        break;
      case 'report':
        if (!reason) {
          return NextResponse.json(
            { message: '신고 사유를 입력해주세요.' },
            { status: 400 }
          );
        }
        result = await reportPost(params.id, user.id, reason);
        break;
      default:
        return NextResponse.json(
          { message: '유효하지 않은 액션입니다.' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      message: result.message,
      data: result.data 
    });
  } catch (error) {
    console.error('상호작용 처리 실패:', error);
    return NextResponse.json(
      { message: '상호작용 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser({}, { headers: request.headers });
    const status = await getPostInteractionStatus(params.id, user.id);

    return NextResponse.json(status);
  } catch (error) {
    console.error('상호작용 상태 조회 실패:', error);
    return NextResponse.json(
      { message: '상호작용 상태를 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}
