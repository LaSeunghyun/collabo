import { NextResponse, type NextRequest } from 'next/server';

import { verifyAccessToken } from '@/lib/auth/access-token';

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 });
  }

  try {
    await verifyAccessToken(token);

    // 세션 조회 기능은 추후 구현 예정
    const sessions: any[] = [];

    return NextResponse.json({
      sessions: sessions.map(session => ({
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        isActive: !session.revokedAt,
        deviceInfo: session.deviceInfo || null
      }))
    });
  } catch (error) {
    console.error('세션 조회 실패', error);
    return NextResponse.json({ error: '인증 토큰이 유효하지 않습니다.' }, { status: 401 });
  }
}