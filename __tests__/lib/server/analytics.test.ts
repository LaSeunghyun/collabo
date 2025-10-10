import { jest } from '@jest/globals';

jest.mock('@/lib/db/client', () => ({
  getDbClient: jest.fn()
}));

jest.mock('@/lib/auth/session', () => ({
  evaluateAuthorization: jest.fn().mockResolvedValue({ user: { id: 'test-user' } })
}));

import { getAnalyticsOverview, recordVisit } from '@/lib/server/analytics';
import { getDbClient } from '@/lib/db/client';
import { evaluateAuthorization } from '@/lib/auth/session';
import { eq, and, desc, count, sql } from 'drizzle-orm';

const mockDb = {
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  eq,
  and,
  desc,
  count,
  sql
};

const mockGetDbClient = getDbClient as jest.MockedFunction<typeof getDbClient>;
const mockEvaluateAuthorization = evaluateAuthorization as jest.MockedFunction<typeof evaluateAuthorization>;

describe('analytics server utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDbClient.mockResolvedValue(mockDb as any);
  });

  describe('recordVisit', () => {
    it('records visit with user session', async () => {
      const mockVisit = {
        id: 'visit-1',
        userId: 'test-user',
        sessionId: 'session-1',
        ipHash: 'hash123',
        occurredAt: new Date('2024-01-01T00:00:00Z')
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockVisit])
        })
      });

      const result = await recordVisit({
        sessionId: 'session-1',
        ipAddress: '192.168.1.1',
        authorization: 'Bearer token123'
      });

      expect(result).toEqual(mockVisit);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('records visit without user session', async () => {
      mockEvaluateAuthorization.mockResolvedValueOnce({ user: null, status: 'unauthenticated' as const, session: null });

      const mockVisit = {
        id: 'visit-1',
        userId: null,
        sessionId: 'session-1',
        ipHash: 'hash123',
        occurredAt: new Date('2024-01-01T00:00:00Z')
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockVisit])
        })
      });

      const result = await recordVisit({
        sessionId: 'session-1',
        ipAddress: '192.168.1.1',
        authorization: 'Bearer token123'
      });

      expect(result).toEqual(mockVisit);
    });
  });

  describe('getAnalyticsOverview', () => {
    it('returns analytics overview data', async () => {
      const mockData = {
        totalVisits: 100,
        uniqueUsers: 50,
        totalUsers: 200,
        recentVisits: [
          {
            id: 'visit-1',
            occurredAt: new Date('2024-01-01T00:00:00Z'),
            user: { id: 'user-1', name: 'Test User' }
          }
        ]
      };

      // Mock the select chain for visitLogs query
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            { occurredAt: '2024-01-01T00:00:00Z', sessionId: 'session-1', userId: 'user-1' },
            { occurredAt: '2024-01-02T00:00:00Z', sessionId: 'session-2', userId: 'user-2' }
          ])
        })
      });

      // Mock the select chain for users query
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            { createdAt: '2024-01-01T00:00:00Z' },
            { createdAt: '2024-01-02T00:00:00Z' }
          ])
        })
      });

      const result = await getAnalyticsOverview();

      expect(result.totalVisits).toBeGreaterThan(0);
      expect(result.uniqueUsers).toBeGreaterThan(0);
      expect(result.totalUsers).toBeGreaterThan(0);
      expect(Array.isArray(result.recentVisits)).toBe(true);
    });

    it('handles empty data gracefully', async () => {
      // Mock empty data for visitLogs query
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([])
        })
      });

      // Mock empty data for users query
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([])
        })
      });

      const result = await getAnalyticsOverview();

      expect(result).toEqual({
        totalVisits: 0,
        uniqueUsers: 0,
        totalUsers: 0,
        recentVisits: []
      });
    });
  });
});
