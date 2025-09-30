import { describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { UserRole } from '@/types/prisma';
import { compare } from 'bcryptjs';
import { createPrismaMock, type MockPrisma } from '../../helpers/prisma-mock';

jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(() => ({}))
}));

const prismaMock = createPrismaMock() as MockPrisma;
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));

let authOptions: Awaited<ReturnType<typeof importAuthOptions>>;
let credentialsProvider: any;
const compareMock = compare as jest.Mock;

async function importAuthOptions() {
  const module = await import('@/lib/auth/options');
  return module.authOptions;
}

beforeAll(async () => {
  authOptions = await importAuthOptions();
  credentialsProvider = (authOptions.providers as any[]).find((provider) => provider.id === 'credentials');
});

describe('Credentials authorize', () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    compareMock.mockReset();
  });

  it('returns null when credentials are missing', async () => {
    const result = await credentialsProvider.authorize?.({ email: '', password: '' }, undefined);
    expect(result).toBeNull();
  });
});

describe('authOptions callbacks', () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
  });

  it('populates session with id, role, and permissions', async () => {
    const token: any = { sub: 'user-1', role: UserRole.ADMIN, permissions: ['admin:manage'] };
    const session: any = { user: {} };

    const result = await authOptions.callbacks?.session?.({ session, token });

    expect(result?.user?.id).toBe('user-1');
    expect(result?.user?.role).toBe(UserRole.ADMIN);
    expect(result?.user?.permissions).toContain('admin:manage');
  });

  it('derives permissions in jwt callback', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: UserRole.CREATOR,
      permissions: []
    });

    const token: any = { sub: 'user-1', role: UserRole.CREATOR };
    const result = await authOptions.callbacks?.jwt?.({ token, user: { id: 'user-1' } as any });

    expect(result.role).toBe(UserRole.CREATOR);
    expect(Array.isArray(result.permissions)).toBe(true);
    expect(result.permissions.length).toBeGreaterThan(0);
  });
});
