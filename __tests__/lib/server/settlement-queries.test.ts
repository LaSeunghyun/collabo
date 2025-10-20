import { getSettlementsPendingPayout } from '@/lib/server/settlement-queries';
import { getDb } from '@/lib/db/client';
import { settlement, projects } from '@/lib/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
};

jest.mock('@/lib/db/client', () => ({
  getDb: jest.fn(() => mockDb),
}));

describe('settlement queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDb as jest.Mock).mockReturnValue(mockDb);
  });

  it('lists settlements awaiting payout with project summary', async () => {
    const mockSettlements = [
      {
        id: 'settlement-1',
        projectId: 'project-1',
        totalRaised: 1000,
        netAmount: 800,
        payoutStatus: 'PENDING',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        project: { id: 'project-1', title: 'Project' }
      }
    ];

    (mockDb.limit as jest.Mock).mockResolvedValue(mockSettlements);

    const result = await getSettlementsPendingPayout(10);

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalledWith(settlement);
    expect(mockDb.innerJoin).toHaveBeenCalledWith(projects, eq(settlement.projectId, projects.id));
    expect(mockDb.where).toHaveBeenCalledWith(inArray(settlement.payoutStatus, ['PENDING', 'IN_PROGRESS']));
    expect(mockDb.orderBy).toHaveBeenCalledWith(desc(settlement.updatedAt));
    expect(mockDb.limit).toHaveBeenCalledWith(10);
    
    expect(result).toEqual([
      {
        id: 'settlement-1',
        projectId: 'project-1',
        projectTitle: 'Project',
        totalRaised: 1000,
        netAmount: 800,
        payoutStatus: 'PENDING',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }
    ]);
  });
});