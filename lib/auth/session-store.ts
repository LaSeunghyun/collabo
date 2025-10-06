import { randomUUID } from 'crypto';

import { eq, inArray } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import {
  authDevices,
  authSessions,
  refreshTokens,
  users
} from '@/lib/db/schema';

import { issueAccessToken } from './access-token';
import { createOpaqueToken, fingerprintToken, hashClientHint, hashToken, verifyTokenHash } from './crypto';
import type { ClientKind } from './policy';
import { resolveSessionPolicy } from './policy';
import { deriveEffectivePermissions } from './permissions';
import { fetchUserWithPermissions } from './user';

type AuthSessionRow = typeof authSessions.$inferSelect;
type RefreshTokenRow = typeof refreshTokens.$inferSelect;
type AuthDeviceRow = typeof authDevices.$inferSelect;
type UserRoleType = typeof users.$inferSelect['role'];

type HydratedAuthSession = ReturnType<typeof hydrateSessionRow>;
type HydratedRefreshToken = ReturnType<typeof hydrateRefreshTokenRow>;

interface IssueSessionInput {
  userId: string;
  role: UserRoleType;
  remember: boolean;
  client: ClientKind;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceFingerprint?: string | null;
  deviceLabel?: string | null;
}

export interface IssuedSession {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshRecord: HydratedRefreshToken;
  session: HydratedAuthSession;
  permissions: string[];
}

interface RefreshResult {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshRecord: HydratedRefreshToken;
  session: HydratedAuthSession;
  permissions: string[];
}

const ADMIN_ROLE: UserRoleType = 'ADMIN';

const now = () => new Date();

const toIso = (value: Date) => value.toISOString();

function hydrateSessionRow(session: AuthSessionRow): HydratedAuthSession {
  return {
    ...session,
    createdAt: new Date(session.createdAt),
    lastUsedAt: new Date(session.lastUsedAt),
    absoluteExpiresAt: new Date(session.absoluteExpiresAt),
    revokedAt: session.revokedAt ? new Date(session.revokedAt) : null
  };
}

function hydrateRefreshTokenRow(token: RefreshTokenRow): HydratedRefreshToken {
  return {
    ...token,
    createdAt: new Date(token.createdAt),
    inactivityExpiresAt: new Date(token.inactivityExpiresAt),
    absoluteExpiresAt: new Date(token.absoluteExpiresAt),
    usedAt: token.usedAt ? new Date(token.usedAt) : null,
    revokedAt: token.revokedAt ? new Date(token.revokedAt) : null
  };
}

const loadUserPermissions = async (userId: string, fallbackRole: UserRoleType) => {
  const user = await fetchUserWithPermissions(userId);

  if (!user) {
    const effectivePermissions = deriveEffectivePermissions(fallbackRole, []);
    return { role: fallbackRole, permissions: effectivePermissions };
  }

  const explicitPermissions = user.permissions.map((entry) => entry.permission.key);
  const effectivePermissions = deriveEffectivePermissions(user.role as UserRoleType, explicitPermissions);

  return {
    role: user.role as UserRoleType,
    permissions: effectivePermissions
  };
};

const persistDevice = async (
  userId: string,
  deviceFingerprint?: string | null,
  deviceLabel?: string | null
): Promise<AuthDeviceRow | null> => {
  if (!deviceFingerprint) {
    return null;
  }

  const timestamp = toIso(now());

  try {
    const [record] = await db
      .insert(authDevices)
      .values({
        id: randomUUID(),
        userId,
        deviceFingerprint,
        label: deviceLabel ?? null,
        lastSeenAt: timestamp
      })
      .onConflictDoUpdate({
        target: [authDevices.userId, authDevices.deviceFingerprint],
        set: {
          lastSeenAt: timestamp,
          label: deviceLabel ?? null
        }
      })
      .returning();

    return record ?? null;
  } catch (error) {
    console.warn('Failed to persist device, continuing without device tracking:', error);
    return null;
  }
};

export const issueSessionWithTokens = async ({
  userId,
  role,
  remember,
  client,
  ipAddress,
  userAgent,
  deviceFingerprint,
  deviceLabel
}: IssueSessionInput): Promise<IssuedSession> => {
  try {
    const policy = resolveSessionPolicy({ role, remember, client });
    const current = now();
    const currentIso = toIso(current);
    const absoluteExpiresAt = new Date(current.getTime() + policy.refreshAbsoluteTtl * 1000);
    const device = await persistDevice(userId, deviceFingerprint, deviceLabel);
    const ipHash = hashClientHint(ipAddress ?? undefined);
    const uaHash = hashClientHint(userAgent ?? undefined);

    const [sessionRow] = await db
      .insert(authSessions)
      .values({
        id: randomUUID(),
        userId,
        deviceId: device?.id ?? null,
        ipHash: ipHash ?? null,
        uaHash: uaHash ?? null,
        remember,
        isAdmin: role === ADMIN_ROLE,
        client,
        absoluteExpiresAt: toIso(absoluteExpiresAt),
        lastUsedAt: currentIso
      })
      .returning();

    if (!sessionRow) {
      throw new Error('세션을 생성하지 못했습니다.');
    }

    const session = hydrateSessionRow(sessionRow);

    const refreshToken = createOpaqueToken();
    const refreshTokenHash = await hashToken(refreshToken);
    const refreshFingerprint = fingerprintToken(refreshToken);
    const refreshInactivity = new Date(current.getTime() + policy.refreshSlidingTtl * 1000);

    const [refreshRow] = await db
      .insert(refreshTokens)
      .values({
        id: randomUUID(),
        sessionId: session.id,
        tokenHash: refreshTokenHash,
        tokenFingerprint: refreshFingerprint,
        inactivityExpiresAt: toIso(refreshInactivity),
        absoluteExpiresAt: toIso(absoluteExpiresAt)
      })
      .returning();

    if (!refreshRow) {
      throw new Error('리프레시 토큰을 생성하지 못했습니다.');
    }

    const refreshRecord = hydrateRefreshTokenRow(refreshRow);

    const { permissions, role: resolvedRole } = await loadUserPermissions(userId, role);

    const access = await issueAccessToken({
      userId,
      sessionId: session.id,
      role: resolvedRole,
      permissions,
      expiresIn: policy.accessTokenTtl
    });

    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshToken,
      refreshRecord,
      session,
      permissions
    };
  } catch (error) {
    console.error('Failed to issue session with tokens:', error);
    throw new Error(`Session creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const revokeSessionAndToken = async (
  refreshTokenId: string,
  sessionId: string,
  timestamp: Date,
  options: { markUsed?: boolean } = {}
) => {
  const iso = toIso(timestamp);
  const refreshUpdates = options.markUsed
    ? { revokedAt: iso, usedAt: iso }
    : { revokedAt: iso };

  await db.transaction(async (tx) => {
    await tx
      .update(refreshTokens)
      .set(refreshUpdates)
      .where(eq(refreshTokens.id, refreshTokenId));

    await tx
      .update(authSessions)
      .set({ revokedAt: iso })
      .where(eq(authSessions.id, sessionId));
  });
};

export const rotateRefreshToken = async (
  refreshToken: string,
  {
    ipAddress,
    userAgent
  }: {
    ipAddress?: string | null;
    userAgent?: string | null;
  }
): Promise<RefreshResult> => {
  const fingerprint = fingerprintToken(refreshToken);
  const existingRow = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.tokenFingerprint, fingerprint)
  });

  if (!existingRow) {
    throw new Error('유효하지 않은 리프레시 토큰입니다.');
  }

  const existing = hydrateRefreshTokenRow(existingRow);
  const matches = await verifyTokenHash(refreshToken, existing.tokenHash);

  if (!matches) {
    throw new Error('리프레시 토큰 검증에 실패했습니다.');
  }

  if (existing.usedAt || existing.revokedAt) {
    await revokeSessionAndToken(existing.id, existing.sessionId, now());
    throw new Error('재사용이 감지된 리프레시 토큰입니다.');
  }

  const sessionRow = await db.query.authSessions.findFirst({
    where: eq(authSessions.id, existing.sessionId)
  });

  if (!sessionRow) {
    throw new Error('만료된 세션입니다.');
  }

  const session = hydrateSessionRow(sessionRow);

  if (session.revokedAt) {
    throw new Error('만료된 세션입니다.');
  }

  const current = now();

  if (session.absoluteExpiresAt <= current || existing.absoluteExpiresAt <= current) {
    await revokeSessionAndToken(existing.id, session.id, current);
    throw new Error('세션이 만료되었습니다. 다시 로그인하세요.');
  }

  if (existing.inactivityExpiresAt <= current) {
    await revokeSessionAndToken(existing.id, session.id, current);
    throw new Error('장시간 활동이 없어 세션이 만료되었습니다.');
  }

  const user = await fetchUserWithPermissions(session.userId);
  const baseRole: UserRoleType = session.isAdmin ? ADMIN_ROLE : (user?.role ?? 'PARTICIPANT');
  const explicitPermissions = user?.permissions.map((entry) => entry.permission.key) ?? [];
  const permissions = deriveEffectivePermissions(baseRole, explicitPermissions);

  const ipHash = hashClientHint(ipAddress ?? undefined);
  const uaHash = hashClientHint(userAgent ?? undefined);
  const policy = resolveSessionPolicy({
    role: baseRole,
    remember: session.remember,
    client: session.client === 'mobile' ? 'mobile' : 'web'
  });

  const newRefreshValue = createOpaqueToken();
  const newRefreshHash = await hashToken(newRefreshValue);
  const newFingerprint = fingerprintToken(newRefreshValue);
  const newInactivityExpiresAt = new Date(current.getTime() + policy.refreshSlidingTtl * 1000);

  const { updatedSession, newRefreshRecord } = await db.transaction(async (tx) => {
    const [sessionUpdate] = await tx
      .update(authSessions)
      .set({
        lastUsedAt: toIso(current),
        ipHash: ipHash ?? null,
        uaHash: uaHash ?? null
      })
      .where(eq(authSessions.id, session.id))
      .returning();

    if (!sessionUpdate) {
      throw new Error('세션 갱신에 실패했습니다.');
    }

    const [refreshInsert] = await tx
      .insert(refreshTokens)
      .values({
        id: randomUUID(),
        sessionId: session.id,
        tokenHash: newRefreshHash,
        tokenFingerprint: newFingerprint,
        inactivityExpiresAt: toIso(newInactivityExpiresAt),
        absoluteExpiresAt: toIso(session.absoluteExpiresAt)
      })
      .returning();

    if (!refreshInsert) {
      throw new Error('리프레시 토큰 갱신에 실패했습니다.');
    }

    await tx
      .update(refreshTokens)
      .set({
        usedAt: toIso(current),
        rotatedToId: refreshInsert.id
      })
      .where(eq(refreshTokens.id, existing.id));

    return {
      updatedSession: sessionUpdate,
      newRefreshRecord: refreshInsert
    };
  });

  const hydratedSession = hydrateSessionRow(updatedSession);
  const hydratedRefresh = hydrateRefreshTokenRow(newRefreshRecord);

  const access = await issueAccessToken({
    userId: session.userId,
    sessionId: session.id,
    role: baseRole,
    permissions,
    expiresIn: policy.accessTokenTtl
  });

  return {
    accessToken: access.token,
    accessTokenExpiresAt: access.expiresAt,
    refreshToken: newRefreshValue,
    refreshRecord: hydratedRefresh,
    session: hydratedSession,
    permissions
  };
};

export const revokeSession = async (sessionId: string) => {
  const timestamp = toIso(now());
  const [sessionRow] = await db
    .update(authSessions)
    .set({ revokedAt: timestamp })
    .where(eq(authSessions.id, sessionId))
    .returning();

  return sessionRow ? hydrateSessionRow(sessionRow) : null;
};

export const revokeAllSessionsForUser = async (userId: string) => {
  const timestamp = now();
  const iso = toIso(timestamp);

  await db.transaction(async (tx) => {
    const sessionIds = (
      await tx
        .select({ id: authSessions.id })
        .from(authSessions)
        .where(eq(authSessions.userId, userId))
    ).map((row) => row.id);

    if (sessionIds.length === 0) {
      return;
    }

    await tx
      .update(refreshTokens)
      .set({
        revokedAt: iso,
        usedAt: iso
      })
      .where(inArray(refreshTokens.sessionId, sessionIds));

    await tx
      .update(authSessions)
      .set({ revokedAt: iso })
      .where(eq(authSessions.userId, userId));
  });
};

export const revokeSessionByRefreshToken = async (refreshToken: string) => {
  const fingerprint = fingerprintToken(refreshToken);
  const recordRow = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.tokenFingerprint, fingerprint)
  });

  if (!recordRow) {
    return null;
  }

  const record = hydrateRefreshTokenRow(recordRow);
  const matches = await verifyTokenHash(refreshToken, record.tokenHash);

  if (!matches) {
    return null;
  }

  const sessionRow = await db.query.authSessions.findFirst({
    where: eq(authSessions.id, record.sessionId)
  });

  if (!sessionRow) {
    return null;
  }

  const session = hydrateSessionRow(sessionRow);
  await revokeSessionAndToken(record.id, record.sessionId, now(), { markUsed: true });
  return session;
};
