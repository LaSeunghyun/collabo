import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { eq } from 'drizzle-orm';

import { getDbClient } from '@/lib/db/client';
import { authSessions, userPermission } from '@/lib/db/schema';
import { userRole } from '@/lib/db/schema';

import { verifyAccessToken } from './access-token';
import { authOptions } from './options';
import { deriveEffectivePermissions, hasAllPermissions, normalizeRole } from './permissions';

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: typeof userRole.enumValues[number];
  permissions: string[];
}

export type GuardRequirement = {
  roles?: typeof userRole.enumValues[number][];
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

    const db = await getDbClient();
    const session = await (db as any).query.authSessions.findFirst({
      where: eq(authSessions.id, verified.sessionId),
      with: {
        user: {
          with: {
            permissions: {
              with: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!session || session.revokedAt || !session.user) {
      return {
        status: AuthorizationStatus.UNAUTHENTICATED,
        session: null,
        user: null
      };
    }

    const absoluteExpiry = session.absoluteExpiresAt
      ? new Date(session.absoluteExpiresAt)
      : null;

    if (!absoluteExpiry || absoluteExpiry <= new Date()) {
      return {
        status: AuthorizationStatus.UNAUTHENTICATED,
        session: null,
        user: null
      };
    }

    const explicitPermissions = session.user.permissions
      .filter((entry: any): entry is typeof userPermission.$inferSelect & { permission: { key: string } } =>
        Boolean(entry.permission?.key)
      )
      .map((entry: any) => entry.permission.key);
    const role = session.user.role as typeof userRole.enumValues[number];
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
    console.warn('Bearer token verification failed', error);
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

  const role = normalizeRole(session.user.role) as typeof userRole.enumValues[number];
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
