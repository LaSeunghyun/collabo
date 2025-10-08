import { randomUUID } from 'crypto';

import { eq } from 'drizzle-orm';

import { getDb } from '@/lib/db/client';
import { permission, userPermission, user as userSchema } from '@/drizzle/schema';

type UserRecord = typeof userSchema.$inferSelect;
type UserPermissionRecord = typeof userPermission.$inferSelect;
type PermissionRecord = typeof permission.$inferSelect;
type UserInsert = typeof userSchema.$inferInsert;

export type UserWithPermissions = UserRecord & {
  permission: Array<UserPermissionRecord & { permission: PermissionRecord }>;
};

export type BasicUserSummary = Pick<UserRecord, 'id' | 'name' | 'email' | 'role' | 'createdAt'>;

export type UserIdentifier = { id?: string; email?: string };

export const fetchUserWithPermissions = async (
  identifier: UserIdentifier
): Promise<UserWithPermissions | null> => {
  const where = identifier.id
    ? eq(userSchema.id, identifier.id)
    : identifier.email
    ? eq(userSchema.email, identifier.email)
    : null;

  if (!where) {
    return null;
  }

  const db = await getDb();

  const userRecord = await db.select().from(userSchema).where(where).limit(1).then(rows => rows[0] || null);

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
  return db.select().from(userSchema).where(eq(userSchema.email, email)).limit(1).then(rows => rows[0] || null);
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
    .insert(userSchema)
    .values({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: 'PARTICIPANT',
      createdAt: now,
      updatedAt: now
    } satisfies UserInsert)
    .returning({
      id: userSchema.id,
      name: userSchema.name,
      email: userSchema.email,
      role: userSchema.role,
      createdAt: userSchema.createdAt
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
    .insert(userSchema)
    .values({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: 'ADMIN',
      createdAt: now,
      updatedAt: now
    } satisfies UserInsert)
    .returning({
      id: userSchema.id,
      name: userSchema.name,
      email: userSchema.email,
      role: userSchema.role,
      createdAt: userSchema.createdAt
    });

  if (!record) {
    throw new Error('Failed to create admin user account.');
  }

  return record;
};
