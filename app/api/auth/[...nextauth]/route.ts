import { timingSafeEqual } from 'crypto';

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { UserRole } from '@prisma/client';

import prisma from '@/lib/prisma';

const requiredOAuthEnvVars = [
  { key: 'GOOGLE_CLIENT_ID', provider: 'Google' },
  { key: 'GOOGLE_CLIENT_SECRET', provider: 'Google' },
  { key: 'KAKAO_CLIENT_ID', provider: 'Kakao' },
  { key: 'KAKAO_CLIENT_SECRET', provider: 'Kakao' }
];

for (const { key, provider } of requiredOAuthEnvVars) {
  if (!process.env[key]) {
    throw new Error(
      `${provider} OAuth configuration is missing the required environment variable "${key}".`
    );
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

const handler = NextAuth({
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
          role: user.role,
          permissions: user.permissions || []
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
    async session({ session, token }) {
      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub;
        }
        session.user.role = (token.role as string) ?? session.user.role ?? UserRole.PARTICIPANT;
        session.user.permissions = (token.permissions as string[]) ?? session.user.permissions ?? [];
      }

      return session;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.permissions = user.permissions;
      }

      const shouldSyncRole = Boolean(token.email && (!token.role || trigger === 'update'));

      if (shouldSyncRole) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string }
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.permissions = dbUser.permissions || [];
        }
      }

      return token;
    }
  }
});

export { handler as GET, handler as POST };
