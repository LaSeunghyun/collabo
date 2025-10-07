import { NextResponse, type NextRequest } from 'next/server';

import { buildRefreshCookie, buildRefreshCookieRemoval, REFRESH_COOKIE } from '@/lib/auth/cookies';
import { rotateRefreshToken } from '@/lib/auth/session-store';

const extractClientIp = (req: NextRequest) => {
  const forwarded = req.headers.get('x-forwarded-for');

  if (forwarded) {
    const [first] = forwarded.split(',');
    if (first) {
      return first.trim();
    }
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return null;
};

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(REFRESH_COOKIE)?.value;

  if (!cookie) {
    return NextResponse.json({ error: 'ë¦¬í”„?ˆì‹œ ? í°???„ìš”?©ë‹ˆ??' }, { status: 401 });
  }

  const ipAddress = extractClientIp(req);
  const userAgent = req.headers.get('user-agent');

  try {
    const rotated = await rotateRefreshToken(cookie, { ipAddress, userAgent });

    const refreshMaxAge = Math.max(
      0,
      Math.floor(
        (rotated.refreshRecord.inactivityExpiresAt.getTime() - Date.now()) / 1000
      )
    );

    return NextResponse.json(
      {
        accessToken: rotated.accessToken,
        accessTokenExpiresAt: rotated.accessTokenExpiresAt.toISOString(),
        refreshTokenExpiresAt: rotated.refreshRecord.inactivityExpiresAt.toISOString(),
        session: {
          id: rotated.session.id,
          absoluteExpiresAt: rotated.session.absoluteExpiresAt.toISOString(),
          lastUsedAt: rotated.session.lastUsedAt.toISOString(),
          remember: rotated.session.remember,
          client: rotated.session.client
        }
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': buildRefreshCookie(rotated.refreshToken, refreshMaxAge)
        }
      }
    );
  } catch (error) {
    console.error('ë¦¬í”„?ˆì‹œ ? í° ê°±ì‹  ?¤íŒ¨', error);
    return NextResponse.json(
      { error: '?¸ì…˜??? íš¨?˜ì? ?ŠìŠµ?ˆë‹¤. ?¤ì‹œ ë¡œê·¸?¸í•˜?¸ìš”.' },
      {
        status: 401,
        headers: {
          'Set-Cookie': buildRefreshCookieRemoval()
        }
      }
    );
  }
}
