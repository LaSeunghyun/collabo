import { NextResponse, type NextRequest } from 'next/server';
import { eq, desc } from 'drizzle-orm';

import { getDbClient } from '@/lib/db/client';
import { authSessions, users } from '@/lib/db/schema';
import { verifyAccessToken } from '@/lib/auth/access-token';
import { getServerAuthSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    // NextAuth 세션 확인
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const db = await getDbClient();
    
    // 사용자의 활성 세션 목록 조회
    const sessions = await db
      .select({
        id: authSessions.id,
        userId: authSessions.userId,
        createdAt: authSessions.createdAt,
        lastUsedAt: authSessions.lastUsedAt,
        revokedAt: authSessions.revokedAt,
        deviceInfo: authSessions.deviceInfo,
        ipAddress: authSessions.ipAddress,
        userAgent: authSessions.userAgent
      })
      .from(authSessions)
      .where(eq(authSessions.userId, session.user.id))
      .orderBy(desc(authSessions.lastUsedAt));

    return NextResponse.json({
      sessions: sessions.map(session => ({
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        isActive: !session.revokedAt,
        deviceInfo: session.deviceInfo || null,
        ipAddress: session.ipAddress || null,
        userAgent: session.userAgent || null
      }))
    });
  } catch (error) {
    console.error('세션 조회 실패', error);
    return NextResponse.json({ error: '세션 조회에 실패했습니다.' }, { status: 500 });
  }
}