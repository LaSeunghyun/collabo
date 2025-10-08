import { getSettlementsPendingPayout } from '@/lib/server/settlement-queries';
import { getDbClient } from '@/lib/db/client';
import { settlement, project } from '@/drizzle/schema';
import { eq, inArray, desc } from 'drizzle-orm';

// Drizzle 클라이언트 모킹
jest.mock('@/lib/db/client', () => ({
  getDbClient: jest.fn()
}));

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  eq,
  inArray,
  desc
};

const mockGetDbClient = getDbClient as jest.MockedFunction<typeof getDbClient>;

describe('settlement queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDbClient.mockResolvedValue(mockDb as any);
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

    mockDb.select.mockResolvedValue(mockSettlements);

    const result = await getSettlementsPendingPayout(10);

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalledWith(settlement);
    expect(mockDb.innerJoin).toHaveBeenCalledWith(project, eq(settlement.projectId, project.id));
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
