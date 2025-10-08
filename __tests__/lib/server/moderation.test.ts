import { getOpenModerationReports } from '@/lib/server/moderation';
import { getDbClient } from '@/lib/db/client';
import { moderationReport, user } from '@/drizzle/schema';
import { eq, and, inArray, desc, count, notInArray } from 'drizzle-orm';

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
  leftJoin: jest.fn().mockReturnThis(),
  eq,
  and,
  inArray,
  desc,
  count,
  notInArray
};

const mockGetDbClient = getDbClient as jest.MockedFunction<typeof getDbClient>;

describe('moderation domain service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDbClient.mockResolvedValue(mockDb as any);
  });

  it('fetches active reports and maps to summaries', async () => {
    const reports = [
      {
        id: 'report-1',
        targetType: 'POST',
        targetId: 'post-1',
        status: 'PENDING',
        reason: 'Inappropriate content',
        createdAt: '2024-01-01T00:00:00Z',
        reporter: { id: 'user-1', name: 'Reporter' }
      }
    ];

    mockDb.select.mockResolvedValue(reports);

    const result = await getOpenModerationReports(3);

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalledWith(moderationReport);
    expect(mockDb.leftJoin).toHaveBeenCalledWith(user, eq(moderationReport.reporterId, user.id));
    expect(mockDb.where).toHaveBeenCalledWith(inArray(moderationReport.status, ['PENDING', 'REVIEWING']));
    expect(mockDb.orderBy).toHaveBeenCalledWith(desc(moderationReport.createdAt));
    expect(mockDb.limit).toHaveBeenCalledWith(3);
    
    expect(result).toEqual([
      {
        id: 'report-1',
        targetType: 'POST',
        targetId: 'post-1',
        status: 'PENDING',
        reason: 'Inappropriate content',
        createdAt: '2024-01-01T00:00:00Z',
        reporter: { id: 'user-1', name: 'Reporter' }
      }
    ]);
  });

  it('returns empty array when no reports found', async () => {
    mockDb.select.mockResolvedValue([]);

    const result = await getOpenModerationReports(5);

    expect(result).toEqual([]);
  });

  it('handles database errors gracefully', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockDb.select.mockRejectedValue(new Error('Database error'));

    const result = await getOpenModerationReports(5);

    expect(result).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});