import { describe, expect, it, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/funding/route';
import { AuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { createPrismaMock, resetPrismaMock, type MockPrisma } from '../helpers/prisma-mock';

type PrismaModule = { prisma: MockPrisma };

jest.mock('@/lib/prisma', () => {
  const { createPrismaMock: factory } = require('../helpers/prisma-mock');
  return { prisma: factory() } as PrismaModule;
});

jest.mock('@/lib/auth/guards', () => {
  const actual = jest.requireActual('@/lib/auth/guards');
  return {
    ...actual,
    requireApiUser: jest.fn()
  };
});

const prismaMock = (jest.requireMock('@/lib/prisma') as PrismaModule).prisma;
const requireApiUserMock = require('@/lib/auth/guards').requireApiUser as jest.MockedFunction<
  typeof requireApiUser
>;

describe('Funding API authentication', () => {
  beforeEach(() => {
    resetPrismaMock(prismaMock);
    jest.clearAllMocks();
  });

  it('returns 401 when session is not authenticated', async () => {
    requireApiUserMock.mockRejectedValueOnce(new AuthorizationError('Authentication required.', 401));

    const request = new NextRequest('http://localhost:3000/api/funding', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'test-project' })
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  it('returns 404 when project is not found', async () => {
    requireApiUserMock.mockResolvedValue({ id: 'user-1', role: 'PARTICIPANT', permissions: [] } as any);
    prismaMock.project.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/funding', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'missing-project', amount: 1000, currency: 'krw' })
    });

    const response = await POST(request);
    expect(response.status).toBe(404);

    const json = await response.json();
    expect(json.error).toBeDefined();
  });
});
