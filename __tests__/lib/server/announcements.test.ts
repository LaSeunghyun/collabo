import { DEFAULT_ANNOUNCEMENT_CATEGORY } from '@/lib/constants/announcements';
import { createAnnouncement, getAnnouncements } from '@/lib/server/announcements';
import { getDbClient } from '@/lib/db/client';
import { eq, and, or, lte, isNull, desc } from 'drizzle-orm';

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
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  count: jest.fn().mockReturnThis(),
  eq,
  and,
  or,
  lte,
  isNull,
  desc
};

const mockGetDbClient = getDbClient as jest.MockedFunction<typeof getDbClient>;

describe('announcement domain service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDbClient.mockResolvedValue(mockDb as any);
  });

  it('returns empty list when no announcements exist', async () => {
    mockDb.select.mockResolvedValue([]);
    mockDb.count.mockResolvedValue([{ count: 0 }]);

    const result = await getAnnouncements({ userId: 'user-1' });

    expect(result).toEqual({ announcements: [], unreadCount: 0 });
  });

  it('returns announcements with proper mapping', async () => {
    const mockAnnouncements = [
      {
        id: 'announcement-1',
        title: 'Test Announcement',
        content: 'Test content',
        category: 'policy',
        isPinned: true,
        publishedAt: new Date('2024-03-01T00:00:00Z'),
        createdAt: new Date('2024-03-01T00:00:00Z'),
        author: {
          id: 'author-1',
          name: 'Test Author',
          avatarUrl: 'https://example.com/avatar.jpg'
        },
        reads: []
      }
    ];

    mockDb.select.mockResolvedValue(mockAnnouncements);
    mockDb.count.mockResolvedValue([{ count: 0 }]);

    const result = await getAnnouncements({ userId: 'user-1' });

    expect(result.announcements).toHaveLength(1);
    expect(result.announcements[0]).toMatchObject({
      id: 'announcement-1',
      title: 'Test Announcement',
      content: 'Test content',
      category: 'policy',
      isPinned: true,
      publishedAt: new Date('2024-03-01T00:00:00Z'),
      author: {
        id: 'author-1',
        name: 'Test Author',
        avatarUrl: 'https://example.com/avatar.jpg'
      },
      isRead: false,
      isNew: true
    });
  });

  it('normalises category and publishedAt when creating announcements', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-03-01T00:00:00Z').getTime());

    const mockCreatedAnnouncement = {
      id: 'announcement-1',
      title: 'Maintenance window',
      content: 'We will perform maintenance.',
      category: 'policy',
      isPinned: true,
      publishedAt: new Date('2024-04-01T15:00:00Z'),
      createdAt: new Date('2024-03-01T00:00:00Z'),
      updatedAt: new Date('2024-03-01T00:00:00Z'),
      author: {
        id: 'author-1',
        name: 'Test Author',
        avatarUrl: null
      },
      reads: []
    };

    mockDb.insert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockCreatedAnnouncement])
      })
    });

    const detail = await createAnnouncement(
      {
        title: 'Maintenance window',
        content: 'We will perform maintenance.',
        category: 'policy',
        isPinned: true,
        publishedAt: '2024-04-01T15:00:00Z'
      },
      'author-1'
    );

    expect(detail.category).toBe('policy');
    expect(detail.publishedAt).toEqual(new Date('2024-04-01T15:00:00Z'));
    expect(detail.isPinned).toBe(true);
    expect(detail.isNew).toBe(true);

    const fallback = await createAnnouncement(
      {
        title: 'General notice',
        content: 'Hello',
        category: 'unknown'
      },
      'author-2'
    );

    expect(fallback.category).toBe(DEFAULT_ANNOUNCEMENT_CATEGORY);
    nowSpy.mockRestore();
  });

  it('filters announcements by category', async () => {
    mockDb.select.mockResolvedValue([]);
    mockDb.count.mockResolvedValue([{ count: 0 }]);

    await getAnnouncements({ userId: 'user-1', category: 'policy' });

    expect(mockDb.where).toHaveBeenCalled();
  });

  it('includes scheduled announcements when requested', async () => {
    mockDb.select.mockResolvedValue([]);
    mockDb.count.mockResolvedValue([{ count: 0 }]);

    await getAnnouncements({ userId: 'user-1', includeScheduled: true });

    expect(mockDb.where).toHaveBeenCalled();
  });
});
