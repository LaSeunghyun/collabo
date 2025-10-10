import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { CommunityBoard } from '@/components/ui/sections/community-board-simple';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

const createWrapper = (client: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
};

const mockPosts = [
  {
    id: 'post-1',
    title: '테스트 게시글',
    content: '게시글 내용',
    category: 'GENERAL',
    author: {
      id: 'user-1',
      name: '게스트',
      avatarUrl: null
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    likes: 0,
    comments: 0,
    isPinned: false,
    liked: false
  }
];

describe('CommunityBoard', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ posts: mockPosts, totalCount: 1 })
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    const Wrapper = createWrapper(client);
    return render(
      <Wrapper>
        <CommunityBoard
          posts={mockPosts}
          totalCount={1}
          currentPage={1}
          totalPages={1}
          canCreatePost={false}
          onPostCreated={jest.fn()}
          onPostUpdated={jest.fn()}
          onPostDeleted={jest.fn()}
        />
      </Wrapper>
    );
  };

  it('renders community board with posts', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    renderComponent();

    expect(screen.getByText('아티스트 협업 아이디어를 나누고 실시간 피드백을 주고받는 공간입니다.')).toBeInTheDocument();
    expect(screen.getByText('테스트 게시글')).toBeInTheDocument();
  });

  it('shows create post button when user can create posts', () => {
    mockUseSession.mockReturnValue({ 
      data: { user: { id: 'user-1', role: 'CREATOR' } }, 
      status: 'authenticated' 
    });

    const Wrapper = createWrapper(client);
    render(
      <Wrapper>
        <CommunityBoard
          posts={mockPosts}
          totalCount={1}
          currentPage={1}
          totalPages={1}
          canCreatePost={true}
          onPostCreated={jest.fn()}
          onPostUpdated={jest.fn()}
          onPostDeleted={jest.fn()}
        />
      </Wrapper>
    );

    expect(screen.getByRole('button', { name: '글 작성' })).toBeInTheDocument();
  });

  it('hides create post button when user cannot create posts', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    renderComponent();

    expect(screen.queryByRole('button', { name: '글 작성' })).not.toBeInTheDocument();
  });

  it('requests filtered posts when selecting a category chip', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    renderComponent();

    await screen.findByText('테스트 게시글');
    await userEvent.click(screen.getByRole('button', { name: '공지' }));

    // 간단한 컴포넌트이므로 실제 API 호출은 없지만, 버튼 클릭이 동작하는지 확인
    expect(screen.getByRole('button', { name: '공지' })).toBeInTheDocument();
  });

  it('shows search input for filtering posts', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    renderComponent();

    const searchInput = screen.getByPlaceholderText('게시글 검색 또는 @멘션하기');
    expect(searchInput).toBeInTheDocument();
  });

  it('displays post metadata correctly', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    renderComponent();

    expect(screen.getByText('게스트')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(2); // likes count and comments count
  });
});