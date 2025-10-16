import { userRole } from '@/lib/db/schema';

import { hasAllPermissions, normalizeRole } from './permissions';

export interface RoleGuard {
  matcher: string;
  pattern: RegExp;
  roles?: typeof userRole.enumValues[number][];
  permissions?: string[];
}

export const ROLE_GUARDS: RoleGuard[] = [
  {
    matcher: '/admin/:path*',
    pattern: /^\/admin(?:\/.*)?$/,
    roles: ['ADMIN']
  },
  {
    matcher: '/partners/dashboard/:path*',
    pattern: /^\/partners\/dashboard(?:\/.*)?$/,
    roles: ['PARTNER', 'ADMIN'],
    permissions: ['partner:manage']
  },
  {
    matcher: '/projects/new',
    pattern: /^\/projects\/new$/,
    roles: ['CREATOR', 'ADMIN'],
    permissions: ['project:create']
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

export const findMatchingGuard = (pathname: string) =>
  ROLE_GUARDS.find(({ pattern }) => pattern.test(pathname));

export type GuardSubject = {
  role?: string | null;
  permissions?: string[] | null;
} | null;

export const isAuthorizedForGuard = (subject: GuardSubject, guard: RoleGuard | undefined) => {
  if (!guard) {
    return true;
  }

  if (!subject) {
    return false;
  }

  const role = normalizeRole(subject.role ?? null);
  const permissions = Array.isArray(subject.permissions) ? subject.permissions : [];

  const hasRequiredRole = guard.roles ? guard.roles.includes(role) : true;
  const hasRequiredPermissions = guard.permissions
    ? hasAllPermissions(permissions, guard.permissions)
    : true;

  return hasRequiredRole && hasRequiredPermissions;
};

export const canAccessRoute = (subject: GuardSubject, pathname: string) => {
  const guard = findMatchingGuard(pathname);
  return isAuthorizedForGuard(subject, guard);
};
