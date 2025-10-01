import { prisma } from '@/lib/prisma';

export const blacklistToken = (jti: string, expiresAt: Date) =>
  prisma.tokenBlacklist.upsert({
    where: { jti },
    update: { expiresAt },
    create: { jti, expiresAt }
  });
