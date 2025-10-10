jest.mock('@/lib/server/settlements', () => ({
  calculateSettlementBreakdown: jest.fn()
}));

// Drizzle 클라이언트 모킹
jest.mock('@/lib/db/client', () => ({
  getDbClient: jest.fn()
}));

import { getDbClient } from '@/lib/db/client';
import { eq, and, desc } from 'drizzle-orm';

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  eq,
  and,
  desc
};

const mockGetDbClient = getDbClient as jest.MockedFunction<typeof getDbClient>;

const { calculateSettlementBreakdown } = jest.requireMock('@/lib/server/settlements') as {
  calculateSettlementBreakdown: jest.Mock;
};

import * as fundingSettlement from '@/lib/server/funding-settlement';

describe('funding settlement domain', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDbClient.mockResolvedValue(mockDb as any);
    calculateSettlementBreakdown.mockReset();
  });

  describe('createSettlementIfTargetReached', () => {
    it('returns null when target amount is not reached', async () => {
      mockDb.select.mockResolvedValue([{
        id: 'project-1',
        targetAmount: 100000,
        currentAmount: 50000,
        status: 'LIVE'
      }]);

      const result = await fundingSettlement.createSettlementIfTargetReached('project-1');

      expect(result).toBeNull();
    });

    it('creates settlement when target is reached', async () => {
      const mockProject = {
        id: 'project-1',
        targetAmount: 100000,
        currentAmount: 100000,
        status: 'LIVE',
        ownerId: 'owner-1'
      };

      const mockSettlement = {
        id: 'settlement-1',
        projectId: 'project-1',
        totalRaised: 100000,
        platformFee: 5000,
        creatorShare: 95000,
        partnerShare: 0,
        collaboratorShare: 0,
        gatewayFees: 0,
        netAmount: 95000,
        payoutStatus: 'PENDING',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      mockDb.select
        .mockResolvedValueOnce([mockProject]) // project query
        .mockResolvedValueOnce([{ count: 0 }]); // existing settlement check

      calculateSettlementBreakdown.mockReturnValue({
        totalRaised: 100000,
        platformFee: 5000,
        gatewayFees: 0,
        netAmount: 95000,
        creatorShare: 95000,
        partnerShareTotal: 0,
        collaboratorShareTotal: 0,
        partners: [],
        collaborators: []
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockSettlement])
        })
      });

      const result = await fundingSettlement.createSettlementIfTargetReached('project-1');

      expect(result).toEqual(mockSettlement);
      expect(calculateSettlementBreakdown).toHaveBeenCalled();
    });

    it('returns existing settlement if already exists', async () => {
      const mockSettlement = {
        id: 'settlement-1',
        projectId: 'project-1',
        totalRaised: 100000,
        payoutStatus: 'PENDING'
      };

      mockDb.select
        .mockResolvedValueOnce([{
          id: 'project-1',
          targetAmount: 100000,
          currentAmount: 100000,
          status: 'LIVE'
        }])
        .mockResolvedValueOnce([mockSettlement]);

      const result = await fundingSettlement.createSettlementIfTargetReached('project-1');

      expect(result).toEqual(mockSettlement);
    });
  });

  describe('validateFundingSettlementConsistency', () => {
    it('validates settlement consistency', async () => {
      mockDb.select.mockResolvedValue([{
        id: 'settlement-1',
        projectId: 'project-1',
        totalRaised: 100000
      }]);

      const result = await fundingSettlement.validateFundingSettlementConsistency('project-1');

      expect(result).toBeDefined();
    });

    it('handles validation errors', async () => {
      mockDb.select.mockRejectedValue(new Error('Validation error'));

      await expect(
        fundingSettlement.validateFundingSettlementConsistency('project-1')
      ).rejects.toThrow();
    });
  });
});
