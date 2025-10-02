import type { AuthSession, RefreshToken } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { UserRole, type UserRoleType } from '@/types/prisma';

import { issueAccessToken } from './access-token';
import type { ClientKind } from './policy';
import { resolveSessionPolicy } from './policy';
import { createOpaqueToken, fingerprintToken, hashClientHint, hashToken, verifyTokenHash } from './crypto';
import { deriveEffectivePermissions } from './permissions';
import { fetchUserWithPermissions } from './user';

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
  refreshRecord: RefreshToken;
  session: AuthSession;
  permissions: string[];
}

interface RefreshResult {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshRecord: RefreshToken;
  session: AuthSession;
  permissions: string[];
}

const now = () => new Date();

const loadUserPermissions = async (userId: string, fallbackRole: UserRoleType) => {
  const user = await fetchUserWithPermissions(userId);

  if (!user) {
    return { role: fallbackRole, permissions: [] };
  }

  return {
    role: user.role as UserRoleType,
    permissions: [] // 빈 배열로 설정
  };
};

const persistDevice = async (
  userId: string,
  deviceFingerprint?: string | null,
  deviceLabel?: string | null
) => {
  if (!deviceFingerprint) {
    return null;
  }

  const existing = await prisma.authDevice.upsert({
    where: {
      userId_deviceFingerprint: {
        userId,
        deviceFingerprint
      }
    },
    create: {
      userId,
      deviceFingerprint,
      label: deviceLabel ?? undefined
    },
    update: {
      lastSeenAt: now(),
      label: deviceLabel ?? undefined
    }
  });

  return existing;
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
  const policy = resolveSessionPolicy({ role, remember, client });
  const current = now();
  const absoluteExpiresAt = new Date(current.getTime() + policy.refreshAbsoluteTtl * 1000);
  const device = await persistDevice(userId, deviceFingerprint, deviceLabel);
  const ipHash = hashClientHint(ipAddress ?? undefined);
  const uaHash = hashClientHint(userAgent ?? undefined);

  const session = await prisma.authSession.create({
    data: {
      userId,
      deviceId: device?.id,
      ipHash: ipHash ?? undefined,
      uaHash: uaHash ?? undefined,
      remember,
      isAdmin: role === UserRole.ADMIN,
      client,
      absoluteExpiresAt
    }
  });

  const refreshToken = createOpaqueToken();
  const refreshTokenHash = await hashToken(refreshToken);
  const refreshFingerprint = fingerprintToken(refreshToken);
  const refreshInactivity = new Date(current.getTime() + policy.refreshSlidingTtl * 1000);

  const refreshRecord = await prisma.refreshToken.create({
    data: {
      sessionId: session.id,
      tokenHash: refreshTokenHash,
      tokenFingerprint: refreshFingerprint,
      inactivityExpiresAt: refreshInactivity,
      absoluteExpiresAt
    }
  });

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
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenFingerprint: fingerprint },
    include: {
      session: true
    }
  });

  if (!existing) {
    throw new Error('유효하지 않은 리프레시 토큰입니다.');
  }

  const matches = await verifyTokenHash(refreshToken, existing.tokenHash);

  if (!matches) {
    throw new Error('리프레시 토큰 검증에 실패했습니다.');
  }

  if (existing.usedAt || existing.revokedAt) {
    const timestamp = now();

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: timestamp }
      }),
      prisma.authSession.update({
        where: { id: existing.sessionId },
        data: { revokedAt: timestamp }
      })
    ]);

    throw new Error('재사용이 감지된 리프레시 토큰입니다.');
  }

  const session = await prisma.authSession.findUnique({
    where: { id: existing.sessionId },
    include: { user: { include: { permissions: { include: { permission: true } } } } }
  });

  if (!session || session.revokedAt) {
    throw new Error('만료된 세션입니다.');
  }

  const current = now();

  if (session.absoluteExpiresAt <= current || existing.absoluteExpiresAt <= current) {
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: current }
      }),
      prisma.authSession.update({
        where: { id: session.id },
        data: { revokedAt: current }
      })
    ]);

    throw new Error('세션이 만료되었습니다. 다시 로그인하세요.');
  }

  if (existing.inactivityExpiresAt <= current) {
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: current }
      }),
      prisma.authSession.update({
        where: { id: session.id },
        data: { revokedAt: current }
      })
    ]);

    throw new Error('장시간 활동이 없어 세션이 만료되었습니다.');
  }

  const ipHash = hashClientHint(ipAddress ?? undefined);
  const uaHash = hashClientHint(userAgent ?? undefined);
  const policy = resolveSessionPolicy({
    role: session.isAdmin ? UserRole.ADMIN : (session.user.role as UserRoleType),
    remember: session.remember,
    client: session.client === 'mobile' ? 'mobile' : 'web'
  });

  const newRefreshValue = createOpaqueToken();
  const newRefreshHash = await hashToken(newRefreshValue);
  const newFingerprint = fingerprintToken(newRefreshValue);
  const newInactivityExpiresAt = new Date(current.getTime() + policy.refreshSlidingTtl * 1000);

  const { updatedSession, newRefreshRecord } = await prisma.$transaction(async (tx) => {
    const updatedSession = await tx.authSession.update({
      where: { id: session.id },
      data: {
        lastUsedAt: current,
        ipHash: ipHash ?? undefined,
        uaHash: uaHash ?? undefined
      }
    });

    const newRefreshRecord = await tx.refreshToken.create({
      data: {
        sessionId: session.id,
        tokenHash: newRefreshHash,
        tokenFingerprint: newFingerprint,
        inactivityExpiresAt: newInactivityExpiresAt,
        absoluteExpiresAt: session.absoluteExpiresAt
      }
    });

    await tx.refreshToken.update({
      where: { id: existing.id },
      data: {
        usedAt: current,
        rotatedToId: newRefreshRecord.id
      }
    });

    return { updatedSession, newRefreshRecord };
  });

  const explicitPermissions = session.user.permissions.map((entry) => entry.permission.key);
  const permissions = deriveEffectivePermissions(session.user.role as UserRoleType, explicitPermissions);
  const access = await issueAccessToken({
    userId: session.userId,
    sessionId: session.id,
    role: session.user.role as UserRoleType,
    permissions,
    expiresIn: policy.accessTokenTtl
  });

  return {
    accessToken: access.token,
    accessTokenExpiresAt: access.expiresAt,
    refreshToken: newRefreshValue,
    refreshRecord: newRefreshRecord,
    session: updatedSession,
    permissions
  };
};

export const revokeSession = (sessionId: string) =>
  prisma.authSession.update({
    where: { id: sessionId },
    data: { revokedAt: now() }
  });

export const revokeAllSessionsForUser = async (userId: string) => {
  const timestamp = now();

  await prisma.$transaction([
    prisma.refreshToken.updateMany({
      where: { session: { userId } },
      data: {
        revokedAt: timestamp,
        usedAt: timestamp
      }
    }),
    prisma.authSession.updateMany({
      where: { userId },
      data: { revokedAt: timestamp }
    })
  ]);
};

export const revokeSessionByRefreshToken = async (refreshToken: string) => {
  const fingerprint = fingerprintToken(refreshToken);
  const record = await prisma.refreshToken.findUnique({
    where: { tokenFingerprint: fingerprint }
  });

  if (!record) {
    return null;
  }

  const matches = await verifyTokenHash(refreshToken, record.tokenHash);

  if (!matches) {
    return null;
  }

  const session = await prisma.authSession.findUnique({ where: { id: record.sessionId } });

  if (!session) {
    return null;
  }

  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.update({
      where: { id: record.id },
      data: {
        revokedAt: now(),
        usedAt: now()
      }
    });

    await tx.authSession.update({
      where: { id: record.sessionId },
      data: { revokedAt: now() }
    });
  });

  return session;
};
