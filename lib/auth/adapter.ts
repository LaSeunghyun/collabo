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
import { users } from '@/lib/db/schema';

type DatabaseClient = Awaited<ReturnType<typeof getDbClient>>;

type UserSelect = typeof users.$inferSelect;
type UserInsert = typeof users.$inferInsert;

const toAdapterUser = (users: UserSelect): AdapterUser => ({
  id: users.id,
  name: users.name,
  email: users.email,
  emailVerified: null,
  image: users.avatarUrl ?? null
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

export const createDrizzleAuthAdapter = (database?: DatabaseClient): Adapter => {
  const databasePromise = database ? Promise.resolve(database) : getDbClient();

  const getDatabase = () => databasePromise;

  const readUserById = async (id: string) => {
    const db = await getDatabase();
    return (db as any).query.users.findFirst({
      where: eq(users.id, id)
    });
  };

  const readUserByEmail = async (email: string) => {
    const db = await getDatabase();
    return (db as any).query.users.findFirst({
      where: eq(users.email, email)
    });
  };

  const touchTimestamp = () => new Date().toISOString();

  return {
    createUser: async (usersData: Omit<AdapterUser, 'id'> & { id?: string }) => {
      const db = await getDatabase();
      const id = usersData.id ?? randomUUID();
      const email = ensureEmail(usersData.email);
      const name = usersData.name ?? email;
      const now = touchTimestamp();

      const [record] = await db
        .insert(users)
        .values({
          id,
          email,
          name,
          avatarUrl: usersData.image ?? null,
          updatedAt: now
        } satisfies UserInsert)
        .returning();

      if (!record) {
        throw new Error('사용자 레코드를 생성하지 못했습니다.');
      }

      return toAdapterUser(record);
    },
    getUser: async (id) => {
      const usersRecord = await readUserById(id);
      return usersRecord ? toAdapterUser(usersRecord) : null;
    },
    getUserByEmail: async (email) => {
      const usersRecord = await readUserByEmail(email);
      return usersRecord ? toAdapterUser(usersRecord) : null;
    },
    getUserByAccount: async () => null,
    updateUser: async (usersData: Partial<AdapterUser> & Pick<AdapterUser, 'id'>) => {
      if (!usersData.id) {
        throw new Error('사용자 업데이트에는 ID가 필요합니다.');
      }

      const existing = await readUserById(usersData.id);

      if (!existing) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const updates: Partial<UserInsert> = {
        updatedAt: touchTimestamp()
      };

      if (usersData.name !== undefined) {
        updates.name = usersData.name ?? existing.name;
      }

      if (usersData.email !== undefined) {
        updates.email = ensureEmail(usersData.email);
      }

      if (usersData.image !== undefined) {
        updates.avatarUrl = usersData.image ?? null;
      }

      const db = await getDatabase();
      const [record] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, usersData.id))
        .returning();

      if (!record) {
        throw new Error('사용자 업데이트에 실패했습니다.');
      }

      return toAdapterUser(record);
    },
    deleteUser: async (id) => {
      const existing = await readUserById(id);

      if (!existing) {
        return null;
      }

      const db = await getDatabase();
      await db.delete(users).where(eq(users.id, id)).execute();
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
    updateSession: async (session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>) => {
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
    useVerificationToken: async (params: { identifier: string; token: string }) => {
      void params;
      return unsupported('인증 토큰 사용');
    }
  } satisfies Adapter;
};

export default createDrizzleAuthAdapter;
