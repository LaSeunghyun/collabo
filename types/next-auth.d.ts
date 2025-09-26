import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

import type { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: UserRole | string;
    } & DefaultSession['user'];
  }

  interface User {
    role?: UserRole | string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole | string;
  }
}
