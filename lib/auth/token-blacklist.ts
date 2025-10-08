import type { InferSelectModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

import { getDb } from '@/lib/db/client';
import { tokenBlacklist } from '@/lib/db/schema/tables';

export type TokenBlacklistRecord = InferSelectModel<typeof tokenBlacklist>;

export const blacklistToken = async (jti: string, expiresAt: Date) => {
  const timestamp = expiresAt.toISOString();
  const db = await getDb();

  const [record] = await db
    .insert(tokenBlacklist)
    .values({ jti, expiresAt: timestamp })
    .onConflictDoUpdate({
      target: tokenBlacklist.jti,
      set: { expiresAt: timestamp },
      where: eq(tokenBlacklist.jti, jti),
    })
    .returning();

  return record;
};
