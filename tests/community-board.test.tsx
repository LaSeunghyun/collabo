import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn()
}));

import { CommunityBoard } from '@/components/ui/sections/community-board';
import { initI18n } from '@/lib/i18n';
import { useSession } from 'next-auth/react';

describe('CommunityBoard interactions', () => {
  const originalFetch = global.fetch;
  const mockUseSession = useSession as unknown as jest.Mock;

  const mockFeedResponse = {
    posts: [
      {
        id: 'post-1',
        title: '테스트 게시글',
        content: '게시글 내용',
        likes: 0,
        comments: 0,
        liked: false,
        category: 'general',
        isPinned: false,
        isTrending: false
      }
    ],
    pinned: [],
    popular: [],
    meta: {
      nextCursor: null,
      total: 1,
      sort: 'recent',
      category: null,
      search: null
    }
  };
  const mockComments: unknown[] = [];

  const jsonResponse = <T,>(payload: T) =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => payload
    } as Response);

  const createFetchMock = () =>
    jest.fn((input: RequestInfo | URL) => {
      const isRequestObject = typeof Request !== 'undefined' && input instanceof Request;
      const url = typeof input === 'string' ? input : isRequestObject ? input.url : input.toString();
      const postsEndpoint = '/api/community?';
      const commentsEndpoint = `/api/community/${mockFeedResponse.posts[0].id}/comments`;

      if (url.includes(postsEndpoint)) {
        return jsonResponse(mockFeedResponse);
      }

      if (url.includes(commentsEndpoint)) {
        return jsonResponse(mockComments);
      }

      if (url.includes('/api/users/search')) {
        return jsonResponse([]);
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
    const i18n = initI18n();

    return render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <CommunityBoard />
        </QueryClientProvider>
      </I18nextProvider>
    );
  };

  beforeAll(() => {
    class MockIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    Object.defineProperty(global, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: MockIntersectionObserver
    });
  });

  beforeEach(() => {
    const fetchMock = createFetchMock();
    (global.fetch as any) = fetchMock;
    mockUseSession.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch as typeof fetch;
    jest.clearAllMocks();
  });

  it('renders without a comment textarea for guests', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    renderComponent();

    await screen.findByText('테스트 게시글');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('renders without a comment textarea for authenticated users', async () => {
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
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('requests filtered posts when selecting a category chip', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    renderComponent();

    await screen.findByText('테스트 게시글');
    await userEvent.click(screen.getByRole('button', { name: '공지' }));

    await waitFor(() => {
      expect((global.fetch as jest.Mock).mock.calls.some(([request]) => {
        const url = typeof request === 'string' ? request : request instanceof Request ? request.url : '';
        return url.includes('/api/community?') && url.includes('category=notice');
      })).toBe(true);
    });
  });
});
