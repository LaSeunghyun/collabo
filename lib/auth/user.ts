import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { permissions, userPermissions, users } from '@/lib/db/schema';

type UserRecord = typeof users.$inferSelect;
type UserPermissionRecord = typeof userPermissions.$inferSelect;
type PermissionRecord = typeof permissions.$inferSelect;

export type UserWithPermissions = UserRecord & {
  permissions: Array<UserPermissionRecord & { permission: PermissionRecord }>;
};

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
