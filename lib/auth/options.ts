import { timingSafeEqual } from 'crypto';

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import { compare } from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { getDbClient } from '@/lib/db/client';
import { user } from '@/drizzle/schema';

import { AUTH_V3_ENABLED } from './flags';
import { deriveEffectivePermissions } from './permissions';
import { createDrizzleAuthAdapter } from './adapter';
import { fetchUserWithPermissions } from './user';

// Skip OAuth validation during build time
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

// OAuth validation is now optional - providers are only added if env vars are present

const safeCompare = (a: string, b: string) => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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
          return null;
        }

        // Skip database queries during build time
        if (isBuildTime) {
          return null;
        }

        const db = await getDbClient();
        const userRecord = await (db as any).query.user.findFirst({
          where: eq(user.email, credentials.email)
        });

        if (!userRecord || !userRecord.passwordHash) {
          return null;
        }

        let passwordMatches = false;
        if (userRecord.passwordHash.startsWith('$2')) {
          passwordMatches = await compare(credentials.password, userRecord.passwordHash);
        } else {
          passwordMatches = safeCompare(userRecord.passwordHash, credentials.password);
        }

        if (!passwordMatches) {
          return null;
        }

        return {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          role: userRecord.role as any
        };
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
      const identifier = {
        id: (user as { id?: string })?.id ?? (token.sub as string | undefined),
        email: (user?.email as string | undefined) ?? (token.email as string | undefined)
      };

      if (user && 'role' in user && user.role) {
        token.role = user.role;
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
      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub;
        }

        if (typeof token.role === 'string') {
          (session.user as any).role = token.role;
        }

        session.user.permissions = Array.isArray(token.permissions)
          ? (token.permissions as string[])
          : [];
      }

      return session;
    }
  }
};
