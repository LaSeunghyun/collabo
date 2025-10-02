import { UserRole, USER_ROLE_VALUES, USER_ROLE_LABELS, type UserRoleValue } from '@/types/prisma';

export { UserRole, USER_ROLE_VALUES, USER_ROLE_LABELS };

export type AppUserRole = UserRoleValue;

const DEFAULT_SESSION_PERMISSION = 'session:read';

const BASE_ROLE_PERMISSIONS: Record<AppUserRole, string[]> = {
  CREATOR: ['project:create', 'project:update', 'project:view-dashboard', 'community:moderate'],
  PARTICIPANT: ['project:view', 'community:participate', 'order:create'],
  PARTNER: ['project:view', 'partner:manage', 'partner:respond'],
  ADMIN: ['admin:manage', 'project:review', 'settlement:manage', 'partner:verify']
};

export const ROLE_LABELS: Record<AppUserRole, string> = {
  CREATOR: '크리에이터',
  PARTICIPANT: '참여자',
  PARTNER: '파트너',
  ADMIN: '관리자'
};

export function normalizeRole(value: string | null | undefined): AppUserRole {
  if (!value) {
    return UserRole.PARTICIPANT;
  }

  const upperValue = value.toUpperCase();
  return USER_ROLE_VALUES.includes(upperValue as AppUserRole)
    ? (upperValue as AppUserRole)
    : UserRole.PARTICIPANT;
}

export function toPrismaRole(value: string | null | undefined): UserRoleValue {
  return normalizeRole(value) as UserRoleValue;
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

export const CREATOR_ACCESS_ROLES: AppUserRole[] = [UserRole.CREATOR, UserRole.ADMIN];
export const PARTNER_ACCESS_ROLES: AppUserRole[] = [UserRole.PARTNER, UserRole.ADMIN];
