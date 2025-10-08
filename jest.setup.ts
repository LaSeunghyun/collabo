import '@testing-library/jest-dom';
import { createPrismaMock, MockPrisma } from './__tests__/helpers/prisma-mock';

// 전역 타입 정의
declare global {
  var __prismaMocks: MockPrisma;
}

jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: () => undefined
  }))
}));

// Prisma mock 설정
const mockPrisma = createPrismaMock();
globalThis.__prismaMocks = mockPrisma;

// Drizzle mock 설정
jest.mock('@/lib/db/client', () => ({
  db: mockPrisma,
  getDbClient: () => mockPrisma,
  isDrizzleAvailable: () => true,
  closeDb: jest.fn()
}));

// Set test environment variables
process.env.DATABASE_URL =
  'postgresql://postgres.tsdnwdwcwnqygyepojaq:YGRA5XVPxEf95v26@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres';
process.env.NEXTAUTH_SECRET = 'lash';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
