import { userRoleEnum } from '@/lib/db/schema';
import {
  USER_ROLE_VALUES,
  USER_ROLE_LABELS,
  type UserRoleValue,
} from '@/lib/constants/enums';

export type AppUserRole = UserRoleValue;

const DEFAULT_SESSION_PERMISSION = 'session:read';

export const ROLE_PERMISSIONS: Record<AppUserRole, string[]> = {
  CREATOR: [
    'project:create',
    'project:read',
    'project:update',
    'project:delete',
    'funding:create',
    'funding:read',
    'community:create',
    'community:read',
    'community:update',
    'community:delete',
    'profile:read',
    'profile:update',
    'announcement:read',
    'settlement:read',
    DEFAULT_SESSION_PERMISSION
  ],
  PARTICIPANT: [
    'project:read',
    'funding:create',
    'funding:read',
    'community:create',
    'community:read',
    'community:update',
    'community:delete',
    'profile:read',
    'profile:update',
    'announcement:read',
    DEFAULT_SESSION_PERMISSION
  ],
  PARTNER: [
    'project:read',
    'funding:read',
    'community:create',
    'community:read',
    'community:update',
    'community:delete',
    'profile:read',
    'profile:update',
    'announcement:read',
    'settlement:read',
    DEFAULT_SESSION_PERMISSION
  ],
  ADMIN: [
    'project:create',
    'project:read',
    'project:update',
    'project:delete',
    'funding:create',
    'funding:read',
    'funding:update',
    'funding:delete',
    'community:create',
    'community:read',
    'community:update',
    'community:delete',
    'community:moderate',
    'profile:read',
    'profile:update',
    'profile:delete',
    'announcement:create',
    'announcement:read',
    'announcement:update',
    'announcement:delete',
    'settlement:create',
    'settlement:read',
    'settlement:update',
    'settlement:delete',
    'user:read',
    'user:update',
    'user:delete',
    'analytics:read',
    'moderation:read',
    'moderation:update',
    'moderation:delete',
    DEFAULT_SESSION_PERMISSION
  ]
};

export function getRolePermissions(role: AppUserRole): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

export function deriveEffectivePermissions(role: AppUserRole, additionalPermissions: string[] = []): string[] {
  const rolePermissions = getRolePermissions(role);
  const uniquePermissions = new Set([...rolePermissions, ...additionalPermissions]);
  return Array.from(uniquePermissions);
}

export function normalizeRole(role: string | undefined): AppUserRole {
  if (!role || !userRoleEnum.enum.includes(role as any)) {
    return 'PARTICIPANT';
  }
  return role as AppUserRole;
}