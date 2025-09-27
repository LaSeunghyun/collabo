jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

import { getServerSession } from 'next-auth';

import { AuthorizationStatus, evaluateAuthorization } from '@/lib/auth/session';
import { deriveEffectivePermissions } from '@/lib/auth/permissions';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

const ORIGINAL_AUTH_V3 = process.env.AUTH_V3_ENABLED;

describe('server-side authorization', () => {
  afterAll(() => {
    process.env.AUTH_V3_ENABLED = ORIGINAL_AUTH_V3;
  });

  describe('jwt permissions hydration', () => {
    it('includes base role permissions when auth v3 is disabled', async () => {
      process.env.AUTH_V3_ENABLED = 'false';

      await new Promise<void>((resolve, reject) => {
        jest.isolateModules(() => {
          try {
            const { authOptions } = require('@/lib/auth/options');
            const jwtCallback = authOptions.callbacks?.jwt;

            if (!jwtCallback) {
              reject(new Error('JWT callback is not defined'));
              return;
            }

            Promise.resolve(
              jwtCallback({
                token: {},
                user: {
                  id: 'user-creator',
                  email: 'creator@example.com',
                  role: 'CREATOR'
                }
              } as any)
            )
              .then((token) => {
                expect(Array.isArray(token.permissions)).toBe(true);
                expect(token.permissions).toEqual(
                  expect.arrayContaining(['project:create', 'session:read'])
                );
                resolve();
              })
              .catch(reject)
              .finally(() => {
                process.env.AUTH_V3_ENABLED = ORIGINAL_AUTH_V3;
              });
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  });

  describe('role-gated routes', () => {
    beforeEach(() => {
      mockGetServerSession.mockReset();
    });

    it('authorizes creator-only routes with default permissions', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'creator-id',
          role: 'CREATOR',
          permissions: deriveEffectivePermissions('CREATOR')
        }
      } as any);

      const result = await evaluateAuthorization({
        roles: ['CREATOR', 'ADMIN'],
        permissions: ['project:create']
      });

      expect(result.status).toBe(AuthorizationStatus.AUTHORIZED);
      expect(result.user?.role).toBe('CREATOR');
    });

    it('authorizes partner-only routes with default permissions', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'partner-id',
          role: 'PARTNER',
          permissions: deriveEffectivePermissions('PARTNER')
        }
      } as any);

      const result = await evaluateAuthorization({
        roles: ['PARTNER', 'ADMIN'],
        permissions: ['partner:manage']
      });

      expect(result.status).toBe(AuthorizationStatus.AUTHORIZED);
      expect(result.user?.role).toBe('PARTNER');
    });

    it('authorizes admin-only routes with default permissions', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-id',
          role: 'ADMIN',
          permissions: deriveEffectivePermissions('ADMIN')
        }
      } as any);

      const result = await evaluateAuthorization({
        roles: ['ADMIN'],
        permissions: ['settlement:manage']
      });

      expect(result.status).toBe(AuthorizationStatus.AUTHORIZED);
      expect(result.user?.role).toBe('ADMIN');
    });
  });
});
