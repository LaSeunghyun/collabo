import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';
import type { UserRoleType } from '@/types/auth';

import { verifyAccessToken } from './access-token';
import { authOptions } from './options';
import { deriveEffectivePermissions, hasAllPermissions, normalizeRole } from './permissions';

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: UserRoleType;
  permissions: string[];
}

export type GuardRequirement = {
  roles?: UserRoleType[];
  permissions?: string[];
};

type HeaderGetter = {
  get(name: string): string | null | undefined;
};

export interface AuthorizationContext {
  headers?: HeaderGetter | null;
  authorization?: string | null;
}

const resolveAuthorizationHeader = (context?: AuthorizationContext) => {
  if (!context) {
    return null;
  }

  if (context.authorization) {
    return context.authorization;
  }

  try {
    return context.headers?.get('authorization') ?? null;
  } catch (error) {
    console.warn('Failed to read authorization header from context', error);
    return null;
  }
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

const evaluateBearerToken = async (
  requirements: GuardRequirement,
  context?: AuthorizationContext
): Promise<AuthorizationResult | null> => {
  const authorization = resolveAuthorizationHeader(context);

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return {
      status: AuthorizationStatus.UNAUTHENTICATED,
      session: null,
      user: null
    };
  }

  try {
    const verified = await verifyAccessToken(token);

    const session = await prisma.authSession.findUnique({
      where: { id: verified.sessionId },
      include: {
        user: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!session || session.revokedAt) {
      return {
        status: AuthorizationStatus.UNAUTHENTICATED,
        session: null,
        user: null
      };
    }

    if (session.absoluteExpiresAt <= new Date()) {
      return {
        status: AuthorizationStatus.UNAUTHENTICATED,
        session: null,
        user: null
      };
    }

    const explicitPermissions = session.user.permissions.map(
      (entry) => entry.permission.key
    );
    const role = session.user.role as UserRoleType;
    const permissions = deriveEffectivePermissions(role, explicitPermissions);

    if (requirements.roles && !requirements.roles.includes(role)) {
      return {
        status: AuthorizationStatus.FORBIDDEN,
        session: null,
        user: null
      };
    }

    if (requirements.permissions && !hasAllPermissions(permissions, requirements.permissions)) {
      return {
        status: AuthorizationStatus.FORBIDDEN,
        session: null,
        user: null
      };
    }

    return {
      status: AuthorizationStatus.AUTHORIZED,
      session: null,
      user: {
        id: session.userId,
        name: session.user.name,
        email: session.user.email,
        role,
        permissions
      }
    };
  } catch (error) {
    console.warn('Bearer ?†ÌÅ∞ Í≤ÄÏ¶??§Ìå®', error);
    return {
      status: AuthorizationStatus.UNAUTHENTICATED,
      session: null,
      user: null
    };
  }
};

export const evaluateAuthorization = async (
  requirements: GuardRequirement = {},
  context?: AuthorizationContext
): Promise<AuthorizationResult> => {
  const bearerResult = await evaluateBearerToken(requirements, context);

  if (bearerResult) {
    return bearerResult;
  }

  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return {
      status: AuthorizationStatus.UNAUTHENTICATED,
      session,
      user: null
    };
  }

  const role = normalizeRole(session.user.role) as UserRoleType;
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
