import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: ({
      id?: string;
      role?: CollaboriumAuth.Role;
      permissions?: CollaboriumAuth.Permission[];
    } & DefaultSession['user']) | undefined;
  }

  interface User {
    role?: CollaboriumAuth.Role;
    permissions?: CollaboriumAuth.Permission[];
  }
}
