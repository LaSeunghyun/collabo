import { NextRequest, NextResponse } from 'next/server';

import { getServerAuthSession } from '@/lib/auth/session';
import { revokeSession } from '@/lib/auth/session-store';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 현재 세션 종료
    if (session.sessionToken) {
      await revokeSession(session.sessionToken);
    }

    return NextResponse.json({ 
      message: '로그아웃이 성공적으로 완료되었습니다.' 
    });
  } catch (error) {
    console.error('로그아웃 처리 중 오류:', error);
    return NextResponse.json({ 
      error: '로그아웃 처리에 실패했습니다.' 
    }, { status: 500 });
  }
}