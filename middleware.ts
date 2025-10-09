import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';

import {
  ROLE_GUARDS,
  findMatchingGuard,
  isAuthorizedForGuard
} from '@/lib/auth/role-guards';
import { getRateLimiterForPath } from '@/lib/middleware/rate-limit';

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    // 레이트 리미팅 적용
    const rateLimiter = getRateLimiterForPath(req.nextUrl.pathname);
    if (rateLimiter) {
      const rateLimitResponse = rateLimiter.middleware()(req);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }

    const guard = findMatchingGuard(req.nextUrl.pathname);

    if (!guard) {
      return NextResponse.next();
    }

    const token = req.nextauth.token;

    const isApiRoute = req.nextUrl.pathname.startsWith('/api/');

    const unauthorizedResponse = () => {
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'AccessDenied' },
          {
            status: token ? 403 : 401,
            headers: { 'content-type': 'application/json' }
          }
        );
      }

      const signInUrl = new URL('/api/auth/signin', req.url);
      signInUrl.searchParams.set('error', 'AccessDenied');
      return NextResponse.redirect(signInUrl);
    };

    if (!token) {
      return unauthorizedResponse();
    }

    const permissions = Array.isArray(token.permissions) ? (token.permissions as string[]) : [];

    const authorized = isAuthorizedForGuard(
      {
        role: typeof token.role === 'string' ? token.role : undefined,
        permissions
      },
      guard
    );

    if (!authorized) {
      return unauthorizedResponse();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // 인증 여부와 상관없이 접근 가능한 공용 경로 목록
        const publicPaths = [
          '/',
          '/projects',
          '/community',
          '/help',
          '/api/community',
          '/api/projects',
          '/api/partners',
          '/api/hero-slides',
          '/api/categories',
          '/api/store',
          '/api/test-accounts'
        ];

        // 정확히 일치하는 경로인지 확인
        const isExactMatch = publicPaths.includes(pathname);

        // 동적 경로(예: /projects/[id], /api/projects/[id])인지 확인
        const isDynamicMatch =
          pathname.match(/^\/projects\/[^/]+$/) || // /projects/[id]
          pathname.match(/^\/api\/projects\/[^/]+$/) || // /api/projects/[id]
          pathname.startsWith('/api/projects/'); // /api/projects/ 하위 경로

        // 정확한 매칭이거나 동적 매칭이면 인증 없이 접근 허용
        if (isExactMatch || isDynamicMatch) {
          return true;
        }

        // 그 외 경로는 토큰(로그인) 존재 여부로 접근 허용 결정
        return Boolean(token);
      }
    }
  }
);

export const config = {
  matcher: [
    // 보호가 필요한 경로만 매칭합니다.
    '/admin/:path*',
    '/partners/:path*',
    '/projects/new',
    '/api/partners/:path*',
    '/api/settlement/:path*'
  ]
};

