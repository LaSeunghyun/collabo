import { timingSafeEqual } from 'crypto';

import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';

import { DEFAULT_ROLE, type AppRole } from '@/lib/auth/constants';
import prisma from '@/lib/prisma';

type SupportedRole = AppRole;

const OAUTH_PROVIDERS = [
  {
    clientIdKey: 'GOOGLE_CLIENT_ID',
    clientSecretKey: 'GOOGLE_CLIENT_SECRET',
    label: 'Google'
  },
  {
    clientIdKey: 'KAKAO_CLIENT_ID',
    clientSecretKey: 'KAKAO_CLIENT_SECRET',
    label: 'Kakao'
  }
] as const;

const readRequiredEnv = (key: string, providerLabel: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(
      `${providerLabel} OAuth configuration is missing the required environment variable "${key}".`
    );
  }

  return value;
};

const oauthSecrets = Object.freeze(
  OAUTH_PROVIDERS.reduce(
    (acc, provider) => {
      acc[provider.clientIdKey] = readRequiredEnv(provider.clientIdKey, provider.label);
      acc[provider.clientSecretKey] = readRequiredEnv(
        provider.clientSecretKey,
        provider.label
      );
      return acc;
    },
    {} as Record<(typeof OAUTH_PROVIDERS)[number]['clientIdKey' | 'clientSecretKey'], string>
  )
);

const safeCompare = (a: string, b: string) => {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');

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
        if (!credentials?.email || typeof credentials.password !== 'string') {
          return null;
        }

        const email = credentials.email.trim();
        const password = credentials.password;

        if (!email || password.length === 0) {
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
            passwordMatches = await compare(password, user.password);
          } else {
            passwordMatches = safeCompare(user.password, password);
          }
        } catch {
          passwordMatches = false;
        }

        if (!passwordMatches) {
          return null;
        }

        const normalizedRole = (user.role ?? DEFAULT_ROLE) as SupportedRole;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: normalizedRole
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
        token.role = (user.role ?? DEFAULT_ROLE) as SupportedRole;
      }

      const shouldSyncRole = Boolean(token.email && (!token.role || trigger === 'update'));

      if (shouldSyncRole) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string }
        });

        if (dbUser) {
          token.role = (dbUser.role ?? DEFAULT_ROLE) as SupportedRole;
        }
      }

      return token;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
