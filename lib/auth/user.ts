import { prisma } from '@/lib/prisma';

export const fetchUserWithPermissions = (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId }
  });
