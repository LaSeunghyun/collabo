import { NextResponse, type NextRequest } from 'next/server';

import { verifyAccessToken } from '@/lib/auth/access-token';
import { buildRefreshCookieRemoval, REFRESH_COOKIE } from '@/lib/auth/cookies';
import { blacklistToken } from '@/lib/auth/token-blacklist';
import { revokeSessionByRefreshToken } from '@/lib/auth/session-store';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    try {
      await revokeSessionByRefreshToken(refreshToken);
    } catch (error) {
      console.warn('?�션 ?�기 �??�류', error);
    }
  }

  const authorization = req.headers.get('authorization');

  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice(7).trim();

    if (token) {
      try {
        const verified = await verifyAccessToken(token);
        await blacklistToken(verified.jti, verified.expiresAt);
      } catch (error) {
        console.warn('?�세???�큰 블랙리스??처리 ?�패', error);
      }
    }
  }

  return NextResponse.json(
    { success: true },
    {
      headers: {
        'Set-Cookie': buildRefreshCookieRemoval()
      }
    }
  );
}
