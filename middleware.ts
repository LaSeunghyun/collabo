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
    // ?ˆì´??ë¦¬ë????ìš©
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

        // ?¸ì¦ ?¬ë??€ ?ê??†ì´ ?‘ê·¼ ê°€?¥í•œ ê³µìš© ê²½ë¡œ ëª©ë¡
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

        // ?•í™•???¼ì¹˜?˜ëŠ” ê²½ë¡œ?¸ì? ?•ì¸
        const isExactMatch = publicPaths.includes(pathname);

        // ?™ì  ê²½ë¡œ(?? /projects/[id], /api/projects/[id])?¸ì? ?•ì¸
        const isDynamicMatch =
          pathname.match(/^\/projects\/[^/]+$/) || // /projects/[id]
          pathname.match(/^\/api\/projects\/[^/]+$/) || // /api/projects/[id]
          pathname.startsWith('/api/projects/'); // /api/projects/ ?˜ìœ„ ê²½ë¡œ

        // ?•í™•??ë§¤ì¹­?´ê±°???™ì  ë§¤ì¹­?´ë©´ ?¸ì¦ ?†ì´ ?‘ê·¼ ?ˆìš©
        if (isExactMatch || isDynamicMatch) {
          return true;
        }

        // ê·???ê²½ë¡œ??? í°(ë¡œê·¸?? ì¡´ì¬ ?¬ë?ë¡??‘ê·¼ ?ˆìš© ê²°ì •
        return Boolean(token);
      }
    }
  }
);

export const config = {
  matcher: [
    // ë³´í˜¸ê°€ ?„ìš”??ê²½ë¡œë§?ë§¤ì¹­?©ë‹ˆ??
    '/admin/:path*',
    '/partners/:path*',
    '/projects/new',
    '/api/partners/:path*',
    '/api/settlement/:path*'
  ]
};

