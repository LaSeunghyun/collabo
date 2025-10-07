import { UserRole } from '@/types/auth';

export {};

declare global {
  namespace CollaboriumAuth {
    type Role = UserRole;
    type Permission = string;
  }
}
