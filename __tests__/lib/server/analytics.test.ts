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

const mockDb = {
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
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

      (mockDb.returning as jest.Mock).mockResolvedValue([mockVisit]);

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

      (mockDb.returning as jest.Mock).mockResolvedValue([mockVisit]);

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
        visitLogs: [
          {
            occurredAt: '2024-01-01T00:00:00Z',
            sessionId: 'session-1',
            userId: 'user-1'
          }
        ],
        recentUsers: [
          {
            createdAt: '2024-01-01T00:00:00Z'
          }
        ]
      };

      (mockDb.where as jest.Mock).mockResolvedValueOnce(mockData.visitLogs).mockResolvedValueOnce(mockData.recentUsers);

      const result = await getAnalyticsOverview();

      expect(result.totalVisits).toBe(1);
      expect(result.uniqueSessions).toBe(1);
      expect(result.uniqueUsers).toBe(1);
    });

    it('handles empty data gracefully', async () => {
      (mockDb.where as jest.Mock).mockResolvedValue([]);

      const result = await getAnalyticsOverview();

      expect(result).toEqual({
        timestamp: expect.any(String),
        totalVisits: 0,
        uniqueSessions: 0,
        uniqueUsers: 0,
        activeUsers: 0,
        dailyVisits: [],
        signupTrend: []
      });
    });
  });
});