import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/prisma';
import { hash } from 'bcryptjs';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn()
}));

describe('POST /api/auth/register', () => {
  const mockedPrisma = prisma as unknown as {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  const mockedHash = hash as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildRequest = (body: Record<string, unknown>) =>
    new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

  it('creates a participant user even when a different role is supplied', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.PARTICIPANT,
      createdAt: new Date()
    });
    mockedHash.mockResolvedValue('hashed-password');

    const response = await POST(
      buildRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.CREATOR
      })
    );

    expect(response.status).toBe(200);
    expect(mockedPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: UserRole.PARTICIPANT
        })
      })
    );
  });

  it('rejects requests with missing required fields', async () => {
    const response = await POST(buildRequest({ email: 'missing-name@example.com' }));

    expect(response.status).toBe(400);
    expect(mockedPrisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects short passwords', async () => {
    const response = await POST(
      buildRequest({
        name: 'Short Password',
        email: 'short@example.com',
        password: '123'
      })
    );

    expect(response.status).toBe(400);
    expect(mockedPrisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate email addresses', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    const response = await POST(
      buildRequest({
        name: 'Duplicate User',
        email: 'dup@example.com',
        password: 'password123'
      })
    );

    expect(response.status).toBe(400);
    expect(mockedHash).not.toHaveBeenCalled();
    expect(mockedPrisma.user.create).not.toHaveBeenCalled();
  });
});
