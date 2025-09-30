import { SettlementPayoutStatus } from '@/types/prisma';
import { createPrismaMock, type MockPrisma } from '../../helpers/prisma-mock';

jest.mock('@/lib/server/settlements', () => ({
  calculateSettlementBreakdown: jest.fn()
}));

let mockPrisma: MockPrisma = createPrismaMock();

jest.mock('@/lib/prisma', () => ({
  get prisma() {
    return mockPrisma;
  },
  get default() {
    return mockPrisma;
  }
}));

const { calculateSettlementBreakdown } = jest.requireMock('@/lib/server/settlements') as {
  calculateSettlementBreakdown: jest.Mock;
};

import * as fundingSettlement from '@/lib/server/funding-settlement';

describe('funding settlement domain', () => {
  beforeEach(() => {
    mockPrisma = createPrismaMock();
    calculateSettlementBreakdown.mockReset();
  });

  describe('createSettlementIfTargetReached', () => {
    it('returns null when target amount is not reached', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        targetAmount: 1000,
        currentAmount: 500,
        status: 'LIVE',
        ownerId: 'owner-1',
        partnerMatches: [],
        collaborators: []
      });

      const result = await fundingSettlement.createSettlementIfTargetReached('project-1');

      expect(result).toBeNull();
      expect(mockPrisma.settlement.findFirst).not.toHaveBeenCalled();
    });

    it('returns existing pending settlement when found', async () => {
      const existing = { id: 'settlement-1' };
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        targetAmount: 1000,
        currentAmount: 1200,
        status: 'LIVE',
        ownerId: 'owner-1',
        partnerMatches: [],
        collaborators: []
      });
      mockPrisma.settlement.findFirst.mockResolvedValue(existing);

      const result = await fundingSettlement.createSettlementIfTargetReached('project-1');

      expect(result).toBe(existing);
      expect(mockPrisma.funding.findMany).not.toHaveBeenCalled();
    });

    it('creates a new settlement and payouts when conditions are met', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        targetAmount: 1000,
        currentAmount: 1500,
        status: 'LIVE',
        ownerId: 'owner-1',
        partnerMatches: [
          { partnerId: 'partner-1', settlementShare: 15 },
          { partnerId: 'partner-2', settlementShare: null }
        ],
        collaborators: [
          { userId: 'collab-1', share: 20 },
          { userId: 'collab-2', share: null }
        ]
      });
      mockPrisma.settlement.findFirst.mockResolvedValue(null);
      mockPrisma.funding.findMany.mockResolvedValue([
        { amount: 600, transaction: { gatewayFee: 10 } },
        { amount: 400, transaction: { gatewayFee: 5 } }
      ]);

      const breakdown = {
        totalRaised: 1000,
        platformFee: 50,
        creatorShare: 685,
        partnerShareTotal: 150,
        collaboratorShareTotal: 100,
        gatewayFees: 20,
        netAmount: 935,
        partners: [{ stakeholderId: 'partner-1', amount: 150, percentage: 0.15 }],
        collaborators: [{ stakeholderId: 'collab-1', amount: 100, percentage: 0.2 }]
      };
      calculateSettlementBreakdown.mockReturnValue(breakdown);

      mockPrisma.settlement.create.mockResolvedValue({
        id: 'settlement-1',
        projectId: 'project-1',
        payoutStatus: SettlementPayoutStatus.PENDING,
        ...breakdown
      });
      mockPrisma.settlementPayout.create.mockResolvedValue(undefined);

      const notes = { memo: 'override' };
      const result = await fundingSettlement.createSettlementIfTargetReached(
        'project-1',
        0.05,
        20,
        notes
      );

      expect(calculateSettlementBreakdown).toHaveBeenCalledWith({
        totalRaised: 1000,
        platformFeeRate: 0.05,
        gatewayFees: 20,
        partnerShares: [{ stakeholderId: 'partner-1', share: 0.15 }],
        collaboratorShares: [{ stakeholderId: 'collab-1', share: 0.2 }]
      });

      expect(mockPrisma.settlement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'project-1',
          notes,
          platformFee: breakdown.platformFee
        })
      });

      expect(mockPrisma.settlementPayout.create).toHaveBeenCalledTimes(4);
      expect(result).toMatchObject({ id: 'settlement-1' });
    });
  });

  describe('validateFundingSettlementConsistency', () => {
    it('returns valid when funding and settlement amounts align', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        currentAmount: 1000,
        fundings: [{ amount: 700 }, { amount: 300 }],
        settlements: [{ totalRaised: 1000 }]
      });

      const result = await fundingSettlement.validateFundingSettlementConsistency('project-1');

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('flags mismatches between funding, project amount, and settlement', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        currentAmount: 800,
        fundings: [{ amount: 500 }, { amount: 400 }],
        settlements: [{ totalRaised: 800 }]
      });

      const result = await fundingSettlement.validateFundingSettlementConsistency('project-1');

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.stringContaining('currentAmount'),
          expect.stringContaining('정산')
        ])
      );
    });
  });

  describe('safeUpdateFundingData', () => {
    it('updates project amount and forwards settlement result', async () => {
      mockPrisma.project.update.mockResolvedValue(undefined);
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        targetAmount: 1000,
        currentAmount: 200,
        status: 'LIVE',
        ownerId: 'owner-1',
        partnerMatches: [],
        collaborators: []
      });

      const result = await fundingSettlement.safeUpdateFundingData('project-1', 500, true);

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: { currentAmount: { increment: 500 } }
      });
      expect(mockPrisma.project.findUnique).toHaveBeenCalled();
      expect(result).toEqual({ settlement: null });
    });

    it('can skip project amount update when flag is false', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        targetAmount: 1000,
        currentAmount: 200,
        status: 'LIVE',
        ownerId: 'owner-1',
        partnerMatches: [],
        collaborators: []
      });

      const result = await fundingSettlement.safeUpdateFundingData('project-1', 200, false);

      expect(mockPrisma.project.update).not.toHaveBeenCalled();
      expect(mockPrisma.project.findUnique).toHaveBeenCalled();
      expect(result).toEqual({ settlement: null });
    });
  });
});
