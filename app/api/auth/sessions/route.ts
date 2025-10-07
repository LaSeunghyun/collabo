import { NextResponse, type NextRequest } from 'next/server';

import { verifyAccessToken } from '@/lib/auth/access-token';
// import { prisma } from '@/lib/prisma'; // TODO: Drizzle로 전환 필요

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
    const verified = await verifyAccessToken(token);

    // TODO: Drizzle로 전환 필요
    const sessions: any[] = [];

    return NextResponse.json({
      sessions: sessions.map((session) => ({
        id: session.id,
        createdAt: session.createdAt.toISOString(),
        lastUsedAt: session.lastUsedAt.toISOString(),
        absoluteExpiresAt: session.absoluteExpiresAt.toISOString(),
        remember: session.remember,
        client: session.client,
        ipHash: session.ipHash,
        uaHash: session.uaHash,
        isAdmin: session.isAdmin,
        device: session.device
          ? {
              id: session.device.id,
              label: session.device.label,
              firstSeenAt: session.device.firstSeenAt.toISOString(),
              lastSeenAt: session.device.lastSeenAt.toISOString()
            }
          : null,
        current: session.id === verified.sessionId
      }))
    });
  } catch (error) {
    console.error('세션 조회 실패', error);
    return NextResponse.json({ error: '인증 토큰이 유효하지 않습니다.' }, { status: 401 });
  }
}
