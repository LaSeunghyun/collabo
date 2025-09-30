import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Vercel 서버리스 환경을 위한 Prisma Client 설정
const createPrismaClient = () => {
  // 데이터베이스 URL에 prepared statement 비활성화 옵션 추가
  const databaseUrl = process.env.DATABASE_URL;
  const urlWithOptions = databaseUrl?.includes('?') 
    ? `${databaseUrl}&prepared_statements=false&connection_limit=1`
    : `${databaseUrl}?prepared_statements=false&connection_limit=1`;

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: urlWithOptions
      }
    }
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
