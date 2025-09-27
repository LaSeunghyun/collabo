import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn()
}));

import { CommunityBoard } from '@/components/ui/sections/community-board';
import { initI18n } from '@/lib/i18n';
import { useSession } from 'next-auth/react';

describe('CommunityBoard comment permissions', () => {
  const originalFetch = global.fetch;
  const mockUseSession = useSession as unknown as jest.Mock;

  const mockPosts = [
    {
      id: 'post-1',
      title: '테스트 게시글',
      content: '게시글 내용',
      likes: 0,
      comments: 0,
      liked: false
    }
  ];
  const mockComments: any[] = [];

  const createFetchMock = () =>
    jest.fn((input: RequestInfo | URL) => {
      const isRequestObject = typeof Request !== 'undefined' && input instanceof Request;
      const url = typeof input === 'string' ? input : isRequestObject ? input.url : input.toString();
      const postsEndpoint = '/api/community?';
      const commentsEndpoint = `/api/community/${mockPosts[0].id}/comments`;

      if (url.includes(postsEndpoint)) {
        return Promise.resolve(
          new Response(JSON.stringify(mockPosts), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        );
      }

      if (url.includes(commentsEndpoint)) {
        return Promise.resolve(
          new Response(JSON.stringify(mockComments), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        );
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

  const renderComponent = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    queryClient.setQueryData(['community', { projectId: null, sort: 'recent' }], mockPosts);
    queryClient.setQueryData(['community', 'comments', mockPosts[0].id], mockComments);
    const i18n = initI18n();

    return render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <CommunityBoard />
        </QueryClientProvider>
      </I18nextProvider>
    );
  };

  beforeEach(() => {
    const fetchMock = createFetchMock();
    (global.fetch as any) = fetchMock;
    mockUseSession.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch as typeof fetch;
    jest.clearAllMocks();
  });

  it('disables the comment form and shows a login prompt for guests', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    renderComponent();

    await screen.findByText('테스트 게시글');
    const textarea = await screen.findByPlaceholderText('댓글을 입력하세요');
    expect(textarea).toBeDisabled();
    expect(screen.getByText('로그인 후 댓글을 남길 수 있습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('enables the comment form for authenticated users', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: '홍길동'
        }
      },
      status: 'authenticated'
    });

    renderComponent();

    await screen.findByText('테스트 게시글');
    const textarea = await screen.findByPlaceholderText('댓글을 입력하세요');
    expect(textarea).not.toBeDisabled();
    expect(screen.getByText('홍길동 님으로 댓글이 작성됩니다.')).toBeInTheDocument();
    expect(screen.queryByText('로그인 후 댓글을 남길 수 있습니다.')).not.toBeInTheDocument();
  });
});
