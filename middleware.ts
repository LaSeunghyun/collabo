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
    // ?�이??리�????�용
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

        // ?�증 ?��??� ?��??�이 ?�근 가?�한 공용 경로 목록
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

        // ?�확???�치?�는 경로?��? ?�인
        const isExactMatch = publicPaths.includes(pathname);

        // ?�적 경로(?? /projects/[id], /api/projects/[id])?��? ?�인
        const isDynamicMatch =
          pathname.match(/^\/projects\/[^/]+$/) || // /projects/[id]
          pathname.match(/^\/api\/projects\/[^/]+$/) || // /api/projects/[id]
          pathname.startsWith('/api/projects/'); // /api/projects/ ?�위 경로

        // ?�확??매칭?�거???�적 매칭?�면 ?�증 ?�이 ?�근 ?�용
        if (isExactMatch || isDynamicMatch) {
          return true;
        }

        // �???경로???�큰(로그?? 존재 ?��?�??�근 ?�용 결정
        return Boolean(token);
      }
    }
  }
);

export const config = {
  matcher: [
    // 보호가 ?�요??경로�?매칭?�니??
    '/admin/:path*',
    '/partners/:path*',
    '/projects/new',
    '/api/partners/:path*',
    '/api/settlement/:path*'
  ]
};

