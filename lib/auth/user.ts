import { randomUUID } from 'crypto';

import { eq } from 'drizzle-orm';

import { getDb } from '@/lib/db/client';
import { permissions, userPermissions, users } from '@/lib/db/schema';

type UserRecord = typeof users.$inferSelect;
type UserPermissionRecord = typeof userPermissions.$inferSelect;
type PermissionRecord = typeof permissions.$inferSelect;
type UserInsert = typeof users.$inferInsert;

export type UserWithPermissions = UserRecord & {
  permission: Array<UserPermissionRecord & { permission: PermissionRecord }>;
};

export type BasicUserSummary = Pick<UserRecord, 'id' | 'name' | 'email' | 'role' | 'createdAt'>;

export type UserIdentifier = { id?: string; email?: string };

export const fetchUserWithPermissions = async (
  identifier: UserIdentifier
): Promise<UserWithPermissions | null> => {
  const where = identifier.id
    ? eq(users.id, identifier.id)
    : identifier.email
      ? eq(users.email, identifier.email)
      : null;

  if (!where) {
    return null;
  }

  const db = await getDb();

  try {
    const user = await (db as any).query.users.findFirst({
      where,
      with: {
        permission: {
          with: {
            permission: true
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    const permissionWithDetails = (user.permission as any[])
      .filter((entry): entry is UserPermissionRecord & { permission: PermissionRecord } =>
        Boolean(entry.permission)
      )
      .map((entry) => ({
        ...entry,
        permission: entry.permission
      }));

    return {
      ...user,
      permission: permissionWithDetails
    };
  } catch (error) {
    // 관계 쿼리 실패 시 기본 사용자 정보만 반환
    // Failed to fetch user with permissions, falling back to basic query - removed console.warn for production

    const basicUser = await (db as any).query.users.findFirst({
      where
    });

    if (!basicUser) {
      return null;
    }

    return {
      ...basicUser,
      permission: []
    };
  }
};

export const findUserByEmail = async (email: string) => {
  const db = await getDb();
  return (db as any).query.users.findFirst({
    where: eq(users.email, email)
  });
};

interface CreateParticipantUserInput {
  name: string;
  email: string;
  passwordHash: string;
}

const touchTimestamp = () => new Date().toISOString();

export const createParticipantUser = async (
  input: CreateParticipantUserInput
): Promise<BasicUserSummary> => {
  const now = touchTimestamp();
  const db = await getDb();

  const [record] = await db
    .insert(users)
    .values({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: 'PARTICIPANT',
      updatedAt: now
    } satisfies UserInsert)
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt
    });

  if (!record) {
    throw new Error('Failed to create user account.');
  }

  return record;
};
