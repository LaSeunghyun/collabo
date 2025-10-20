import { NextResponse, type NextRequest } from 'next/server';

import { verifyAccessToken } from '@/lib/auth/access-token';
import { buildRefreshCookieRemoval, REFRESH_COOKIE } from '@/lib/auth/cookies';
import { blacklistToken } from '@/lib/auth/token-blacklist';
import { revokeSessionByRefreshToken } from '@/lib/auth/session-store';
import { logUserLogout } from '@/lib/server/activity-logger';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  let userId: string | null = null;

  if (refreshToken) {
    try {
      await revokeSessionByRefreshToken(refreshToken);
    } catch (error) {
      console.warn('세션 폐기 중 오류', error);
    }
  }

  const authorization = req.headers.get('authorization');

  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice(7).trim();

    if (token) {
      try {
        const verified = await verifyAccessToken(token);
        userId = verified.userId;
        await blacklistToken(verified.jti, verified.expiresAt);
      } catch (error) {
        console.warn('액세스 토큰 블랙리스트 처리 실패', error);
      }
    }
  }

  // 로그아웃 활동 로깅
  if (userId) {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? null;
    const userAgent = req.headers.get('user-agent') ?? null;

    // 사용자 정보는 토큰에서 가져올 수 없으므로 기본값 사용
    await logUserLogout(userId, 'unknown@example.com', 'Unknown User', 'Unknown Role', {
      ipAddress,
      userAgent,
      path: '/api/auth/logout',
      method: 'POST',
      statusCode: 200,
      metadata: {
        logoutMethod: 'api'
      }
    });
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
