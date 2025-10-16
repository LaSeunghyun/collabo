import { UserRole } from '@/types/prisma';

export {};

declare global {
  namespace CollaboriumAuth {
    type Role = UserRole;
    type Permission = string;
  }
}
