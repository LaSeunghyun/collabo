import { randomUUID } from 'crypto';

import { eq } from 'drizzle-orm';

import { getDb } from '@/lib/db/client';
import { permissions, userPermissions, users } from '@/lib/db/schema';
import { UserRole } from '@/types/prisma';

type UserRecord = typeof users.$inferSelect;
type UserPermissionRecord = typeof userPermissions.$inferSelect;
type PermissionRecord = typeof permissions.$inferSelect;
type UserInsert = typeof users.$inferInsert;

export type UserWithPermissions = UserRecord & {
  permissions: Array<UserPermissionRecord & { permission: PermissionRecord }>;
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

  const user = await db.query.users.findFirst({
    where,
    with: {
      permissions: {
        with: {
          permission: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  const permissionsWithDetails = user.permissions
    .filter((entry): entry is UserPermissionRecord & { permission: PermissionRecord } =>
      Boolean(entry.permission)
    )
    .map((entry) => ({
      ...entry,
      permission: entry.permission
    }));

  return {
    ...user,
    permissions: permissionsWithDetails
  };
};

export const findUserByEmail = async (email: string) =>
  db.query.users.findFirst({
    where: eq(users.email, email)
  });

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

  const [record] = await db
    .insert(users)
    .values({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: UserRole.PARTICIPANT,
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
    throw new Error('사용자 생성에 실패했습니다.');
  }

  return record;
};
