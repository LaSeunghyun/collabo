import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Vercel 서버리스 환경을 위한 Prisma Client 설정
const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  let datasourceUrl = databaseUrl;

  try {
    const url = new URL(databaseUrl);

    if (!url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true');
    }

    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '1');
    }

    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '0');
    }

    datasourceUrl = url.toString();
  } catch (error) {
    console.warn('Invalid DATABASE_URL format, falling back to raw value.', error);
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasourceUrl
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 서버리스 환경에서 연결 정리
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

// Prisma shim을 위한 타입 재export
export type { Prisma } from '@prisma/client';
export default prisma;
