import { randomUUID } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { tokenBlacklist } from '@/drizzle/schema';
import { userRole } from '@/drizzle/schema';

export interface AccessTokenContext {
  userId: string;
  sessionId: string;
  role: typeof userRole.enumValues[number];
  permissions: string[];
  expiresIn: number;
  name?: string;
  email?: string;
}

export interface AccessTokenResult {
  token: string;
  jti: string;
  expiresAt: Date;
}

export interface VerifiedAccessToken {
  userId: string;
  sessionId: string;
  role: typeof userRole.enumValues[number];
  permissions: string[];
  jti: string;
  expiresAt: Date;
  name?: string;
  email?: string;
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
  expiresIn,
  name,
  email
}: AccessTokenContext): Promise<AccessTokenResult> => {
  const jti = randomUUID();
  const expirationSeconds = Math.floor(Date.now() / 1000) + expiresIn;
  const token = await new SignJWT({
    sid: sessionId,
    role,
    permissions,
    name,
    email
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
    throw new Error('잘못된 형식의 토큰입니다.');
  }

  const db = await getDb();
  const blacklisted = await db.select().from(tokenBlacklist).where(eq(tokenBlacklist.jti, payload.jti)).limit(1).then(rows => rows[0] || null);

  if (blacklisted) {
    throw new Error('만료되었거나 무효한 토큰입니다.');
  }

  const permissions = Array.isArray(payload.permissions)
    ? (payload.permissions as string[])
    : [];

  const expirationSeconds = typeof payload.exp === 'number' ? payload.exp : undefined;

  return {
    userId: payload.sub,
    sessionId: payload.sid,
    role: payload.role as typeof userRole.enumValues[number],
    permissions,
    jti: payload.jti,
    expiresAt: expirationSeconds ? new Date(expirationSeconds * 1000) : new Date(),
    name: typeof payload.name === 'string' ? payload.name : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined
  };
};