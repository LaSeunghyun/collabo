import { randomUUID } from 'crypto';

import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken
} from 'next-auth/adapters';
import { eq } from 'drizzle-orm';

import { getDbClient } from '@/lib/db/client';
import { user } from '@/drizzle/schema';

type DatabaseClient = Awaited<ReturnType<typeof getDbClient>>;

type UserSelect = typeof user.$inferSelect;
type UserInsert = typeof user.$inferInsert;

const toAdapterUser = (user: UserSelect): AdapterUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  emailVerified: null,
  image: user.avatarUrl ?? null
});

const ensureEmail = (email: string | null | undefined): string => {
  if (!email) {
    throw new Error('?�메???�보가 ?�어 NextAuth ?�용???�코?��? ?�성?????�습?�다.');
  }

  return email;
};

const unsupported = (feature: string): never => {
  throw new Error(`NextAuth ${feature} 기능?� Drizzle ?�댑?�에???�직 지?�되지 ?�습?�다.`);
};

export const createDrizzleAuthAdapter = (database?: DatabaseClient): Adapter => {
  const databasePromise = database ? Promise.resolve(database) : getDbClient();

  const getDatabase = () => databasePromise;

  const readUserById = async (id: string) => {
    const db = await getDatabase();
    return (db as any).query.user.findFirst({
      where: eq(user.id, id)
    });
  };

  const readUserByEmail = async (email: string) => {
    const db = await getDatabase();
    return (db as any).query.user.findFirst({
      where: eq(user.email, email)
    });
  };

  const touchTimestamp = () => new Date().toISOString();

  return {
    createUser: async (userData: Omit<AdapterUser, 'id'> & { id?: string }) => {
      const db = await getDatabase();
      const id = userData.id ?? randomUUID();
      const email = ensureEmail(userData.email);
      const name = userData.name ?? email;
      const now = touchTimestamp();

      const [record] = await db
        .insert(user)
        .values({
          id,
          email,
          name,
          avatarUrl: userData.image ?? null,
          updatedAt: now
        } satisfies UserInsert)
        .returning();

      if (!record) {
        throw new Error('?�용???�코?��? ?�성?��? 못했?�니??');
      }

      return toAdapterUser(record);
    },
    getUser: async (id) => {
      const userRecord = await readUserById(id);
      return userRecord ? toAdapterUser(userRecord) : null;
    },
    getUserByEmail: async (email) => {
      const userRecord = await readUserByEmail(email);
      return userRecord ? toAdapterUser(userRecord) : null;
    },
    getUserByAccount: async () => null,
    updateUser: async (userData: Partial<AdapterUser> & Pick<AdapterUser, 'id'>) => {
      if (!userData.id) {
        throw new Error('?�용???�데?�트?�는 ID가 ?�요?�니??');
      }

      const existing = await readUserById(userData.id);

      if (!existing) {
        throw new Error('?�용?��? 찾을 ???�습?�다.');
      }

      const updates: Partial<UserInsert> = {
        updatedAt: touchTimestamp()
      };

      if (userData.name !== undefined) {
        updates.name = userData.name ?? existing.name;
      }

      if (userData.email !== undefined) {
        updates.email = ensureEmail(userData.email);
      }

      if (userData.image !== undefined) {
        updates.avatarUrl = userData.image ?? null;
      }

      const db = await getDatabase();
      const [record] = await db
        .update(user)
        .set(updates)
        .where(eq(user.id, userData.id))
        .returning();

      if (!record) {
        throw new Error('?�용???�데?�트???�패?�습?�다.');
      }

      return toAdapterUser(record);
    },
    deleteUser: async (id) => {
      const existing = await readUserById(id);

      if (!existing) {
        return null;
      }

      const db = await getDatabase();
      await db.delete(user).where(eq(user.id, id)).execute();
      return toAdapterUser(existing);
    },
    linkAccount: async (account: AdapterAccount) => {
      void account;
      return unsupported('OAuth 계정 ?�동');
    },
    unlinkAccount: async (account: AdapterAccount) => {
      void account;
      return unsupported('OAuth 계정 ?�제');
    },
    createSession: async (session: AdapterSession) => {
      void session;
      return unsupported('?�션 ?�??);
    },
    getSessionAndUser: async (sessionToken: string) => {
      void sessionToken;
      return unsupported('?�션 조회');
    },
    updateSession: async (session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>) => {
      void session;
      return unsupported('?�션 갱신');
    },
    deleteSession: async (sessionToken: string) => {
      void sessionToken;
      return unsupported('?�션 ??��');
    },
    createVerificationToken: async (token: VerificationToken) => {
      void token;
      return unsupported('?�증 ?�큰 ?�성');
    },
    useVerificationToken: async (params: { identifier: string; token: string }) => {
      void params;
      return unsupported('?�증 ?�큰 ?�용');
    }
  } satisfies Adapter;
};

export default createDrizzleAuthAdapter;
