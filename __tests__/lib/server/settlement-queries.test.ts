import { getSettlementsPendingPayout } from '@/lib/server/settlement-queries';
import { getDbClient } from '@/lib/db/client';
import { settlements, projects } from '@/lib/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';

// Drizzle Ŭ̾Ʈ ŷ
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
    expect(mockDb.from).toHaveBeenCalledWith(settlements);
    expect(mockDb.innerJoin).toHaveBeenCalledWith(projects, eq(settlements.projectId, projects.id));
    expect(mockDb.where).toHaveBeenCalledWith(inArray(settlements.payoutStatus, ['PENDING', 'IN_PROGRESS']));
    expect(mockDb.orderBy).toHaveBeenCalledWith(desc(settlements.updatedAt));
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