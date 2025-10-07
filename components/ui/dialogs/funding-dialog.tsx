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
      setErrorMessage('Stripe ê³µê°œ ?¤ê? ?¤ì •?˜ì–´ ?ˆì? ?ŠìŠµ?ˆë‹¤. ?˜ê²½ ë³€?˜ë? ?•ì¸?´ì£¼?¸ìš”.');
      return;
    }

    if (!amountIsValid) {
      setErrorMessage(`ìµœì†Œ ?„ì› ê¸ˆì•¡?€ ${currencyFormatter.format(minimumAmount)} ?…ë‹ˆ??`);
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
          setErrorMessage('?„ì›??ì§„í–‰?˜ë ¤ë©?ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??');
          return;
        }

        throw new Error(data.error ?? 'ê²°ì œ ì¤€ë¹?ì¤?ë¬¸ì œê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
      }

      if (!data.clientSecret) {
        throw new Error('ê²°ì œ ?•ë³´ë¥?ê°€?¸ì˜¤ì§€ ëª»í–ˆ?µë‹ˆ??');
      }

      setRequiresAuth(false);
      setClientSecret(data.clientSecret as string);
      setStage('confirm');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'ê²°ì œ ì¤€ë¹„ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.');
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
        throw new Error('ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ?? ?¤ì‹œ ë¡œê·¸?¸í•´ì£¼ì„¸??');
      }

      throw new Error(data.error ?? 'ê²°ì œ ê²€ì¦ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    }

    setStatusMessage('?„ì›???„ë£Œ?˜ì—ˆ?µë‹ˆ?? ê°ì‚¬?©ë‹ˆ??');
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
          ? 'ë¡œê·¸???íƒœ ?•ì¸ ì¤?..'
          : disabled
            ? 'Stripe ??ë¯¸ì„¤??
            : 'ë¡œê·¸?????„ì›?˜ê¸°'}
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
          {disabled ? 'Stripe ??ë¯¸ì„¤?? : '?„ì›?˜ê¸°'}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 mx-auto flex max-h-[90vh] max-w-lg flex-col gap-6 overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/95 p-6 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold text-white">{projectTitle}</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-white/60">
                ?ˆì „??Stripe ê²°ì œë¡??¤ì‹œê°??„ì›?˜ì„¸??
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white">
              <X size={16} />
            </Dialog.Close>
          </div>

          {!publishableKey ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Stripe ê³µê°œ ?¤ê? ?¤ì •?˜ì–´ ?ˆì? ?Šì•„ ê²°ì œë¥?ì§„í–‰?????†ìŠµ?ˆë‹¤. <br />
              <span className="text-white">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</span> ?˜ê²½ ë³€?˜ë? ì¶”ê??????¤ì‹œ
              ?œë„?´ì£¼?¸ìš”.
            </div>
          ) : stage === 'details' ? (
            <form className="space-y-5" onSubmit={handleDetailsSubmit}>
              {requiresAuth ? (
                <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-xs text-amber-200">
                  <p className="font-medium text-amber-100">ë¡œê·¸?¸ì´ ?„ìš”???‘ì—…?…ë‹ˆ??</p>
                  <p className="mt-1 text-amber-200/80">ë³´ì•ˆ???„í•´ ?¤ì‹œ ë¡œê·¸?¸í•œ ??ê²°ì œë¥?ì§„í–‰?´ì£¼?¸ìš”.</p>
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center justify-center rounded-full bg-amber-400 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-900 transition hover:bg-amber-300"
                    onClick={handleSignIn}
                  >
                    ë¡œê·¸?¸í•˜??ê°€ê¸?
                  </button>
                </div>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="funding-name" className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
                  ?„ì›???´ë¦„
                </label>
                <input
                  id="funding-name"
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="???¤ì„ ?ëŠ” ?Œì‚¬ëª?
                  className="w-full rounded-2xl border border-white/10 bg-neutral-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="funding-email" className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
                  ?ìˆ˜ì¦??´ë©”??
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
                  ?„ì› ê¸ˆì•¡ (KRW)
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
                  ìµœì†Œ {currencyFormatter.format(minimumAmount)} Â· ?…ë ¥ ê¸ˆì•¡?€ Stripe ?í™” ê²°ì œë¡?ì¦‰ì‹œ ì²?µ¬?©ë‹ˆ??
                </p>
              </div>

              {errorMessage ? <p className="text-xs text-red-400">{errorMessage}</p> : null}

              <button
                type="submit"
                className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'ê²°ì œ ?•ë³´ë¥?ì¤€ë¹?ì¤?..' : `${currencyFormatter.format(normalizedAmount)} ê²°ì œ?˜ê¸°`}
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
                ??
              </div>
              <div>
                <p className="text-lg font-semibold text-white">?„ì› ?„ë£Œ</p>
                <p className="mt-1 text-sm text-white/70">
                  {statusMessage ?? 'ê²°ì œê°€ ?•ìƒ?ìœ¼ë¡??¹ì¸?˜ì—ˆ?µë‹ˆ??'}
                </p>
              </div>
              <Dialog.Close asChild>
                <button className="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:border-primary hover:text-primary">
                  ?«ê¸°
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
      setError(result.error.message ?? 'ê²°ì œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
      setIsProcessing(false);
      return;
    }

    const paymentIntent = result.paymentIntent;
    if (!paymentIntent) {
      setError('ê²°ì œ ?•ë³´ë¥??•ì¸?????†ìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.');
      setIsProcessing(false);
      return;
    }

    try {
      await onFinalize(paymentIntent.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ê²°ì œ ê²€ì¦ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">ì¹´ë“œ ?•ë³´</p>
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
          ê¸ˆì•¡ ?˜ì •
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
          disabled={isProcessing || !stripe || !elements}
        >
          {isProcessing ? 'ê²°ì œ ?•ì¸ ì¤?..' : `${currencyFormatter.format(amount)} ê²°ì œ ?•ì •`}
        </button>
      </div>
    </div>
  );
}
