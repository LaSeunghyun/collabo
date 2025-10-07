import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn()
}));

import { ProjectUpdatesBoard } from '@/components/ui/sections/project-updates-board';
import { initI18n } from '@/lib/i18n';
import { useSession } from 'next-auth/react';

describe('ProjectUpdatesBoard', () => {
  const originalFetch = global.fetch;

  const baseUpdate = {
    id: 'update-1',
    title: '???�식',
    content: '?�데?�트 ?�용',
    visibility: 'SUPPORTERS',
    attachments: [],
    milestone: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    likes: 0,
    comments: 0,
    liked: false,
    author: { id: 'author-1', name: '?�스??, avatarUrl: null },
    canEdit: true
  };

  const createWrapper = (client: QueryClient, canManageUpdates: boolean) => {
    const i18n = initI18n();

    return (
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <ProjectUpdatesBoard projectId="project-1" canManageUpdates={canManageUpdates} />
        </QueryClientProvider>
      </I18nextProvider>
    );
  };

  const renderBoard = (canManageUpdates: boolean) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    const view = render(createWrapper(queryClient, canManageUpdates));

    return { queryClient, ...view };
  };

  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });
    (global.fetch as unknown) = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();

      if (url === '/api/projects/project-1/updates' && (!init || init.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: async () => [baseUpdate]
        } as unknown as Response);
      }

      if (url === '/api/projects/project-1/updates/update-1' && init?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Deleted' })
        } as unknown as Response);
      }

      throw new Error(`Unhandled fetch: ${url}`);
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch as typeof fetch;
    jest.clearAllMocks();
  });

  it('hides the composer button when the viewer cannot manage updates', async () => {
    renderBoard(false);

    await screen.findByText('???�식');
    expect(screen.queryByText('???�데?�트 ?�성')).not.toBeInTheDocument();
  });

  it('shows the composer button and supporter badge for project owners', async () => {
    renderBoard(true);

    await screen.findByText('???�식');
    expect(screen.getByText('???�데?�트 ?�성')).toBeInTheDocument();
    expect(screen.getByText('?�원???�용')).toBeInTheDocument();
  });

  it('optimistically removes updates when delete is triggered', async () => {
    let resolveDelete: ((value: Response) => void) | undefined;
    const deletePromise = new Promise<Response>((resolve) => {
      resolveDelete = resolve;
    });

    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();

      if (url === '/api/projects/project-1/updates' && (!init || init.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: async () => [baseUpdate]
        } as unknown as Response);
      }

      if (url === '/api/projects/project-1/updates/update-1' && init?.method === 'DELETE') {
        return deletePromise;
      }

      throw new Error(`Unhandled fetch: ${url}`);
    });

    renderBoard(true);

    await screen.findByText('???�식');

    const deleteButton = await screen.findByRole('button', { name: /??��/ });
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => expect(screen.queryByText('???�식')).not.toBeInTheDocument());

    await act(async () => {
      resolveDelete?.({
        ok: true,
        json: async () => ({ message: 'Deleted' })
      } as unknown as Response);
      await deletePromise;
    });

    await waitFor(() =>
      expect(
        (global.fetch as jest.Mock).mock.calls.filter(([, init]) => init?.method === 'DELETE')
      ).toHaveLength(1)
    );
  });
});
