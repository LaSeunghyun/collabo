import { timingSafeEqual } from 'crypto';

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import { compare } from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { getDbClient } from '@/lib/db/client';
import { users } from '@/lib/db/schema';

import { AUTH_V3_ENABLED } from './flags';
import { deriveEffectivePermissions } from './permissions';
import { createDrizzleAuthAdapter } from './adapter';
import { fetchUserWithPermissions } from './user';
import { logUserLogin } from '@/lib/server/activity-logger';
import { validateAuthEnvDev } from './env-validation';

// Skip OAuth validation during build time
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

// OAuth validation is now optional - providers are only added if env vars are present

// 환경 변수 검증 (개발 환경에서만)
validateAuthEnvDev();

const safeCompare = (a: string, b: string) => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
};

export const authOptions: NextAuthOptions = {
  adapter: isBuildTime ? undefined : createDrizzleAuthAdapter(),
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt'
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ [NEXTAUTH] 인증 실패: 이메일 또는 비밀번호 누락');
          return null;
        }

        // Skip database queries during build time
        if (isBuildTime) {
          return null;
        }

        try {
          const db = await getDbClient();
          const [usersRecord] = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1);

          if (!usersRecord || !usersRecord.passwordHash) {
            console.log('❌ [NEXTAUTH] 인증 실패: 사용자를 찾을 수 없음', { email: credentials.email });
            return null;
          }

          let passwordMatches = false;
          if (usersRecord.passwordHash.startsWith('$2')) {
            passwordMatches = await compare(credentials.password, usersRecord.passwordHash);
          } else {
            passwordMatches = safeCompare(usersRecord.passwordHash, credentials.password);
          }

          if (!passwordMatches) {
            console.log('❌ [NEXTAUTH] 인증 실패: 비밀번호 불일치', { email: credentials.email });
            return null;
          }

          console.log('✅ [NEXTAUTH] 인증 성공:', { id: usersRecord.id, email: usersRecord.email, role: usersRecord.role });

          // 로그인 활동 로깅 (비동기로 처리하여 응답 지연 방지)
          setImmediate(async () => {
            try {
              await logUserLogin(
                usersRecord.id,
                usersRecord.email,
                usersRecord.name || 'Unknown User',
                usersRecord.role as string,
                {
                  ipAddress: null, // NextAuth에서는 IP 주소를 직접 접근할 수 없음
                  userAgent: null, // NextAuth에서는 User-Agent를 직접 접근할 수 없음
                  path: '/api/auth/signin',
                  method: 'POST',
                  statusCode: 200,
                  metadata: {
                    loginMethod: 'credentials'
                  }
                }
              );
            } catch (error) {
              console.warn('Failed to log login activity:', error);
            }
          });

          return {
            id: usersRecord.id,
            name: usersRecord.name,
            email: usersRecord.email,
            role: usersRecord.role as any
          };
        } catch (error) {
          console.error('❌ [NEXTAUTH] 인증 중 오류:', error);
          return null;
        }
      }
    }),
    // OAuth providers are optional - only add if environment variables are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      })
    ] : []),
    ...(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET ? [
      KakaoProvider({
        clientId: process.env.KAKAO_CLIENT_ID,
        clientSecret: process.env.KAKAO_CLIENT_SECRET
      })
    ] : [])
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // 🔥 중요: 사용자 ID를 토큰에 명시적으로 설정
      if (user?.id) {
        token.sub = user.id;
        token.id = user.id; // 추가 안전장치
        console.log('🔑 [JWT] 사용자 ID 토큰에 설정:', { userId: user.id, tokenSub: token.sub });
      }

      const identifier = {
        id: (user as { id?: string })?.id ?? (token.sub as string | undefined),
        email: (user?.email as string | undefined) ?? (token.email as string | undefined)
      };

      if (user && 'role' in user && user.role) {
        token.role = user.role;
        console.log('🔑 [JWT] 사용자 역할 토큰에 설정:', { role: user.role });
      }

      const shouldRefresh =
        Boolean(user) ||
        !token.role ||
        !token.permissions ||
        trigger === 'update';

      if (shouldRefresh) {
        const existingPermissions = Array.isArray(token.permissions)
          ? (token.permissions as string[])
          : [];

        let resolvedRole =
          (typeof token.role === 'string' && token.role) ||
          ((user as { role?: string })?.role ?? undefined);
        let explicitPermissions = existingPermissions;

        if (AUTH_V3_ENABLED && !isBuildTime) {
          const dbUser = await fetchUserWithPermissions(identifier);

          if (dbUser) {
            resolvedRole = dbUser.role;
            explicitPermissions = dbUser.permission.map(
              (entry: { permission: { key: string } }) => entry.permission.key
            );
          }
        }

        token.role = resolvedRole;
        token.permissions = deriveEffectivePermissions(resolvedRole, explicitPermissions);
      }

      if (!Array.isArray(token.permissions)) {
        token.permissions = deriveEffectivePermissions(token.role as string, []);
      }

      return token;
    },
    async session({ session, token }) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [SESSION] 세션 콜백 시작:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          tokenSub: token.sub,
          tokenRole: token.role,
          tokenId: token.id
        });
      }

      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub;
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ [SESSION] 사용자 ID 설정:', { userId: token.sub });
          }
        }

        if (typeof token.role === 'string') {
          (session.user as any).role = token.role;
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ [SESSION] 사용자 역할 설정:', { role: token.role });
          }
        }

        (session.user as any).permissions = Array.isArray(token.permissions)
          ? (token.permissions as string[])
          : [];

        if (process.env.NODE_ENV === 'development') {
          console.log('📋 [SESSION] 최종 세션 사용자:', {
            id: session.user.id,
            email: session.user.email,
            role: (session.user as any).role,
            permissionsCount: ((session.user as any).permissions || []).length
          });
        }
      }

      return session;
    }
  }
};
