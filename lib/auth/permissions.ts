import { userRole } from '@/drizzle/schema';

export const UserRole = userRole.enumValues;
export const USER_ROLE_VALUES = userRole.enumValues;
export const USER_ROLE_LABELS: Record<typeof userRole.enumValues[number], string> = {
  CREATOR: '?�리?�이??,
  PARTICIPANT: '참여??,
  PARTNER: '?�트??,
  ADMIN: '관리자'
};

export type AppUserRole = typeof userRole.enumValues[number];

const DEFAULT_SESSION_PERMISSION = 'session:read';

const BASE_ROLE_PERMISSIONS: Record<AppUserRole, string[]> = {
  CREATOR: ['project:create', 'project:update', 'project:view-dashboard', 'community:moderate'],
  PARTICIPANT: ['project:view', 'community:participate', 'order:create'],
  PARTNER: ['project:view', 'partner:manage', 'partner:respond'],
  ADMIN: ['admin:manage', 'project:review', 'settlement:manage', 'partner:verify']
};

export const ROLE_LABELS: Record<AppUserRole, string> = {
  CREATOR: '?�리?�이??,
  PARTICIPANT: '참여??,
  PARTNER: '?�트??,
  ADMIN: '관리자'
};

export function normalizeRole(value: string | null | undefined): AppUserRole {
  if (!value) {
    return 'PARTICIPANT';
  }

  const upperValue = value.toUpperCase();
  return USER_ROLE_VALUES.includes(upperValue as AppUserRole)
    ? (upperValue as AppUserRole)
    : 'PARTICIPANT';
}

export function toPrismaRole(value: string | null | undefined): AppUserRole {
  return normalizeRole(value);
}

export function deriveEffectivePermissions(
  roleValue: string | null | undefined,
  explicit: string[] = []
): string[] {
  const normalizedRole = normalizeRole(roleValue);
  const merged = new Set<string>([
    ...BASE_ROLE_PERMISSIONS[normalizedRole],
    ...explicit,
    DEFAULT_SESSION_PERMISSION
  ]);

  if (normalizedRole === 'ADMIN') {
    for (const roleKey of USER_ROLE_VALUES) {
      for (const permission of BASE_ROLE_PERMISSIONS[roleKey]) {
        merged.add(permission);
      }
    }
    merged.add('admin:*');
  }

  return Array.from(merged).sort();
}

export function hasAllPermissions(
  userPermissions: string[] | undefined,
  required: string[] = []
): boolean {
  if (!required.length) {
    return true;
  }

  if (!userPermissions?.length) {
    return false;
  }

  return required.every((permission) => userPermissions.includes(permission));
}

export const CREATOR_ACCESS_ROLES: AppUserRole[] = ['CREATOR', 'ADMIN'];
export const PARTNER_ACCESS_ROLES: AppUserRole[] = ['PARTNER', 'ADMIN'];
