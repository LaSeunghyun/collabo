jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('@/lib/auth/options', () => ({
  authOptions: {}
}));

import { describe, it, expect, beforeEach } from '@jest/globals';
import { UserRole } from '@/types/shared';
import type { Session } from 'next-auth';

let evaluateAuthorization: typeof import('@/lib/auth/session')['evaluateAuthorization'];
let AuthorizationStatus: typeof import('@/lib/auth/session')['AuthorizationStatus'];
let getServerSession: jest.Mock;

beforeAll(async () => {
  const sessionModule = await import('@/lib/auth/session');
  evaluateAuthorization = sessionModule.evaluateAuthorization;
  AuthorizationStatus = sessionModule.AuthorizationStatus;
  ({ getServerSession } = jest.requireMock('next-auth'));
});

describe('evaluateAuthorization', () => {
  beforeEach(() => {
    getServerSession.mockReset();
  });

  it('returns UNAUTHENTICATED when session is missing', async () => {
    getServerSession.mockResolvedValue(null);

    const result = await evaluateAuthorization({ roles: [UserRole.CREATOR] }, {});

    expect(result.status).toBe(AuthorizationStatus.UNAUTHENTICATED);
    expect(result.user).toBeNull();
  });

  it('returns FORBIDDEN when role requirement is not met', async () => {
    const session = {
      user: { id: 'user-1', role: 'participant', permissions: [] }
    } as unknown as Session;
    getServerSession.mockResolvedValue(session);

    const result = await evaluateAuthorization({ roles: [UserRole.ADMIN] }, { session });

    expect(result.status).toBe(AuthorizationStatus.FORBIDDEN);
    expect(result.user).toBeNull();
  });

  it('returns FORBIDDEN when permissions are insufficient', async () => {
    const session = {
      user: { id: 'user-1', role: 'admin', permissions: ['project:view'] }
    } as unknown as Session;
    getServerSession.mockResolvedValue(session);

    const result = await evaluateAuthorization({ permissions: ['admin:manage'] }, { session });

    expect(result.status).toBe(AuthorizationStatus.FORBIDDEN);
  });

  it('normalises role and returns authorized payload', async () => {
    const session = {
      user: {
        id: 'user-1',
        name: 'Test',
        email: 'test@example.com',
        role: 'CREATOR',
        permissions: ['project:create']
      }
    } as unknown as Session;
    getServerSession.mockResolvedValue(session);

    const result = await evaluateAuthorization({ roles: [UserRole.CREATOR] }, { session });

    expect(result.status).toBe(AuthorizationStatus.AUTHORIZED);
    expect(result.user).toEqual(
      expect.objectContaining({
        id: 'user-1',
        role: UserRole.CREATOR,
        permissions: expect.arrayContaining(['project:create'])
      })
    );
  });
});
