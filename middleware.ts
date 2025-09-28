import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';

import {
  ROLE_GUARDS,
  findMatchingGuard,
  isAuthorizedForGuard
} from '@/lib/auth/role-guards';

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
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

        // 비회원도 접근 가능한 페이지들
        const publicPaths = [
          '/',
          '/projects',
          '/community',
          '/help',
          '/api/community',
          '/api/projects',
          '/api/partners',
          '/api/test-accounts'
        ];

        // 정확한 경로 매칭
        const isExactMatch = publicPaths.includes(pathname);

        // 동적 경로 매칭
        const isDynamicMatch =
          pathname.match(/^\/projects\/[^/]+$/) || // /projects/[id]
          pathname.match(/^\/api\/projects\/[^/]+$/) || // /api/projects/[id]
          pathname.startsWith('/api/projects/'); // /api/projects/ 하위 모든 경로

        // 공개 페이지는 토큰 없이도 접근 가능
        if (isExactMatch || isDynamicMatch) {
          return true;
        }

        // 그 외 페이지는 토큰 필요
        return Boolean(token);
      }
    }
  }
);

export const config = {
  matcher: [
    // 보호된 페이지들
    '/admin/:path*',
    '/projects/new',
    '/partners/:path*',
    '/api/projects/:path*',
    '/api/partners/:path*',
    '/api/settlement/:path*',
    // 공개 페이지들 (인증 체크를 위해)
    '/',
    '/projects',
    '/projects/(.*)',
    '/community',
    '/help',
    '/api/community',
    '/api/projects',
    '/api/projects/(.*)'
  ]
};
