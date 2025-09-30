jest.mock('@/lib/auth/session', () => {
  const actual = jest.requireActual('@/lib/auth/session');
  return {
    ...actual,
    evaluateAuthorization: jest.fn()
  };
});

import { describe, it, expect, beforeEach } from '@jest/globals';
import { requireApiUser, handleAuthorizationError, AuthorizationError } from '@/lib/auth/guards';
import { AuthorizationStatus, type SessionUser } from '@/lib/auth/session';

const evaluateAuthorization = jest.requireMock('@/lib/auth/session').evaluateAuthorization as jest.Mock;

describe('requireApiUser', () => {
  beforeEach(() => {
    evaluateAuthorization.mockReset();
  });

  it('returns the session user when authorized', async () => {
    const user: SessionUser = {
      id: 'user-1',
      role: 'ADMIN',
      permissions: []
    };
    evaluateAuthorization.mockResolvedValue({ status: AuthorizationStatus.AUTHORIZED, user });

    await expect(requireApiUser({})).resolves.toEqual(user);
  });

  it('throws AuthorizationError with 401 when unauthenticated', async () => {
    evaluateAuthorization.mockResolvedValue({ status: AuthorizationStatus.UNAUTHENTICATED, user: null });

    await expect(requireApiUser({})).rejects.toMatchObject({
      status: 401,
      name: 'AuthorizationError'
    });
  });

  it('throws AuthorizationError with 403 when forbidden', async () => {
    evaluateAuthorization.mockResolvedValue({ status: AuthorizationStatus.FORBIDDEN, user: null });

    await expect(requireApiUser({})).rejects.toMatchObject({
      status: 403,
      name: 'AuthorizationError'
    });
  });
});

describe('handleAuthorizationError', () => {
  it('returns JSON response for AuthorizationError', () => {
    const response = handleAuthorizationError(new AuthorizationError('forbidden', 403));

    expect(response).not.toBeNull();
    expect(response?.status).toBe(403);
  });

  it('returns null for non-authorization errors', () => {
    expect(handleAuthorizationError(new Error('boom'))).toBeNull();
  });
});
