import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { eq } from 'drizzle-orm';

import { getDbClient } from '@/lib/db/client';
import { authSessions, userPermissions, userRoleEnum } from '@/lib/db/schema';

import { verifyAccessToken } from './access-token';
import { authOptions } from './options';
import { deriveEffectivePermissions, hasAllPermissions, normalizeRole } from './permissions';

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: typeof userRoleEnum.enumValues[number];
  permissions: string[];
}

export type GuardRequirement = {
  roles?: typeof userRoleEnum.enumValues[number][];
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
      .filter((entry: any): entry is typeof userPermissions.$inferSelect & { permission: { key: string } } =>
        Boolean(entry.permission?.key)
      )
      .map((entry: any) => entry.permission.key);
    const role = session.user.role as typeof userRoleEnum.enumValues[number];
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
  // 프로덕션에서는 로깅 제거
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [AUTH] evaluateAuthorization 시작:', {
      hasRequirements: Object.keys(requirements).length > 0,
      requirements,
      hasContext: !!context,
      contextKeys: context ? Object.keys(context) : []
    });
  }

  const bearerResult = await evaluateBearerToken(requirements, context);

  if (bearerResult) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 [AUTH] Bearer 토큰으로 인증됨');
    }
    return bearerResult;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [AUTH] NextAuth 세션 조회 시작');
  }
  
  let session: Session | null = null;
  try {
    session = await getServerAuthSession();
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 [AUTH] NextAuth 세션 조회 결과:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasUserId: !!session?.user?.id,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userRole: session?.user?.role
      });
    }
  } catch (sessionError) {
    // NextAuth 세션 에러는 로깅하고 UNAUTHENTICATED 반환
    console.error('Failed to retrieve NextAuth session:', {
      error: sessionError instanceof Error ? sessionError.message : String(sessionError),
      errorName: sessionError instanceof Error ? sessionError.name : 'Unknown'
    });
    
    return {
      status: AuthorizationStatus.UNAUTHENTICATED,
      session: null,
      user: null
    };
  }

  if (!session?.user?.id) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ [AUTH] 세션 또는 사용자 ID 없음 - UNAUTHENTICATED');
    }
    return {
      status: AuthorizationStatus.UNAUTHENTICATED,
      session,
      user: null
    };
  }

  const role = normalizeRole(session.user.role) as typeof userRoleEnum.enumValues[number];
  const permissions = Array.isArray(session.user.permissions)
    ? session.user.permissions
    : [];

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [AUTH] 세션 사용자 정보:', {
      id: session.user.id,
      role,
      permissionsCount: permissions.length
    });
  }

  if (requirements.roles && !requirements.roles.includes(role)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⛔ [AUTH] 역할 불일치 - FORBIDDEN');
    }
    return {
      status: AuthorizationStatus.FORBIDDEN,
      session,
      user: null
    };
  }

  if (requirements.permissions && !hasAllPermissions(permissions, requirements.permissions)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⛔ [AUTH] 권한 불일치 - FORBIDDEN');
    }
    return {
      status: AuthorizationStatus.FORBIDDEN,
      session,
      user: null
    };
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [AUTH] 인증 성공 - AUTHORIZED');
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
