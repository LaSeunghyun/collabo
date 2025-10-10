import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';

import { getDbClient } from '@/lib/db/client';
import { authSessions } from '@/lib/db/schema';
import { getServerAuthSession } from '@/lib/auth/session';

export async function GET() {
  try {
    // NextAuth ?¸ì…˜ ?•ì¸
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '?¸ì¦???„ìš”?©ë‹ˆ??' }, { status: 401 });
    }

    const db = await getDbClient();
    
    // ?¬ìš©?ì˜ ?œì„± ?¸ì…˜ ëª©ë¡ ì¡°íšŒ
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
    console.error('?¸ì…˜ ì¡°íšŒ ?¤íŒ¨', error);
    return NextResponse.json({ error: '?¸ì…˜ ì¡°íšŒ???¤íŒ¨?ˆìŠµ?ˆë‹¤.' }, { status: 500 });
  }
}
