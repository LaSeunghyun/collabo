import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';

interface RoleGuard {
  matcher: string;
  pattern: RegExp;
  roles: string[];
}

const ROLE_GUARDS: RoleGuard[] = [
  {
    matcher: '/admin/:path*',
    pattern: /^\/admin(?:\/.*)?$/,
    roles: ['admin']
  }
];

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const guard = ROLE_GUARDS.find(({ pattern }) => pattern.test(req.nextUrl.pathname));

    if (!guard) {
      return NextResponse.next();
    }

    const token = req.nextauth.token;

    if (!token || !token.role || !guard.roles.includes(token.role)) {
      const signInUrl = new URL('/api/auth/signin', req.url);
      signInUrl.searchParams.set('error', 'AccessDenied');
      return NextResponse.redirect(signInUrl);
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
