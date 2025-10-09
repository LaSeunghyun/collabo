import type { Adapter, AdapterAccount, AdapterSession, AdapterUser } from 'next-auth/adapters';
import { getDb } from '@/lib/db/client';
import { users, authSessions, authDevices } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

// const unsupported = (operation: string) => {
//   throw new Error(`Operation "${operation}" is not supported by this adapter`);
// };

export const drizzleAdapter: Adapter = {
  createUser: async (user: Omit<AdapterUser, 'id'>) => {
    const db = await getDb();
    const [created] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        name: user.name || '',
        email: user.email,
        avatarUrl: user.image,
        role: 'CREATOR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    return {
      id: created.id,
      name: created.name,
      email: created.email,
      emailVerified: null,
      image: created.avatarUrl
    };
  },
  getUser: async (id: string) => {
    const db = await getDb();
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: null,
      image: user.avatarUrl
    };
  },
  getUserByEmail: async (email: string) => {
    const db = await getDb();
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: null,
      image: user.avatarUrl
    };
  },
  getUserByAccount: async (account: { provider: string; providerAccountId: string }) => {
    const db = await getDb();
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl
      })
      .from(users)
      .innerJoin(authDevices, eq(users.id, authDevices.userId))
      .where(
        and(
          eq(authDevices.deviceName, account.provider),
          eq(authDevices.userId, users.id)
        )
      )
      .limit(1);

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: null,
      image: user.avatarUrl
    };
  },
  updateUser: async (user: Partial<AdapterUser> & Pick<AdapterUser, 'id'>) => {
    const db = await getDb();
    const [updated] = await db
      .update(users)
      .set({
        name: user.name || '',
        email: user.email,
        avatarUrl: user.image,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, user.id))
      .returning();

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      emailVerified: null,
      image: updated.avatarUrl
    };
  },
  deleteUser: async (userId: string) => {
    const db = await getDb();
    await db.delete(users).where(eq(users.id, userId));
  },
  linkAccount: async (account: AdapterAccount) => {
    const db = await getDb();
    if (!account.userId) return;
    
    await db.insert(authDevices).values({
      id: crypto.randomUUID(),
      userId: account.userId,
      deviceName: account.provider,
      deviceType: account.type,
      client: 'web',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },
  unlinkAccount: async (account: AdapterAccount) => {
    const db = await getDb();
    await db
      .delete(authDevices)
      .where(
        and(
          eq(authDevices.deviceName, account.provider),
          eq(authDevices.userId, account.userId)
        )
      );
  },
  createSession: async (session: AdapterSession) => {
    const db = await getDb();
    const [created] = await db
      .insert(authSessions)
      .values({
        id: session.sessionToken,
        userId: session.userId,
        absoluteExpiresAt: session.expires.toISOString(),
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString()
      })
      .returning();

    return {
      sessionToken: created.id,
      userId: created.userId,
      expires: new Date(created.absoluteExpiresAt)
    };
  },
  getSessionAndUser: async (sessionToken: string) => {
    const db = await getDb();
    const [result] = await db
      .select({
        session: {
          sessionToken: authSessions.id,
          userId: authSessions.userId,
          expires: authSessions.absoluteExpiresAt
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl
        }
      })
      .from(authSessions)
      .innerJoin(users, eq(authSessions.userId, users.id))
      .where(eq(authSessions.id, sessionToken))
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      session: {
        sessionToken: result.session.sessionToken,
        userId: result.session.userId,
        expires: new Date(result.session.expires)
      },
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        emailVerified: null,
        image: result.user.avatarUrl
      }
    };
  },
  updateSession: async (session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>) => {
    const db = await getDb();
    const [updated] = await db
      .update(authSessions)
      .set({
        userId: session.userId,
        absoluteExpiresAt: session.expires?.toISOString(),
        lastUsedAt: new Date().toISOString()
      })
      .where(eq(authSessions.id, session.sessionToken))
      .returning();

    return {
      sessionToken: updated.id,
      userId: updated.userId,
      expires: new Date(updated.absoluteExpiresAt)
    };
  },
  deleteSession: async (sessionToken: string) => {
    const db = await getDb();
    await db.delete(authSessions).where(eq(authSessions.id, sessionToken));
  }
};

export const createDrizzleAuthAdapter = () => drizzleAdapter;