import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';

interface RoleGuard {
  matcher: string;
  pattern: RegExp;
  roles?: string[];
  permissions?: string[];
}

const ROLE_GUARDS: RoleGuard[] = [
  {
    matcher: '/admin/:path*',
    pattern: /^\/admin(?:\/.*)?$/,
    roles: ['ADMIN']
  },
  {
    matcher: '/projects/new',
    pattern: /^\/projects\/new$/,
    roles: ['CREATOR', 'ADMIN'],
    permissions: ['project:create']
  },
  {
    matcher: '/partners/:path*',
    pattern: /^\/partners(?:\/.*)?$/,
    roles: ['PARTNER', 'ADMIN'],
    permissions: ['partner:manage']
  },
  {
    matcher: '/api/projects/:path*',
    pattern: /^\/api\/projects(?:\/.*)?$/,
    roles: ['CREATOR', 'ADMIN']
  },
  {
    matcher: '/api/partners/:path*',
    pattern: /^\/api\/partners(?:\/.*)?$/,
    roles: ['PARTNER', 'ADMIN'],
    permissions: ['partner:manage']
  },
  {
    matcher: '/api/settlement/:path*',
    pattern: /^\/api\/settlement(?:\/.*)?$/,
    roles: ['ADMIN'],
    permissions: ['settlement:manage']
  }
];

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const guard = ROLE_GUARDS.find(({ pattern }) => pattern.test(req.nextUrl.pathname));

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

    const role = typeof token.role === 'string' ? token.role.toUpperCase() : undefined;
    const permissions = Array.isArray(token.permissions) ? (token.permissions as string[]) : [];

    const hasRole = guard.roles ? (role ? guard.roles.includes(role) : false) : true;
    const hasPermissions = guard.permissions
      ? guard.permissions.every((permission) => permissions.includes(permission))
      : true;

    if (!hasRole || !hasPermissions) {
      return unauthorizedResponse();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 비회원도 접근 가능한 페이지들
        const publicPaths = [
          '/',
          '/projects',
          '/projects/[id]',
          '/community',
          '/help',
          '/api/community',
          '/api/projects',
          '/api/projects/[id]'
        ];

        const isPublicPath = publicPaths.some(path => {
          if (path.includes('[id]')) {
            return req.nextUrl.pathname.match(new RegExp(path.replace('[id]', '[^/]+')));
          }
          return req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path + '/');
        });

        // 공개 페이지는 토큰 없이도 접근 가능
        if (isPublicPath) {
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
    ...ROLE_GUARDS.map((guard) => guard.matcher),
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
