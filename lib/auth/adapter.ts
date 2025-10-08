import { randomUUID } from 'crypto';

import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken
} from 'next-auth/adapters';
import { eq } from 'drizzle-orm';

import { getDb } from '@/lib/db/client';
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
    throw new Error('이메일 정보가 없어 NextAuth 사용자 레코드를 생성할 수 없습니다.');
  }

  return email;
};

const unsupported = (feature: string): never => {
  throw new Error(`NextAuth ${feature} 기능은 Drizzle 어댑터에서 아직 지원되지 않습니다.`);
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
        throw new Error('사용자 레코드를 생성하지 못했습니다.');
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
        throw new Error('사용자 업데이트에는 ID가 필요합니다.');
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
      return unsupported('OAuth 계정 연동');
    },
    unlinkAccount: async (account: AdapterAccount) => {
      void account;
      return unsupported('OAuth 계정 해제');
    },
    createSession: async (session: AdapterSession) => {
      void session;
      return unsupported('세션 저장');
    },
    getSessionAndUser: async (sessionToken: string) => {
      void sessionToken;
      return unsupported('세션 조회');
    },
    updateSession: async (session: AdapterSession) => {
      void session;
      return unsupported('세션 갱신');
    },
    deleteSession: async (sessionToken: string) => {
      void sessionToken;
      return unsupported('세션 삭제');
    },
    createVerificationToken: async (token: VerificationToken) => {
      void token;
      return unsupported('인증 토큰 생성');
    },
    useVerificationToken: async (params: VerificationToken) => {
      void params;
      return unsupported('인증 토큰 사용');
    }
  } satisfies Adapter;
};

export default createDrizzleAuthAdapter;
