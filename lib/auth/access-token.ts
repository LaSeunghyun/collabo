import { randomUUID } from 'crypto';

import { SignJWT, jwtVerify } from 'jose';

import { prisma } from '@/lib/prisma';
import type { UserRoleType } from '@/types/auth';

export interface AccessTokenContext {
  userId: string;
  sessionId: string;
  role: UserRoleType;
  permissions: string[];
  expiresIn: number;
}

export interface AccessTokenResult {
  token: string;
  jti: string;
  expiresAt: Date;
}

export interface VerifiedAccessToken {
  userId: string;
  sessionId: string;
  role: UserRoleType;
  permissions: string[];
  jti: string;
  expiresAt: Date;
}

const ISSUER = 'collaborium.auth';

const getSecret = () => {
  const secret = process.env.AUTH_JWT_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error('JWT secret is not configured');
  }

  return new TextEncoder().encode(secret);
};

export const issueAccessToken = async ({
  userId,
  sessionId,
  role,
  permissions,
  expiresIn
}: AccessTokenContext): Promise<AccessTokenResult> => {
  const jti = randomUUID();
  const expirationSeconds = Math.floor(Date.now() / 1000) + expiresIn;
  const token = await new SignJWT({
    sid: sessionId,
    role,
    permissions
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(ISSUER)
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(expirationSeconds)
    .sign(getSecret());

  return {
    token,
    jti,
    expiresAt: new Date(expirationSeconds * 1000)
  };
};

export const verifyAccessToken = async (token: string): Promise<VerifiedAccessToken> => {
  const { payload } = await jwtVerify(token, getSecret(), { issuer: ISSUER });

  if (!payload.sub || typeof payload.sid !== 'string' || typeof payload.jti !== 'string') {
    throw new Error('?òÎ™ª???°ÏÑ∏???†ÌÅ∞?ÖÎãà??');
  }

  const blacklisted = await prisma.tokenBlacklist.findUnique({
    where: { jti: payload.jti }
  });

  if (blacklisted) {
    throw new Error('ÎßåÎ£å?òÍ±∞???êÍ∏∞???†ÌÅ∞?ÖÎãà??');
  }

  const permissions = Array.isArray(payload.permissions)
    ? (payload.permissions as string[])
    : [];

  const expirationSeconds = typeof payload.exp === 'number' ? payload.exp : undefined;

  return {
    userId: payload.sub,
    sessionId: payload.sid,
    role: payload.role as UserRoleType,
    permissions,
    jti: payload.jti,
    expiresAt: expirationSeconds ? new Date(expirationSeconds * 1000) : new Date()
  };
};
