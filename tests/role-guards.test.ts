import { canAccessRoute, findMatchingGuard } from '@/lib/auth/role-guards';
import { UserRole } from '@/types/prisma';

describe('ROLE_GUARDS', () => {
  it('exposes admin guard requiring ADMIN role', () => {
    const guard = findMatchingGuard('/admin');

    expect(guard).toBeDefined();
    expect(guard?.roles).toContain(UserRole.ADMIN);
  });

  it('prevents access when subject is missing', () => {
    expect(canAccessRoute(null, '/admin')).toBe(false);
  });

  it('allows creator with permission to access project creation', () => {
    const subject = { role: UserRole.CREATOR, permissions: ['project:create'] };

    expect(canAccessRoute(subject, '/projects/new')).toBe(true);
  });

  it('denies creator lacking permission for guarded routes', () => {
    const subject = { role: UserRole.CREATOR, permissions: [] as string[] };

    expect(canAccessRoute(subject, '/projects/new')).toBe(false);
  });

  it('ignores guards for public routes', () => {
    expect(canAccessRoute(null, '/')).toBe(true);
    expect(canAccessRoute({ role: UserRole.PARTICIPANT, permissions: [] }, '/help')).toBe(true);
  });
});
