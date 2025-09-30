import { SettlementPayoutStatus } from '@/types/prisma';
import { getSettlementsPendingPayout } from '@/lib/server/settlement-queries';
import { type MockPrisma, createPrismaMock } from '../../helpers/prisma-mock';

let mockPrisma: MockPrisma = createPrismaMock();

jest.mock('@/lib/prisma', () => ({
  get prisma() {
    return mockPrisma;
  },
  get default() {
    return mockPrisma;
  }
}));

describe('settlement queries', () => {
  beforeEach(() => {
    mockPrisma = createPrismaMock();
  });

  it('lists settlements awaiting payout with project summary', async () => {
    mockPrisma.settlement.findMany.mockResolvedValue([
      {
        id: 'settlement-1',
        projectId: 'project-1',
        totalRaised: 1000,
        netAmount: 800,
        payoutStatus: SettlementPayoutStatus.PENDING,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        project: { id: 'project-1', title: 'Project' }
      }
    ]);

    const result = await getSettlementsPendingPayout(10);

    expect(mockPrisma.settlement.findMany).toHaveBeenCalledWith({
      where: {
        payoutStatus: { in: [SettlementPayoutStatus.PENDING, SettlementPayoutStatus.IN_PROGRESS] }
      },
      include: {
        project: { select: { id: true, title: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });
    expect(result).toEqual([
      {
        id: 'settlement-1',
        projectId: 'project-1',
        projectTitle: 'Project',
        totalRaised: 1000,
        netAmount: 800,
        payoutStatus: SettlementPayoutStatus.PENDING,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z')
      }
    ]);
  });
});
