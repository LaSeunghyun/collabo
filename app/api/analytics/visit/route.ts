import { NextRequest, NextResponse } from 'next/server';

import { recordVisit } from '@/lib/server/analytics';
import { logPageVisit } from '@/lib/server/activity-logger';
import { getServerAuthSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.sessionId !== 'string' || body.sessionId.trim().length === 0) {
      return NextResponse.json({ message: 'sessionId is required.' }, { status: 400 });
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? null;
    const userAgent = request.headers.get('user-agent') ?? null;
    const path = body.path || 'unknown';

    try {
      await recordVisit({
        sessionId: body.sessionId,
        ipAddress
      });

      // 현재 세션에서 사용자 정보 가져오기
      const session = await getServerAuthSession();
      const user = session?.user;

      // 간단한 로깅 먼저 테스트
      console.log('🔍 [VISIT API] 페이지 방문 기록:', {
        path,
        userId: user?.id ?? 'anonymous',
        userEmail: user?.email ?? 'no-email',
        userName: user?.name ?? 'no-name',
        userRole: (user as any)?.role ?? 'no-role',
        sessionId: body.sessionId,
        ipAddress: ipAddress ? `${ipAddress.substring(0, 8)}...` : 'no-ip'
      });

      try {
        // 페이지 방문 활동 로깅
        await logPageVisit(path, {
          userId: user?.id ?? null,
          userEmail: user?.email ?? null,
          userName: user?.name ?? null,
          userRole: (user as any)?.role ?? null,
          sessionId: body.sessionId,
          ipAddress,
          userAgent,
          path: '/api/analytics/visit',
          method: 'POST',
          statusCode: 201,
          metadata: {
            referrer: request.headers.get('referer'),
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.error('❌ [VISIT API] 로깅 실패:', logError);
      }
    } catch (error) {
      console.warn('Failed to record visit analytics:', {
        error: error instanceof Error ? error.message : String(error),
        sessionId: body.sessionId,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to handle visit analytics request', error);
    return NextResponse.json(
      { message: 'Unable to record visit.' },
      { status: 500 }
    );
  }
}
