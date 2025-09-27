import { timingSafeEqual } from 'crypto';

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';

import { prisma } from '@/lib/prisma';

import { AUTH_V3_ENABLED } from './flags';
import { deriveEffectivePermissions } from './permissions';

// Skip OAuth validation during build time
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

if (!isBuildTime) {
  const requiredOAuthEnvVars = [
    { key: 'GOOGLE_CLIENT_ID', provider: 'Google' },
    { key: 'GOOGLE_CLIENT_SECRET', provider: 'Google' },
    { key: 'KAKAO_CLIENT_ID', provider: 'Kakao' },
    { key: 'KAKAO_CLIENT_SECRET', provider: 'Kakao' }
  ];

  // Only validate OAuth env vars in production or when explicitly enabled
  if (process.env.NODE_ENV === 'production' || process.env.VALIDATE_OAUTH === 'true') {
    for (const { key, provider } of requiredOAuthEnvVars) {
      if (!process.env[key]) {
        throw new Error(
          `${provider} OAuth configuration is missing the required environment variable "${key}".`
        );
      }
    }
  }
}

const safeCompare = (a: string, b: string) => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
};

const fetchUserWithPermissions = async (identifier: { id?: string; email?: string }) => {
  if (!identifier.id && !identifier.email) {
    return null;
  }

  return prisma.user.findUnique({
    where: identifier.id ? { id: identifier.id } : { email: identifier.email! },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  });
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        let passwordMatches = false;
        if (user.passwordHash.startsWith('$2')) {
          passwordMatches = await compare(credentials.password, user.passwordHash);
        } else {
          passwordMatches = safeCompare(user.passwordHash, credentials.password);
        }

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as any
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!
    })
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

      if (AUTH_V3_ENABLED && shouldRefresh) {
        const dbUser = await fetchUserWithPermissions(identifier);

        if (dbUser) {
          token.role = dbUser.role;
          token.permissions = deriveEffectivePermissions(
            dbUser.role,
            dbUser.permissions.map((entry: { permission: { key: string } }) => entry.permission.key)
          );
        } else if (!token.permissions) {
          token.permissions = [];
        }
      } else if (!token.permissions) {
        token.permissions = [];
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
