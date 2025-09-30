import { ModerationStatus, ModerationTargetType } from '@/types/prisma';
import { getOpenModerationReports } from '@/lib/server/moderation';
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

describe('moderation domain service', () => {
  beforeEach(() => {
    mockPrisma = createPrismaMock();
  });

  it('fetches active reports and maps to summaries', async () => {
    const reports = [
      {
        id: 'report-1',
        targetType: ModerationTargetType.PROJECT,
        targetId: 'project-1',
        status: ModerationStatus.PENDING,
        reason: 'Inappropriate content',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        reporter: { id: 'user-1', name: 'Reporter' }
      }
    ];
    mockPrisma.moderationReport.findMany.mockResolvedValue(reports);

    const result = await getOpenModerationReports(3);

    expect(mockPrisma.moderationReport.findMany).toHaveBeenCalledWith({
      where: { status: { in: [ModerationStatus.PENDING, ModerationStatus.REVIEWING] } },
      include: { reporter: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    expect(result).toEqual([
      {
        id: 'report-1',
        targetType: ModerationTargetType.PROJECT,
        targetId: 'project-1',
        status: ModerationStatus.PENDING,
        reason: 'Inappropriate content',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        reporter: { id: 'user-1', name: 'Reporter' }
      }
    ]);
  });
});
