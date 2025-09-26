import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

import type { AppRole } from '@/lib/auth/constants';

declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: AppRole;
    } & DefaultSession['user'];
  }

  interface User {
    role?: AppRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: AppRole;
  }
}
