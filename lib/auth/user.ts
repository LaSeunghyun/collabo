import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { permissions, userPermissions, users } from '@/lib/db/schema';

type UserRecord = typeof users.$inferSelect;
type UserPermissionRecord = typeof userPermissions.$inferSelect;
type PermissionRecord = typeof permissions.$inferSelect;

export type UserWithPermissions = UserRecord & {
  permissions: Array<UserPermissionRecord & { permission: PermissionRecord }>;
};

export const fetchUserWithPermissions = async (
  userId: string
): Promise<UserWithPermissions | null> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
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
