import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';

import { getDbClient } from '@/lib/db/client';
import { authSessions } from '@/lib/db/schema';
import { getServerAuthSession } from '@/lib/auth/session';

// Force dynamic rendering since we use headers() in getServerAuthSession
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // NextAuth ?�션 ?�인
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '?�증???�요?�니??' }, { status: 401 });
    }

    const db = await getDbClient();
    
    // ?�용?�의 ?�성 ?�션 목록 조회
    const sessions = await db
      .select({
        id: authSessions.id,
        userId: authSessions.userId,
        createdAt: authSessions.createdAt,
        lastUsedAt: authSessions.lastUsedAt,
        revokedAt: authSessions.revokedAt,
        deviceId: authSessions.deviceId
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
        deviceId: session.deviceId || null
      }))
    });
  } catch (error) {
    console.error('?�션 조회 ?�패', error);
    return NextResponse.json({ error: '?�션 조회???�패?�습?�다.' }, { status: 500 });
  }
}
