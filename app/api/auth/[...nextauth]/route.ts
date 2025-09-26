import { timingSafeEqual } from 'crypto';

import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';

import prisma from '@/lib/prisma';

const DEFAULT_ROLE = 'fan' as const;

type SupportedRole = typeof DEFAULT_ROLE | string;

const requiredOAuthEnvVars = [
  { key: 'GOOGLE_CLIENT_ID', provider: 'Google' },
  { key: 'GOOGLE_CLIENT_SECRET', provider: 'Google' },
  { key: 'KAKAO_CLIENT_ID', provider: 'Kakao' },
  { key: 'KAKAO_CLIENT_SECRET', provider: 'Kakao' }
] as const;

const readRequiredEnv = (key: string, provider: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(
      `${provider} OAuth configuration is missing the required environment variable "${key}".`
    );
  }

  return value;
};

const oauthSecrets = requiredOAuthEnvVars.reduce(
  (acc, { key, provider }) => ({
    ...acc,
    [key]: readRequiredEnv(key, provider)
  }),
  {} as Record<(typeof requiredOAuthEnvVars)[number]['key'], string>
);

const safeCompare = (a: string, b: string) => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
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

        const email = credentials.email.trim();

        if (!email || !credentials.password.trim()) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email
          },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true
          }
        });

        if (!user || !user.password) {
          return null;
        }

        let passwordMatches = false;

        try {
          if (user.password.startsWith('$2')) {
            passwordMatches = await compare(credentials.password, user.password);
          } else {
            passwordMatches = safeCompare(user.password, credentials.password);
          }
        } catch {
          passwordMatches = false;
        }

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: (user.role ?? DEFAULT_ROLE) as SupportedRole
        };
      }
    }),
    GoogleProvider({
      clientId: oauthSecrets.GOOGLE_CLIENT_ID,
      clientSecret: oauthSecrets.GOOGLE_CLIENT_SECRET
    }),
    KakaoProvider({
      clientId: oauthSecrets.KAKAO_CLIENT_ID,
      clientSecret: oauthSecrets.KAKAO_CLIENT_SECRET
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub;
        }
        const resolvedRole =
          (token.role as SupportedRole | undefined) ??
          (session.user.role as SupportedRole | undefined) ??
          DEFAULT_ROLE;

        session.user.role = resolvedRole;
      }

      return session;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
      }

      const shouldSyncRole = Boolean(token.email && (!token.role || trigger === 'update'));

      if (shouldSyncRole) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string }
        });

        if (dbUser) {
          token.role = dbUser.role;
        }
      }

      return token;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
