import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { UserRole } from '@prisma/client';

import { authOptions } from './options';
import { hasAllPermissions, normalizeRole } from './permissions';

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: UserRole;
  permissions: string[];
}

export type GuardRequirement = {
  roles?: UserRole[];
  permissions?: string[];
};

export const getServerAuthSession = () => getServerSession(authOptions);

export const FORBIDDEN_ROUTE = '/forbidden';

export enum AuthorizationStatus {
  AUTHORIZED = 'authorized',
  UNAUTHENTICATED = 'unauthenticated',
  FORBIDDEN = 'forbidden'
}

export interface AuthorizationResult {
  status: AuthorizationStatus;
  session: Session | null;
  user: SessionUser | null;
}

export const evaluateAuthorization = async (
  requirements: GuardRequirement = {}
): Promise<AuthorizationResult> => {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return {
      status: AuthorizationStatus.UNAUTHENTICATED,
      session,
      user: null
    };
  }

  const role = normalizeRole(session.user.role) as UserRole;
  const permissions = Array.isArray(session.user.permissions)
    ? session.user.permissions
    : [];

  if (requirements.roles && !requirements.roles.includes(role)) {
    return {
      status: AuthorizationStatus.FORBIDDEN,
      session,
      user: null
    };
  }

  if (requirements.permissions && !hasAllPermissions(permissions, requirements.permissions)) {
    return {
      status: AuthorizationStatus.FORBIDDEN,
      session,
      user: null
    };
  }

  return {
    status: AuthorizationStatus.AUTHORIZED,
    session,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role,
      permissions
    }
  };
};
