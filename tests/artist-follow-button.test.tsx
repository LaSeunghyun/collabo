import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import { FollowButton } from '@/components/artists/follow-button';
import { initI18n } from '@/lib/i18n';

jest.mock('next-auth/react', () => ({
  signIn: jest.fn()
}));

const { signIn } = jest.requireMock('next-auth/react');

describe('FollowButton', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    (signIn as jest.Mock).mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch as typeof fetch;
  });

  const renderComponent = (props: React.ComponentProps<typeof FollowButton>) => {
    const i18n = initI18n();
    return render(
      <I18nextProvider i18n={i18n}>
        <FollowButton {...props} />
      </I18nextProvider>
    );
  };

  it('calls the follow API and toggles state', async () => {
    const callback = jest.fn();
    const mockFetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      const responseBody =
        method === 'POST'
          ? { followerCount: 5, isFollowing: true }
          : { followerCount: 4, isFollowing: false };
      return Promise.resolve({
        ok: true,
        json: async () => responseBody
      } as Response);
    });
    global.fetch = mockFetch as typeof fetch;

    renderComponent({ artistId: 'artist-1', initialIsFollowing: false, isAuthenticated: true, onFollowerChange: callback });

    const button = screen.getByRole('button', { name: '팔로우' });
    fireEvent.click(button);

    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
    expect(button).toHaveTextContent('팔로잉');
    expect(callback).toHaveBeenCalledWith(5);

    fireEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'));
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith(4);
  });

  it('prompts sign in when unauthenticated', async () => {
    renderComponent({ artistId: 'artist-1', initialIsFollowing: false, isAuthenticated: false });
    const button = screen.getByRole('button', { name: '팔로우' });
    fireEvent.click(button);
    await waitFor(() => expect(signIn).toHaveBeenCalled());
  });
});
