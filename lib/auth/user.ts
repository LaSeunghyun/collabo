import { randomUUID } from 'crypto';

import { eq } from 'drizzle-orm';

import { getDb } from '@/lib/db/client';
import { permission, userPermission, user } from '@/drizzle/schema';

type UserRecord = typeof user.$inferSelect;
type UserPermissionRecord = typeof userPermission.$inferSelect;
type PermissionRecord = typeof permission.$inferSelect;
type UserInsert = typeof user.$inferInsert;

export type UserWithPermissions = UserRecord & {
  permission: Array<UserPermissionRecord & { permission: PermissionRecord }>;
};

export type BasicUserSummary = Pick<UserRecord, 'id' | 'name' | 'email' | 'role' | 'createdAt'>;

export type UserIdentifier = { id?: string; email?: string };

export const fetchUserWithPermissions = async (
  identifier: UserIdentifier
): Promise<UserWithPermissions | null> => {
  const where = identifier.id
    ? eq(user.id, identifier.id)
    : identifier.email
    ? eq(user.email, identifier.email)
    : null;

  if (!where) {
    return null;
  }

  const db = await getDb();

  const userRecord = await db.select().from(user).where(where).limit(1).then(rows => rows[0] || null);

  if (!userRecord) {
    return null;
  }

  return {
    ...userRecord,
    permission: []
  };
};

export const findUserByEmail = async (email: string) => {
  const db = await getDb();
  return db.select().from(user).where(eq(user.email, email)).limit(1).then(rows => rows[0] || null);
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
    .insert(user)
    .values({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: 'PARTICIPANT',
      updatedAt: now
    } satisfies UserInsert)
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });

  if (!record) {
    throw new Error('Failed to create user account.');
  }

  return record;
};

export const createAdminUser = async (
  input: CreateParticipantUserInput
): Promise<BasicUserSummary> => {
  const now = touchTimestamp();
  const db = await getDb();

  const [record] = await db
    .insert(user)
    .values({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: 'ADMIN',
      updatedAt: now
    } satisfies UserInsert)
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });

  if (!record) {
    throw new Error('Failed to create admin user account.');
  }

  return record;
};
