import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { FundingDialog } from '@/components/ui/dialogs/funding-dialog';
import { signIn, useSession } from 'next-auth/react';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn()
}));

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn().mockResolvedValue({})
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => null,
  useElements: () => ({})
}));

describe('FundingDialog', () => {
  const originalLocation = window.location;
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
  const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

  beforeAll(() => {
    delete (window as unknown as { location?: Location }).location;
    (window as unknown as { location: { href: string } }).location = { href: 'http://localhost/test' };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
  });

  it('prompts users to sign in when unauthenticated', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as any);

    render(
      <FundingDialog projectId="project-1" projectTitle="프로젝트" />
    );

    const button = screen.getByRole('button', { name: '로그인 후 후원하기' });
    fireEvent.click(button);

    expect(mockSignIn).toHaveBeenCalledWith(undefined, { callbackUrl: 'http://localhost/test' });
  });

  it('prefills session data and surfaces auth guidance on 401', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'user@example.com', name: 'Test User' } },
      status: 'authenticated'
    } as any);

    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: '인증이 필요합니다.' })
    } as any);
    // @ts-expect-error - override fetch for test scenario
    global.fetch = fetchMock;

    try {
      render(
        <FundingDialog projectId="project-1" projectTitle="프로젝트" />
      );

      const trigger = screen.getByRole('button', { name: '후원하기' });
      fireEvent.click(trigger);

      const emailInput = await screen.findByLabelText('영수증 이메일');
      expect((emailInput as HTMLInputElement).value).toBe('user@example.com');

      const submitButton = screen.getByRole('button', { name: /결제하기/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('후원을 진행하려면 로그인이 필요합니다.')).toBeInTheDocument();
      });

      const signInButton = screen.getByRole('button', { name: '로그인하러 가기' });
      fireEvent.click(signInButton);
      expect(mockSignIn).toHaveBeenLastCalledWith(undefined, { callbackUrl: 'http://localhost/test' });

      expect(fetchMock).toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
