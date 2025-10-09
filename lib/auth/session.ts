import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';

import { userRole } from '@/drizzle/schema';

import { verifyAccessToken } from './access-token';
import { authOptions } from './options';
import { deriveEffectivePermissions, hasAllPermissions, normalizeRole } from './permissions';
// import { getDbClient } from '../db/client';

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

export type AuthorizationContext = {
  headers?: Headers;
  session?: Session | null;
};

export enum AuthorizationStatus {
  AUTHORIZED = 'AUTHORIZED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  FORBIDDEN = 'FORBIDDEN'
}

export const FORBIDDEN_ROUTE = '/forbidden';

const extractBearerToken = (context: AuthorizationContext): string | null => {
  return context.headers?.get('authorization') ?? context.headers?.get('Authorization') ?? null;
};

export const evaluateBearerToken = async (
  token: string,
  requirements: GuardRequirement
): Promise<{ status: AuthorizationStatus; session: Session | null; user: SessionUser | null }> => {
  try {
    const verified = await verifyAccessToken(token);

    // JWT 토큰에서 직접 사용자 정보 사용
    const role = normalizeRole(verified.role) as typeof userRole.enumValues[number];
    const permissions = deriveEffectivePermissions(role, verified.permissions);

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
        id: verified.userId,
        name: verified.name,
        email: verified.email,
        role,
        permissions
      }
    };
  } catch (error) {
    console.error('Bearer token evaluation failed:', error);
    return {
      status: AuthorizationStatus.UNAUTHENTICATED,
      session: null,
      user: null
    };
  }
};

export const evaluateAuthorization = async (
  requirements: GuardRequirement,
  context?: AuthorizationContext
): Promise<{ status: AuthorizationStatus; session: Session | null; user: SessionUser | null }> => {
  if (!context) {
    return {
      status: AuthorizationStatus.UNAUTHENTICATED,
      session: null,
      user: null
    };
  }

  // Bearer 토큰이 있는 경우 JWT 검증
  const authHeader = extractBearerToken(context);
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      return await evaluateBearerToken(token, requirements);
    }
  }

  // 세션 기반 인증
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      status: AuthorizationStatus.UNAUTHENTICATED,
      session: null,
      user: null
    };
  }

  const role = normalizeRole(session.user.role) as typeof userRole.enumValues[number];
  const permissions = deriveEffectivePermissions(role, session.user.permissions || []);

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

export const getServerAuthSession = async () => {
  return await getServerSession(authOptions);
};