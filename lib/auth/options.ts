import { timingSafeEqual } from 'crypto';

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import { compare } from 'bcryptjs';
import { AUTH_V3_ENABLED } from './flags';
import { deriveEffectivePermissions } from './permissions';
import { db } from '@/lib/drizzle';
import { users, userPermissions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

const fetchUserWithPermissions = async (identifier: { id?: string; email?: string }) => {
  if (!identifier.id && !identifier.email) {
    return null;
  }

  // Skip database queries during build time
  if (isBuildTime) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(identifier.id ? eq(users.id, identifier.id) : eq(users.email, identifier.email!))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  // Get user permissions
  const permissions = await db
    .select({
      permission: userPermissions.permission,
      resourceType: userPermissions.resourceType,
      resourceId: userPermissions.resourceId,
    })
    .from(userPermissions)
    .where(eq(userPermissions.userId, user[0].id));

  return {
    ...user[0],
    permissions: permissions.map(p => ({
      permission: p.permission,
      resourceType: p.resourceType,
      resourceId: p.resourceId,
    }))
  };
};

export const authOptions: NextAuthOptions = {
  // adapter: isBuildTime ? undefined : PrismaAdapter(prisma), // Removed PrismaAdapter
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

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (user.length === 0 || !user[0].passwordHash) {
          return null;
        }

        const userData = user[0];

        let passwordMatches = false;
        if (userData.passwordHash && userData.passwordHash.startsWith('$2')) {
          passwordMatches = await compare(credentials.password, userData.passwordHash);
        } else if (userData.passwordHash) {
          passwordMatches = safeCompare(userData.passwordHash, credentials.password);
        }

        if (!passwordMatches) {
          return null;
        }

        return {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role as any
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

        if (AUTH_V3_ENABLED) {
          const dbUser = await fetchUserWithPermissions(identifier);

          if (dbUser) {
            resolvedRole = dbUser.role;
            explicitPermissions = dbUser.permissions.map(
              (entry: { permission: string }) => entry.permission
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
