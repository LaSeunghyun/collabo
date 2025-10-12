import { NextResponse, type NextRequest } from 'next/server';
import { eq, desc } from 'drizzle-orm';

import { verifyAccessToken } from '@/lib/auth/access-token';
import { authSessions, authDevices } from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';

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
    const db = await getDb();

    // 사용자의 모든 세션 조회 (디바이스 정보 포함)
    const sessionsResult = await db
      .select({
        id: authSessions.id,
        createdAt: authSessions.createdAt,
        lastUsedAt: authSessions.lastUsedAt,
        absoluteExpiresAt: authSessions.absoluteExpiresAt,
        remember: authSessions.remember,
        client: authSessions.client,
        ipHash: authSessions.ipHash,
        uaHash: authSessions.uaHash,
        isAdmin: authSessions.isAdmin,
        deviceId: authSessions.deviceId,
        device: {
          id: authDevices.id,
          deviceName: authDevices.deviceName,
          deviceType: authDevices.deviceType,
          os: authDevices.os,
          createdAt: authDevices.createdAt,
          updatedAt: authDevices.updatedAt
        }
      })
      .from(authSessions)
      .leftJoin(authDevices, eq(authSessions.deviceId, authDevices.id))
      .where(eq(authSessions.userId, verified.userId))
      .orderBy(desc(authSessions.lastUsedAt));

    return NextResponse.json({
      sessions: sessionsResult.map((session) => ({
        id: session.id,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        absoluteExpiresAt: session.absoluteExpiresAt,
        remember: session.remember,
        client: session.client,
        ipHash: session.ipHash,
        uaHash: session.uaHash,
        isAdmin: session.isAdmin,
        device: session.device?.id ? {
          id: session.device.id,
          label: session.device.deviceName || 'Unknown Device',
          firstSeenAt: session.device.createdAt,
          lastSeenAt: session.device.updatedAt
        } : null,
        current: session.id === verified.sessionId
      }))
    });
  } catch (error) {
    console.error('세션 조회 실패', error);
    return NextResponse.json({ error: '인증 토큰이 유효하지 않습니다.' }, { status: 401 });
  }
}
