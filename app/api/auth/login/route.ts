import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { eq } from 'drizzle-orm';

import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { buildRefreshCookie } from '@/lib/auth/cookies';
import type { ClientKind } from '@/lib/auth/policy';
import { issueSessionWithTokens } from '@/lib/auth/session-store';
import { verifyPassword } from '@/lib/auth/password';

type UserRoleType = 'CREATOR' | 'PARTICIPANT' | 'PARTNER' | 'ADMIN';

const requestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
  client: z.enum(['web', 'mobile']).optional(),
  deviceFingerprint: z.string().min(8).max(256).optional(),
  deviceLabel: z.string().max(120).optional()
});

const extractClientIp = (req: NextRequest) => {
  const forwarded = req.headers.get('x-forwarded-for');

  if (forwarded) {
    const [first] = forwarded.split(',');
    if (first) {
      return first.trim();
    }
  }

  return req.headers.get('x-real-ip') || '127.0.0.1';
};

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 본문입니다.' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  const { email, password, rememberMe, client = 'web', deviceFingerprint, deviceLabel } = parsed.data;

  const db = await getDb();
  const [userRecord] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!userRecord || !userRecord.passwordHash) {
    return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  const passwordMatches = await verifyPassword(password, userRecord.passwordHash);

  if (!passwordMatches) {
    return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  const ipAddress = extractClientIp(req);
  const userAgent = req.headers.get('user-agent');

  try {
    console.log('로그인 시도:', { userId: userRecord.id, role: userRecord.role, email: userRecord.email });
    
    const issued = await issueSessionWithTokens({
      userId: userRecord.id,
      role: userRecord.role as UserRoleType,
      remember: rememberMe ?? false,
      client: client as ClientKind,
      ipAddress,
      userAgent,
      deviceFingerprint: deviceFingerprint ?? null,
      deviceLabel: deviceLabel ?? null,
      name: userRecord.name,
      email: userRecord.email
    });
    
    console.log('세션 생성 성공:', { sessionId: issued.session.id });

    const refreshMaxAge = Math.max(
      0,
      Math.floor(
        (issued.refreshRecord.inactivityExpiresAt.getTime() - Date.now()) / 1000
      )
    );

    return NextResponse.json(
      {
        accessToken: issued.accessToken,
        accessTokenExpiresAt: issued.accessTokenExpiresAt.toISOString(),
        refreshTokenExpiresAt: issued.refreshRecord.inactivityExpiresAt.toISOString(),
        session: {
          id: issued.session.id,
          absoluteExpiresAt: issued.session.absoluteExpiresAt.toISOString(),
          lastUsedAt: issued.session.lastUsedAt.toISOString(),
          remember: issued.session.remember,
          client: issued.session.client
        },
        user: {
          id: userRecord.id,
          role: userRecord.role
        }
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': buildRefreshCookie(issued.refreshToken, refreshMaxAge)
        }
      }
    );
  } catch (error) {
    console.error('로그인 처리 중 오류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: userRecord.id
    });
    return NextResponse.json({ 
      error: '로그인 처리에 실패했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}