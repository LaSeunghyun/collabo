import { PrismaClient } from '@prisma/client';

import { normalizeServerlessConnectionString } from '@/lib/db/connection-string';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const createDisabledPrismaClient = (reason: string) => {
  const baseReason = reason || 'The Prisma client could not be initialized.';
  const message = `[prisma] Database access is disabled: ${baseReason} Set DATABASE_URL in your environment to enable Prisma.`;

  console.warn(message);

  const noop = async () => undefined;

  return new Proxy({} as PrismaClient, {
    get(_target, prop) {
      if (prop === '$disconnect') {
        return noop;
      }

      if (prop === Symbol.toStringTag) {
        return 'PrismaClientStub';
      }

      return () => {
        throw new Error(message);
      };
    }
  });
};

const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set.');
  }

  const datasourceUrl = normalizeServerlessConnectionString(databaseUrl);

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: datasourceUrl
      }
    }
  });
};

const instantiatePrisma = () => {
  try {
    return createPrismaClient();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return createDisabledPrismaClient(reason);
  }
};

export const prisma = globalForPrisma.prisma ?? instantiatePrisma();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 서버리스 환경에서 연결 정리
if (typeof window === 'undefined' && typeof process !== 'undefined' && typeof process.on === 'function') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

// Prisma shim을 위한 타입 재export
export type { Prisma } from '@prisma/client';
export default prisma;
