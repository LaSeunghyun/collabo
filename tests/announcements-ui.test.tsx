import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AnnouncementsPage from '@/app/announcements/page';

// Mock the hooks
jest.mock('@/hooks/use-announcement-read', () => ({
  useAnnouncementRead: () => ({
    markAsRead: jest.fn()
  })
}));

// Mock React hooks
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn()
}));

const createWrapper = (client: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
};

const mockAnnouncements = [
  {
    id: 'announcement-1',
    title: '테스트 공지',
    content: '테스트 본문',
    type: 'notice' as const,
    priority: 'high' as const,
    isActive: true,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'announcement-2',
    title: '일반 공지',
    content: '다른 공지',
    type: 'update' as const,
    priority: 'normal' as const,
    isActive: true,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

describe('AnnouncementsPage', () => {
  let client: QueryClient;
  let mockSetState: jest.Mock;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    mockSetState = jest.fn();
    (React.useState as jest.Mock).mockImplementation((initial) => [initial, mockSetState]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders announcements list', () => {
    const Wrapper = createWrapper(client);
    
    render(
      <Wrapper>
        <AnnouncementsPage
          announcements={mockAnnouncements}
          totalCount={2}
          currentPage={1}
          totalPages={1}
          unreadCount={1}
        />
      </Wrapper>
    );

    expect(screen.getByRole('heading', { name: '공지사항' })).toBeInTheDocument();
    expect(screen.getByText('테스트 공지')).toBeInTheDocument();
    expect(screen.getByText('일반 공지')).toBeInTheDocument();
  });

  it('shows unread count when there are unread announcements', () => {
    const Wrapper = createWrapper(client);
    
    render(
      <Wrapper>
        <AnnouncementsPage
          announcements={mockAnnouncements}
          totalCount={2}
          currentPage={1}
          totalPages={1}
          unreadCount={1}
        />
      </Wrapper>
    );

    expect(screen.getByText('읽지 않은 공지 1개')).toBeInTheDocument();
  });

  it('shows all read message when no unread announcements', () => {
    const Wrapper = createWrapper(client);
    
    render(
      <Wrapper>
        <AnnouncementsPage
          announcements={mockAnnouncements}
          totalCount={2}
          currentPage={1}
          totalPages={1}
          unreadCount={0}
        />
      </Wrapper>
    );

    expect(screen.getByText('모든 공지를 읽었습니다')).toBeInTheDocument();
  });

  it('renders filter buttons', () => {
    const Wrapper = createWrapper(client);
    
    render(
      <Wrapper>
        <AnnouncementsPage
          announcements={mockAnnouncements}
          totalCount={2}
          currentPage={1}
          totalPages={1}
          unreadCount={1}
        />
      </Wrapper>
    );

    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '공지사항' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '업데이트' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이벤트' })).toBeInTheDocument();
  });

  it('shows empty state when no announcements', () => {
    const Wrapper = createWrapper(client);
    
    render(
      <Wrapper>
        <AnnouncementsPage
          announcements={[]}
          totalCount={0}
          currentPage={1}
          totalPages={1}
          unreadCount={0}
        />
      </Wrapper>
    );

    expect(screen.getByText('공지사항이 없습니다')).toBeInTheDocument();
  });
});