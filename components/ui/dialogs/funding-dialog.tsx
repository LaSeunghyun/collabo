'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { X } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';

interface FundingDialogProps {
  projectId: string;
  projectTitle: string;
  defaultAmount?: number;
  minimumAmount?: number;
}

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0
});

type FundingStage = 'details' | 'confirm' | 'success';

export function FundingDialog({
  projectId,
  projectTitle,
  defaultAmount = 10000,
  minimumAmount = 1000
}: FundingDialogProps) {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), [publishableKey]);

  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isLoadingSession = status === 'loading';

  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<FundingStage>('details');
  const [amount, setAmount] = useState(String(defaultAmount));
  const [email, setEmail] = useState(() => session?.user?.email ?? '');
  const [customerName, setCustomerName] = useState(() => session?.user?.name ?? '');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requiresAuth, setRequiresAuth] = useState(false);

  useEffect(() => {
    const sessionEmail = session?.user?.email;
    if (sessionEmail) {
      setEmail((current) => current || sessionEmail);
    }

    const sessionName = session?.user?.name;
    if (sessionName) {
      setCustomerName((current) => current || sessionName);
    }
  }, [session]);

  useEffect(() => {
    if (!open) {
      setStage('details');
      setClientSecret(null);
      setErrorMessage(null);
      setStatusMessage(null);
      setAmount(String(defaultAmount));
      setEmail(session?.user?.email ?? '');
      setCustomerName(session?.user?.name ?? '');
      setRequiresAuth(false);
    }
  }, [open, defaultAmount, session]);

  const normalizedAmount = Number.parseInt(amount, 10) || 0;
  const amountIsValid = normalizedAmount >= minimumAmount;

  const handleSignIn = () => {
    const callbackUrl = typeof window !== 'undefined' ? window.location.href : undefined;
    if (callbackUrl) {
      void signIn(undefined, { callbackUrl });
    } else {
      void signIn();
    }
  };

  const handleDetailsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publishableKey) {
      setErrorMessage('Stripe 공개 키가 설정되어 있지 않습니다. 환경 변수를 확인해주세요.');
      return;
    }

    if (!amountIsValid) {
      setErrorMessage(`최소 후원 금액은 ${currencyFormatter.format(minimumAmount)} 입니다.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          amount: normalizedAmount,
          mode: 'payment_intent',
          currency: 'krw',
          receiptEmail: email,
          customerName
        })
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setRequiresAuth(true);
          setErrorMessage('후원을 진행하려면 로그인이 필요합니다.');
          return;
        }

        throw new Error(data.error ?? '결제 준비 중 문제가 발생했습니다.');
      }

      if (!data.clientSecret) {
        throw new Error('결제 정보를 가져오지 못했습니다.');
      }

      setRequiresAuth(false);
      setClientSecret(data.clientSecret as string);
      setStage('confirm');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '결제 준비에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async (paymentIntentId: string) => {
    const response = await fetch('/api/funding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        paymentIntentId,
        receiptEmail: email,
        customerName
      })
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
      }

      throw new Error(data.error ?? '결제 검증에 실패했습니다.');
    }

    setStatusMessage('후원이 완료되었습니다. 감사합니다!');
    setStage('success');
  };

  const disabled = !publishableKey;

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
        onClick={() => {
          if (!disabled && !isLoadingSession) {
            handleSignIn();
          }
        }}
        disabled={disabled || isLoadingSession}
      >
        {isLoadingSession
          ? '로그인 상태 확인 중...'
          : disabled
            ? 'Stripe 키 미설정'
            : '로그인 후 후원하기'}
      </button>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          disabled={disabled}
        >
          {disabled ? 'Stripe 키 미설정' : '후원하기'}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 mx-auto flex max-h-[90vh] max-w-lg flex-col gap-6 overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/95 p-6 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold text-white">{projectTitle}</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-white/60">
                안전한 Stripe 결제로 실시간 후원하세요.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white">
              <X size={16} />
            </Dialog.Close>
          </div>

          {!publishableKey ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Stripe 공개 키가 설정되어 있지 않아 결제를 진행할 수 없습니다. <br />
              <span className="text-white">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</span> 환경 변수를 추가한 뒤 다시
              시도해주세요.
            </div>
          ) : stage === 'details' ? (
            <form className="space-y-5" onSubmit={handleDetailsSubmit}>
              {requiresAuth ? (
                <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-xs text-amber-200">
                  <p className="font-medium text-amber-100">로그인이 필요한 작업입니다.</p>
                  <p className="mt-1 text-amber-200/80">보안을 위해 다시 로그인한 뒤 결제를 진행해주세요.</p>
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center justify-center rounded-full bg-amber-400 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-900 transition hover:bg-amber-300"
                    onClick={handleSignIn}
                  >
                    로그인하러 가기
                  </button>
                </div>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="funding-name" className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
                  후원자 이름
                </label>
                <input
                  id="funding-name"
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="팬 네임 또는 회사명"
                  className="w-full rounded-2xl border border-white/10 bg-neutral-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="funding-email" className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
                  영수증 이메일
                </label>
                <input
                  id="funding-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-neutral-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="funding-amount" className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
                  후원 금액 (KRW)
                </label>
                <input
                  id="funding-amount"
                  type="number"
                  min={minimumAmount}
                  step={1000}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-neutral-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                />
                <p className="text-xs text-white/60">
                  최소 {currencyFormatter.format(minimumAmount)} · 입력 금액은 Stripe 원화 결제로 즉시 청구됩니다.
                </p>
              </div>

              {errorMessage ? <p className="text-xs text-red-400">{errorMessage}</p> : null}

              <button
                type="submit"
                className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
                disabled={isSubmitting}
              >
                {isSubmitting ? '결제 정보를 준비 중...' : `${currencyFormatter.format(normalizedAmount)} 결제하기`}
              </button>
            </form>
          ) : stage === 'confirm' ? (
            clientSecret && stripePromise ? (
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: { theme: 'night' }, locale: 'ko' }}
                key={clientSecret}
              >
                <ConfirmPaymentStep
                  amount={normalizedAmount}
                  onBack={() => setStage('details')}
                  onFinalize={handleFinalize}
                />
              </Elements>
            ) : null
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                ✓
              </div>
              <div>
                <p className="text-lg font-semibold text-white">후원 완료</p>
                <p className="mt-1 text-sm text-white/70">
                  {statusMessage ?? '결제가 정상적으로 승인되었습니다.'}
                </p>
              </div>
              <Dialog.Close asChild>
                <button className="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:border-primary hover:text-primary">
                  닫기
                </button>
              </Dialog.Close>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface ConfirmPaymentStepProps {
  amount: number;
  onBack: () => void;
  onFinalize: (paymentIntentId: string) => Promise<void>;
}

function ConfirmPaymentStep({ amount, onBack, onFinalize }: ConfirmPaymentStepProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required'
    });

    if (result.error) {
      setError(result.error.message ?? '결제에 실패했습니다.');
      setIsProcessing(false);
      return;
    }

    const paymentIntent = result.paymentIntent;
    if (!paymentIntent) {
      setError('결제 정보를 확인할 수 없습니다. 다시 시도해주세요.');
      setIsProcessing(false);
      return;
    }

    try {
      await onFinalize(paymentIntent.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : '결제 검증에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">카드 정보</p>
        <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
          <PaymentElement options={{ layout: 'tabs' }} />
        </div>
      </div>

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      <div className="mt-auto flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-full border border-white/20 px-4 py-3 text-sm text-white transition hover:border-primary hover:text-primary"
          disabled={isProcessing}
        >
          금액 수정
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
          disabled={isProcessing || !stripe || !elements}
        >
          {isProcessing ? '결제 확인 중...' : `${currencyFormatter.format(amount)} 결제 확정`}
        </button>
      </div>
    </div>
  );
}
