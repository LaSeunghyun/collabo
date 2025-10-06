import { prisma } from '@/lib/drizzle';

export const fetchUserWithPermissions = (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  });
