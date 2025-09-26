export {};

declare global {
  namespace CollaboriumAuth {
    type Role = import('@prisma/client').UserRole | string;
    type Permission = string;
  }
}
