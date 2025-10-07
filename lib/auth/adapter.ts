import { randomUUID } from 'crypto';

import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken
} from 'next-auth/adapters';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';

type DatabaseClient = typeof db;

type UserSelect = typeof users.$inferSelect;
type UserInsert = typeof users.$inferInsert;

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

export const createDrizzleAuthAdapter = (database: DatabaseClient = db): Adapter => {
  const readUserById = async (id: string) =>
    database.query.users.findFirst({
      where: eq(users.id, id)
    });

  const readUserByEmail = async (email: string) =>
    database.query.users.findFirst({
      where: eq(users.email, email)
    });

  const touchTimestamp = () => new Date().toISOString();

  return {
    createUser: async (user) => {
      const id = user.id ?? randomUUID();
      const email = ensureEmail(user.email);
      const name = user.name ?? email;
      const now = touchTimestamp();

      const [record] = await database
        .insert(users)
        .values({
          id,
          email,
          name,
          avatarUrl: user.image ?? null,
          updatedAt: now
        } satisfies UserInsert)
        .returning();

      if (!record) {
        throw new Error('?�용???�코?��? ?�성?��? 못했?�니??');
      }

      return toAdapterUser(record);
    },
    getUser: async (id) => {
      const user = await readUserById(id);
      return user ? toAdapterUser(user) : null;
    },
    getUserByEmail: async (email) => {
      const user = await readUserByEmail(email);
      return user ? toAdapterUser(user) : null;
    },
    getUserByAccount: async () => null,
    updateUser: async (user) => {
      if (!user.id) {
        throw new Error('?�용???�데?�트?�는 ID가 ?�요?�니??');
      }

      const existing = await readUserById(user.id);

      if (!existing) {
        return null;
      }

      const updates: Partial<UserInsert> = {
        updatedAt: touchTimestamp()
      };

      if (user.name !== undefined) {
        updates.name = user.name ?? existing.name;
      }

      if (user.email !== undefined) {
        updates.email = ensureEmail(user.email);
      }

      if (user.image !== undefined) {
        updates.avatarUrl = user.image ?? null;
      }

      const [record] = await database
        .update(users)
        .set(updates)
        .where(eq(users.id, user.id))
        .returning();

      return record ? toAdapterUser(record) : null;
    },
    deleteUser: async (id) => {
      const existing = await readUserById(id);

      if (!existing) {
        return null;
      }

      await database.delete(users).where(eq(users.id, id)).execute();
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
    updateSession: async (session: AdapterSession) => {
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
    useVerificationToken: async (params: VerificationToken) => {
      void params;
      return unsupported('?�증 ?�큰 ?�용');
    }
  } satisfies Adapter;
};

export default createDrizzleAuthAdapter;
