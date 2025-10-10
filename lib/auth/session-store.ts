import { randomUUID } from 'crypto';
import { eq, inArray } from 'drizzle-orm';
import { getDbClient } from '@/lib/db/client';
import {
  authDevices,
  authSessions,
  refreshTokens,
  userRoleEnum as userRole,
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
type UserRoleType = typeof userRole.enumValues[number];

type HydratedAuthSession = {
  id: string;
  userId: string;
  deviceId: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  ipHash: string | null;
  uaHash: string | null;
  remember: boolean;
  isAdmin: boolean;
  client: string;
  absoluteExpiresAt: Date;
  revokedAt: Date | null;
};

type HydratedRefreshToken = {
  id: string;
  sessionId: string;
  tokenHash: string;
  tokenFingerprint: string;
  createdAt: Date;
  inactivityExpiresAt: Date;
  absoluteExpiresAt: Date;
  usedAt: Date | null;
  rotatedToId: string | null;
  revokedAt: Date | null;
};

interface IssueSessionInput {
  userId: string;
  role: UserRoleType;
  remember: boolean;
  client: ClientKind;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceFingerprint?: string | null;
  deviceLabel?: string | null;
  name?: string;
  email?: string;
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
    // const db = await getDb();
  // 우선순위 기본 권한을 사용
  const effectivePermissions = deriveEffectivePermissions(fallbackRole, []);
  return { role: fallbackRole, permissions: effectivePermissions };
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

  const db = await getDbClient();

  try {
    const [record] = await db
      .insert(authDevices)
      .values({
        id: randomUUID(),
        userId,
        fingerprint: deviceFingerprint,
        deviceName: deviceLabel ?? null,
        updatedAt: timestamp
      })
      .onConflictDoUpdate({
        target: [authDevices.userId, authDevices.fingerprint],
        set: {
          updatedAt: timestamp,
          deviceName: deviceLabel ?? null
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
  deviceLabel,
  name,
  email
}: IssueSessionInput): Promise<IssuedSession> => {
  try {
    const policy = resolveSessionPolicy({ role, remember, client });
    const current = now();
    const currentIso = toIso(current);
    const absoluteExpiresAt = new Date(current.getTime() + policy.refreshAbsoluteTtl * 1000);
    const device = await persistDevice(userId, deviceFingerprint, deviceLabel);
    const ipHash = hashClientHint(ipAddress ?? undefined);
    const uaHash = hashClientHint(userAgent ?? undefined);

    const db = await getDbClient();
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
      throw new Error('Failed to create session.');
    }

    const session = hydrateSessionRow(sessionRow);

    const refreshTokenValue = createOpaqueToken();
    const refreshTokenHash = await hashToken(refreshTokenValue);
    const refreshFingerprint = fingerprintToken(refreshTokenValue);
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
      throw new Error('Failed to create refresh token.');
    }

    const refreshRecord = hydrateRefreshTokenRow(refreshRow);

    const { permissions, role: resolvedRole } = await loadUserPermissions(userId, role);

    const access = await issueAccessToken({
      userId,
      sessionId: session.id,
      role: resolvedRole,
      permissions,
      expiresIn: policy.accessTokenTtl,
      name,
      email
    });

    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshToken: refreshTokenValue,
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

  const db = await getDbClient();

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
  refreshTokenValue: string,
  {
    ipAddress,
    userAgent
  }: {
    ipAddress?: string | null;
    userAgent?: string | null;
  }
): Promise<RefreshResult> => {
  const db = await getDbClient();
  const fingerprint = fingerprintToken(refreshTokenValue);
  const existingRow = await (db as any).query.refreshTokens.findFirst({
    where: eq(refreshTokens.tokenFingerprint, fingerprint)
  });

  if (!existingRow) {
    throw new Error('Invalid refresh token.');
  }

  const existing = hydrateRefreshTokenRow(existingRow);
  const matches = await verifyTokenHash(refreshTokenValue, existing.tokenHash);

  if (!matches) {
    throw new Error('Failed to verify refresh token.');
  }

  if (existing.usedAt || existing.revokedAt) {
    await revokeSessionAndToken(existing.id, existing.sessionId, now());
    throw new Error('Refresh token reuse detected.');
  }

  const sessionRow = await (db as any).query.authSessions.findFirst({
    where: eq(authSessions.id, existing.sessionId)
  });

  if (!sessionRow) {
    throw new Error('Session has expired.');
  }

  const session = hydrateSessionRow(sessionRow);

  if (session.revokedAt) {
    throw new Error('Session has expired.');
  }

  const current = now();

  if (session.absoluteExpiresAt <= current || existing.absoluteExpiresAt <= current) {
    await revokeSessionAndToken(existing.id, session.id, current);
    throw new Error('Session expired. Please sign in again.');
  }

  if (existing.inactivityExpiresAt <= current) {
    await revokeSessionAndToken(existing.id, session.id, current);
    throw new Error('Session expired due to inactivity.');
  }

  const user = await fetchUserWithPermissions({ id: session.userId });
  const baseRole: UserRoleType = session.isAdmin ? ADMIN_ROLE : (user?.role ?? 'PARTICIPANT');
  const explicitPermissions = user?.permission.map((entry: any) => entry.permission.key) ?? [];
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
      throw new Error('Failed to update session.');
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
      throw new Error('Failed to rotate refresh token.');
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

  const db = await getDbClient();
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

  const db = await getDbClient();

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

export const revokeSessionByRefreshToken = async (refreshTokenValue: string) => {                                                                        
  const db = await getDbClient();
  const fingerprint = fingerprintToken(refreshTokenValue);
  const recordRow = await (db as any).query.refreshTokens.findFirst({
    where: eq(refreshTokens.tokenFingerprint, fingerprint)
  });

  if (!recordRow) {
    return null;
  }

  const record = hydrateRefreshTokenRow(recordRow);
  const matches = await verifyTokenHash(refreshTokenValue, record.tokenHash);

  if (!matches) {
    return null;
  }

  const sessionRow = await (db as any).query.authSessions.findFirst({
    where: eq(authSessions.id, record.sessionId)
  });

  if (!sessionRow) {
    return null;
  }

  const session = hydrateSessionRow(sessionRow);
  await revokeSessionAndToken(record.id, record.sessionId, now(), { markUsed: true });
  return session;
};