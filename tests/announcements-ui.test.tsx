import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => {
  return ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>;
});

jest.mock('@/lib/server/announcements', () => ({
  getAnnouncements: jest.fn()
}));

jest.mock('@/lib/auth/session', () => ({
  getServerAuthSession: jest.fn()
}));

jest.mock('@/hooks/use-announcement-read', () => ({
  useMarkAnnouncementRead: jest.fn(() => ({ mutate: jest.fn() })),
  useAnnouncementUnreadCount: jest.fn(() => ({ data: 0 }))
}));

import AnnouncementsPage from '@/app/announcements/page';
import { AnnouncementReadTracker } from '@/app/announcements/[id]/read-tracker';

const { getAnnouncements } = jest.requireMock('@/lib/server/announcements');
const { getServerAuthSession } = jest.requireMock('@/lib/auth/session');
const { useMarkAnnouncementRead } = jest.requireMock('@/hooks/use-announcement-read');

describe('Announcements UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getServerAuthSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('renders pinned announcements with NEW badges', async () => {
    getAnnouncements.mockResolvedValue({
      announcements: [
        {
          id: 'announcement-1',
          title: '중요 공지',
          content: '테스트 본문',
          category: 'platform',
          isPinned: true,
          publishedAt: new Date().toISOString(),
          author: { id: 'admin-1', name: '관리자', avatarUrl: null },
          isRead: false,
          isNew: true
        },
        {
          id: 'announcement-2',
          title: '일반 공지',
          content: '다른 공지',
          category: 'event',
          isPinned: false,
          publishedAt: new Date().toISOString(),
          author: { id: 'admin-1', name: '관리자', avatarUrl: null },
          isRead: true,
          isNew: false
        }
      ],
      unreadCount: 1
    });

    const jsx = await AnnouncementsPage({ searchParams: {} });
    const { container } = render(jsx);

    const titles = Array.from(container.querySelectorAll('h2')).map((element) => element.textContent);
    expect(titles[0]).toContain('중요 공지');

    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('marks announcements as read when tracker runs', () => {
    const mutate = jest.fn();
    useMarkAnnouncementRead.mockReturnValueOnce({ mutate });

    render(<AnnouncementReadTracker announcementId="announcement-1" canAcknowledge isAlreadyRead={false} />);

    expect(mutate).toHaveBeenCalledWith('announcement-1');
  });

  it('does not mark announcements as read for guests', () => {
    const mutate = jest.fn();
    useMarkAnnouncementRead.mockReturnValueOnce({ mutate });

    render(<AnnouncementReadTracker announcementId="announcement-1" canAcknowledge={false} isAlreadyRead={false} />);

    expect(mutate).not.toHaveBeenCalled();
  });
});
