import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { eq } from 'drizzle-orm';

import { getDb } from '@/lib/db/client';
import { user } from '@/drizzle/schema';
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

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return null;
};

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '?�못???�청 본문?�니??' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: '?�청 ?�식???�바르�? ?�습?�다.' }, { status: 400 });
  }

  const data = parsed.data;

  const db = await getDb();
  const userRecord = await db.select().from(user).where(eq(user.email, data.email)).limit(1).then(rows => rows[0] || null);

  if (!userRecord || !userRecord.passwordHash) {
    return NextResponse.json({ error: '?�이???�는 비�?번호가 ?�바르�? ?�습?�다.' }, { status: 401 });
  }

  const passwordMatches = await verifyPassword(userRecord.passwordHash, data.password);

  if (!passwordMatches) {
    return NextResponse.json({ error: '?�이???�는 비�?번호가 ?�바르�? ?�습?�다.' }, { status: 401 });
  }

  const remember = userRecord.role === 'ADMIN' ? false : data.rememberMe ?? false;
  const client: ClientKind = data.client === 'mobile' ? 'mobile' : 'web';
  const ipAddress = extractClientIp(req);
  const userAgent = req.headers.get('user-agent');

  try {
    console.log('로그???�도:', { userId: userRecord.id, role: userRecord.role, email: userRecord.email });
    
    const issued = await issueSessionWithTokens({
      userId: userRecord.id,
      role: userRecord.role as UserRoleType,
      remember,
      client,
      ipAddress,
      userAgent,
      deviceFingerprint: data.deviceFingerprint ?? null,
      deviceLabel: data.deviceLabel ?? null,
      name: userRecord.name,
      email: userRecord.email
    });
    
    console.log('?�션 ?�성 ?�공:', { sessionId: issued.session.id });

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
    console.error('로그??처리 �??�류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: userRecord?.id,
      email: userRecord?.email
    });
    return NextResponse.json({ 
      error: '로그??처리???�패?�습?�다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
