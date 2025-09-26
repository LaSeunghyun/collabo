import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export class AuthenticationError extends Error {
  status: number;

  constructor(message = '로그인이 필요합니다.', status = 401) {
    super(message);
    this.status = status;
  }
}

function buildUserName(email: string, fallback?: string | null) {
  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }

  const [localPart] = email.split('@');
  if (localPart && localPart.trim().length > 0) {
    return localPart.trim();
  }

  return 'User';
}

export async function requireUser() {
  const session = await getServerSession(authOptions);

  const email = session?.user?.email?.toLowerCase();
  if (!email) {
    throw new AuthenticationError();
  }

  const name = buildUserName(email, session.user?.name);

  const updateData: Prisma.UserUpdateInput = {
    name
  };

  if (session.user?.role) {
    updateData.role = session.user.role;
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: updateData,
    create: {
      email,
      name,
      role: session.user?.role ?? 'fan'
    }
  });

  return { user, session };
}
