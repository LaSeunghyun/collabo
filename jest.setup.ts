import '@testing-library/jest-dom';

jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: () => undefined
  }))
}));

// Set test environment variables
process.env.DATABASE_URL =
  'postgresql://postgres.tsdnwdwcwnqygyepojaq:YGRA5XVPxEf95v26@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres';
process.env.NEXTAUTH_SECRET = 'lash';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
