import { getOpenModerationReports } from '@/lib/server/moderation';
import { getDb, isDrizzleAvailable } from '@/lib/db/client';
import { moderationReports, users } from '@/lib/db/schema';
import { eq, and, inArray, desc, count, notInArray } from 'drizzle-orm';

jest.mock('@/lib/db/client', () => ({
  getDb: jest.fn(),
  isDrizzleAvailable: jest.fn()
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

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockIsDrizzleAvailable = isDrizzleAvailable as jest.MockedFunction<typeof isDrizzleAvailable>;

describe('moderation domain service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockResolvedValue(mockDb as any);
    mockIsDrizzleAvailable.mockResolvedValue(true);
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

    mockDb.limit.mockResolvedValue(reports);

    const result = await getOpenModerationReports(3);

    expect(mockIsDrizzleAvailable).toHaveBeenCalled();
    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalledWith(moderationReports);
    expect(mockDb.leftJoin).toHaveBeenCalledWith(users, eq(moderationReports.reporterId, users.id));
    expect(mockDb.where).toHaveBeenCalledWith(inArray(moderationReports.status, ['PENDING', 'REVIEWING']));
    expect(mockDb.orderBy).toHaveBeenCalledWith(desc(moderationReports.createdAt));
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
    mockDb.limit.mockResolvedValue([]);

    const result = await getOpenModerationReports(5);

    expect(result).toEqual([]);
  });

  it('returns empty array without querying when database is disabled', async () => {
    mockIsDrizzleAvailable.mockResolvedValue(false);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await getOpenModerationReports(5);

    expect(result).toEqual([]);
    expect(mockDb.select).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('handles database errors gracefully', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockDb.limit.mockRejectedValue(new Error('Database error'));

    const result = await getOpenModerationReports(5);

    expect(result).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
