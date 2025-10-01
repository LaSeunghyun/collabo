import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Vercel 서버리스 환경을 위한 Prisma Client 설정
const normalizeServerlessConnectionString = (databaseUrl: string) => {
  const isDataProxy = databaseUrl.startsWith('prisma://');

  if (isDataProxy) {
    return databaseUrl;
  }

  try {
    const url = new URL(databaseUrl);
    const isPostgres = url.protocol === 'postgres:' || url.protocol === 'postgresql:';

    if (!isPostgres) {
      return databaseUrl;
    }

    const ensureParam = (key: string, value: string, alwaysOverride = false) => {
      const currentValue = url.searchParams.get(key);

      if (alwaysOverride || !currentValue || currentValue.trim().length === 0) {
        url.searchParams.set(key, value);
      }
    };

    ensureParam('pgbouncer', 'true', url.searchParams.get('pgbouncer') !== 'true');
    ensureParam('connection_limit', '1');
    ensureParam('pool_timeout', '0');

    return url.toString();
  } catch (error) {
    console.warn('[prisma] Invalid DATABASE_URL format. Falling back to the raw value.', error);
    return databaseUrl;
  }
};

const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
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

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

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
