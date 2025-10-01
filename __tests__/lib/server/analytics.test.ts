import { jest } from '@jest/globals';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    visitLog: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    user: {
      findMany: jest.fn()
    }
  }
}));

jest.mock('@/lib/auth/session', () => ({
  evaluateAuthorization: jest.fn().mockResolvedValue({ user: { id: 'test-user' } })
}));

import { getAnalyticsOverview, recordVisit } from '@/lib/server/analytics';
import { prisma } from '@/lib/prisma';
import { evaluateAuthorization } from '@/lib/auth/session';

describe('analytics server utilities', () => {
  beforeEach(() => {
    (prisma.visitLog.create as jest.Mock).mockReset();
    (prisma.visitLog.findMany as jest.Mock).mockReset();
    (prisma.user.findMany as jest.Mock).mockReset();
    (evaluateAuthorization as jest.Mock).mockResolvedValue({ user: { id: 'test-user' } });
  });

  it('records visit logs with hashed data', async () => {
    (prisma.visitLog.create as jest.Mock).mockResolvedValue({ id: 'visit-1' });

    await recordVisit({
      sessionId: 'session-123',
      path: '/sample',
      userAgent: 'jest-test',
      ipAddress: '203.0.113.42'
    });

    expect(prisma.visitLog.create).toHaveBeenCalledTimes(1);
    const payload = (prisma.visitLog.create as jest.Mock).mock.calls[0][0].data;
    expect(payload.sessionId).toBe('session-123');
    expect(payload.path).toBe('/sample');
    expect(payload.userAgent).toBe('jest-test');
    expect(payload.ipHash).toBeDefined();
  });

  it('aggregates analytics overview', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    (prisma.visitLog.findMany as jest.Mock).mockResolvedValue([
      { occurredAt: now, sessionId: 's1', userId: 'u1' },
      { occurredAt: now, sessionId: 's2', userId: null },
      { occurredAt: yesterday, sessionId: 's1', userId: 'u1' }
    ]);

    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { createdAt: now },
      { createdAt: yesterday }
    ]);

    const overview = await getAnalyticsOverview();
    expect(overview.totalVisits).toBe(3);
    expect(overview.uniqueSessions).toBe(2);
    expect(overview.uniqueUsers).toBe(1);
    expect(overview.activeUsers).toBeGreaterThanOrEqual(1);
    expect(overview.dailyVisits.length).toBeGreaterThanOrEqual(1);
    expect(overview.signupTrend.length).toBe(2);
  });
});
