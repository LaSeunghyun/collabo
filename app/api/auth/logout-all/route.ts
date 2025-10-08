import { NextResponse, type NextRequest } from 'next/server';

import { verifyAccessToken } from '@/lib/auth/access-token';
import { buildRefreshCookieRemoval } from '@/lib/auth/cookies';
import { blacklistToken } from '@/lib/auth/token-blacklist';
import { revokeAllSessionsForUser } from '@/lib/auth/session-store';

export async function POST(req: NextRequest) {
  const authorization = req.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '?�증 ?�큰???�요?�니??' }, { status: 401 });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return NextResponse.json({ error: '?�증 ?�큰???�요?�니??' }, { status: 401 });
  }

  try {
    const verified = await verifyAccessToken(token);

    await revokeAllSessionsForUser(verified.userId);
    await blacklistToken(verified.jti, verified.expiresAt);

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Set-Cookie': buildRefreshCookieRemoval()
        }
      }
    );
  } catch (error) {
    console.error('?�체 로그?�웃 처리 ?�패', error);
    return NextResponse.json({ error: '?�증 ?�큰???�효?��? ?�습?�다.' }, { status: 401 });
  }
}
