import { DEFAULT_ANNOUNCEMENT_CATEGORY } from '@/lib/constants/announcements';
import { createAnnouncement, getAnnouncements } from '@/lib/server/announcements';

describe('announcement domain service', () => {
  it('returns empty list in mock implementation', async () => {
    const result = await getAnnouncements({ userId: 'user-1' });

    expect(result).toEqual({ announcements: [], unreadCount: 0 });
  });

  it('normalises category and publishedAt when creating announcements', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-03-01T00:00:00Z').getTime());

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
});
