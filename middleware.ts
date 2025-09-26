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
      authorized: ({ token }) => Boolean(token)
    }
  }
);

export const config = {
  matcher: ROLE_GUARDS.map((guard) => guard.matcher)
};
