import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';

import {
  findMatchingGuard,
  isAuthorizedForGuard
} from '@/lib/auth/role-guards';
import { getRateLimiterForPath } from '@/lib/middleware/rate-limit';

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    // Rate limiting middleware
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

        // Public paths that don't require authentication
        const publicPaths = [
          '/',
          '/projects',
          '/help',
          '/api/projects',
          '/api/partners',
          '/api/hero-slides',
          '/api/categories',
          '/api/community',
          '/api/store',
          '/api/test-accounts'
        ];

        // Check for exact path matches
        const isExactMatch = publicPaths.includes(pathname);

        // Check for dynamic paths (e.g., /projects/[id], /api/projects/[id])
        const isDynamicMatch =
          pathname.match(/^\/projects\/[^/]+$/) || // /projects/[id]
          pathname.match(/^\/api\/projects\/[^/]+$/) || // /api/projects/[id]
          pathname.startsWith('/api/projects/') || // /api/projects/ sub-paths
          pathname.startsWith('/api/community/'); // /api/community/ sub-paths

        // If exact match or dynamic match, allow access without authentication
        if (isExactMatch || isDynamicMatch) {
          return true;
        }

        // For other paths, require authentication (token must exist)
        return Boolean(token);
      }
    }
  }
);

export const config = {
  matcher: [
    // Paths that require protection
    '/admin/:path*',
    '/partners/:path*',
    '/projects/new',
    '/api/partners/:path*',
    '/api/settlement/:path*'
  ]
};