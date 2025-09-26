import { NextRequest, NextResponse } from 'next/server';
import {
  FundingStatus,
  PaymentProvider,
  ProjectStatus,
  type Prisma,
  type Funding
} from '@prisma/client';
import Stripe from 'stripe';

import prisma from '@/lib/prisma';
import { createSettlementIfTargetReached, safeUpdateFundingData } from '@/lib/server/funding-settlement';
import { buildApiError, handleFundingSettlementError, withErrorHandling } from '@/lib/server/error-handling';

interface FundingCreatePayload {
  projectId: string;
  amount?: number;
  mode?: 'payment_intent' | 'checkout';
  currency?: string;
  receiptEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  customerName?: string;
}

interface FundingVerifyPayload {
  projectId: string;
  paymentIntentId?: string;
  checkoutSessionId?: string;
  receiptEmail?: string;
  customerName?: string;
}

type FundingRequestPayload = FundingCreatePayload & FundingVerifyPayload;

const stripeApiVersion: Stripe.LatestApiVersion = '2024-06-20';

function createStripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error('Stripe secret key is not configured.');
  }

  return new Stripe(secret, { apiVersion: stripeApiVersion });
}

function buildError(message: string, status = 400) {
  return buildApiError(message, status);
}

function normaliseCurrency(currency?: string | null) {
  if (!currency) {
    return 'KRW';
  }

  return currency.toUpperCase();
}

function ensureIntegerAmount(amount?: number | null) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return null;
  }

  const rounded = Math.round(amount);
  if (rounded <= 0) {
    return null;
  }

  return rounded;
}

function pickStripeIntentSnapshot(intent: Stripe.PaymentIntent | Stripe.Checkout.Session) {
  if ('object' in intent && intent.object === 'payment_intent') {
    const paymentIntent = intent as Stripe.PaymentIntent;
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      amountReceived: paymentIntent.amount_received,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata ?? {}
    };
  }

  const session = intent as Stripe.Checkout.Session;
  return {
    id: session.id,
    status: session.payment_status,
    amount: session.amount_total,
    currency: session.currency,
    metadata: session.metadata ?? {}
  };
}

function normaliseCurrency(currency?: string | null) {
  if (!currency) {
    return 'KRW';
  }

  return currency.toUpperCase();
}

function ensureIntegerAmount(amount?: number | null) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return null;
  }

  const rounded = Math.round(amount);
  if (rounded <= 0) {
    return null;
  }

  return rounded;
}

function pickStripeIntentSnapshot(
  intent: Stripe.PaymentIntent | Stripe.Checkout.Session
): Prisma.InputJsonValue {
  if ('object' in intent && intent.object === 'payment_intent') {
    const paymentIntent = intent as Stripe.PaymentIntent;
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      amountReceived: paymentIntent.amount_received,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata ?? {}
    };
  }

  const session = intent as Stripe.Checkout.Session;
  return {
    id: session.id,
    status: session.payment_status,
    amount: session.amount_total,
    currency: session.currency,
    metadata: session.metadata ?? {}
  };
}

async function resolveUserId({
  receiptEmail,
  customerName,
  stripeEmailFallback
}: {
  receiptEmail?: string;
  customerName?: string;
  stripeEmailFallback?: string;
}) {
  const email = receiptEmail ?? stripeEmailFallback;
  if (!email) {
    throw new Error('구매자 이메일 정보를 확인할 수 없습니다.');
  }

  const safeEmail = email.toLowerCase();
  const nameFromEmail = safeEmail.split('@')[0] ?? 'Guest';
  const name = customerName?.trim() || nameFromEmail || 'Guest';

  const user = await prisma.user.upsert({
    where: { email: safeEmail },
    update: { name },
    create: { email: safeEmail, name }
  });

  return user.id;
}

async function upsertPaymentTransaction(
  tx: Prisma.TransactionClient,
  fundingId: string,
  externalId: string,
  amount: number,
  currency: string,
<<<<<<< HEAD
  rawPayload?: unknown
=======
  rawPayload?: Prisma.InputJsonValue
>>>>>>> codex/design-feature-level-logic-for-platform-c52td5
) {
  await tx.paymentTransaction.upsert({
    where: { fundingId },
    update: {
      provider: PaymentProvider.STRIPE,
      externalId,
      status: FundingStatus.SUCCEEDED,
      amount,
      currency,
<<<<<<< HEAD
      rawPayload: rawPayload as any
=======
      rawPayload
>>>>>>> codex/design-feature-level-logic-for-platform-c52td5
    },
    create: {
      fundingId,
      provider: PaymentProvider.STRIPE,
      externalId,
      status: FundingStatus.SUCCEEDED,
      amount,
      currency,
<<<<<<< HEAD
      rawPayload: rawPayload as any
=======
      rawPayload
>>>>>>> codex/design-feature-level-logic-for-platform-c52td5
    }
  });
}

async function recordSuccessfulFunding({
  projectId,
  userId,
  amount,
  currency,
  paymentIntentId,
  snapshot
}: {
  projectId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
<<<<<<< HEAD
  snapshot: unknown;
=======
  snapshot: Prisma.InputJsonValue;
>>>>>>> codex/design-feature-level-logic-for-platform-c52td5
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.funding.findUnique({
      where: { paymentIntentId },
      include: { transaction: true }
    });

    if (existing) {
      const needsUpdate =
        existing.paymentStatus !== FundingStatus.SUCCEEDED ||
        existing.amount !== amount ||
        existing.currency !== currency;

      let funding: Funding;

      if (needsUpdate) {
        const delta = amount - existing.amount;
        funding = await tx.funding.update({
          where: { id: existing.id },
          data: {
            amount,
            currency,
            paymentStatus: FundingStatus.SUCCEEDED
          },
          include: { transaction: true }
        });

        if (delta !== 0) {
          await tx.project.update({
            where: { id: projectId },
            data: { currentAmount: { increment: delta } }
          });
        }
      } else {
        funding = existing;
      }

      await upsertPaymentTransaction(
        tx,
        funding.id,
        paymentIntentId,
        amount,
        currency,
        snapshot
      );

      return (
        await tx.funding.findUnique({
          where: { id: funding.id },
          include: { transaction: true }
        })
      )!;
    }

    const funding = await tx.funding.create({
      data: {
        projectId,
        userId,
        amount,
        currency,
        paymentIntentId,
        paymentStatus: FundingStatus.SUCCEEDED
      },
      include: { transaction: true }
    });

    await tx.project.update({
      where: { id: projectId },
      data: { currentAmount: { increment: amount } }
    });

    await upsertPaymentTransaction(
      tx,
      funding.id,
      paymentIntentId,
      amount,
      currency,
      snapshot
    );

    return (
      await tx.funding.findUnique({
        where: { id: funding.id },
        include: { transaction: true }
      })
    )!;
  });
}

export async function POST(request: NextRequest) {
  let payload: FundingRequestPayload;

  try {
    payload = await request.json();
  } catch {
    return buildError('요청 본문을 확인할 수 없습니다.');
  }

  const {
    projectId,
    amount,
    mode = 'payment_intent',
    currency = 'krw',
    receiptEmail,
    paymentIntentId,
    checkoutSessionId,
    successUrl,
    cancelUrl,
    customerName
  } = payload;

  if (!projectId) {
    return buildError('프로젝트 정보가 누락되었습니다.');
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return buildError('해당 프로젝트를 찾을 수 없습니다.', 404);
  }

<<<<<<< HEAD
  if (![ProjectStatus.LIVE, ProjectStatus.EXECUTING].includes(project.status as any)) {
=======
  const fundingEligibleStatuses = new Set<ProjectStatus>([
    ProjectStatus.LIVE,
    ProjectStatus.EXECUTING
  ]);

  if (!fundingEligibleStatuses.has(project.status)) {
>>>>>>> codex/design-feature-level-logic-for-platform-c52td5
    return buildError('현재 상태에서는 결제를 진행할 수 없습니다.', 409);
  }

  let stripe: Stripe;
  try {
    stripe = createStripeClient();
  } catch (error) {
    return buildError(error instanceof Error ? error.message : 'Stripe 구성이 잘못되었습니다.', 500);
  }

  // Verification path
  if (paymentIntentId || checkoutSessionId) {
    try {
      if (paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
          expand: ['latest_charge']
        });

        if (paymentIntent.status !== 'succeeded') {
          return buildError(`결제 상태가 완료되지 않았습니다. (현재 상태: ${paymentIntent.status})`, 409);
        }

        const amountReceived = ensureIntegerAmount(
          paymentIntent.amount_received ?? paymentIntent.amount
        );
        if (!amountReceived) {
          return buildError('결제 금액을 확인할 수 없습니다.', 422);
        }

        const userId = await resolveUserId({
          receiptEmail,
          customerName,
          stripeEmailFallback:
<<<<<<< HEAD
            paymentIntent.receipt_email ?? undefined
=======
            paymentIntent.receipt_email ??
            (typeof paymentIntent.latest_charge !== 'string'
              ? paymentIntent.latest_charge?.billing_details?.email ?? undefined
              : undefined)
>>>>>>> codex/design-feature-level-logic-for-platform-c52td5
        });

        const funding = await recordSuccessfulFunding({
          projectId,
          userId,
          amount: amountReceived,
          currency: normaliseCurrency(paymentIntent.currency),
          paymentIntentId: paymentIntent.id,
          snapshot: pickStripeIntentSnapshot(paymentIntent)
        });

        // 정산 자동 생성 시도
        try {
          const settlement = await createSettlementIfTargetReached(projectId);
          return NextResponse.json({
            status: 'recorded',
            funding,
            settlement: settlement ? { id: settlement.id, status: settlement.payoutStatus } : null
          });
        } catch (settlementError) {
          console.warn('정산 자동 생성 실패:', settlementError);
          return NextResponse.json({
            status: 'recorded',
            funding,
            settlement: null,
            warning: '펀딩은 성공했지만 정산 생성에 실패했습니다.'
          });
        }
      }

      if (checkoutSessionId) {
        const session = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
          expand: ['payment_intent']
        });

        if (session.payment_status !== 'paid') {
          return buildError(`체크아웃이 완료되지 않았습니다. (현재 상태: ${session.payment_status})`, 409);
        }

        const amountPaid = ensureIntegerAmount(session.amount_total);
        if (!amountPaid) {
          return buildError('결제 금액을 확인할 수 없습니다.', 422);
        }

        const paymentIntentReference =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? session.id;

        const userId = await resolveUserId({
          receiptEmail,
          customerName,
          stripeEmailFallback:
            session.customer_details?.email ?? session.customer_email ?? undefined
        });

        const funding = await recordSuccessfulFunding({
          projectId,
          userId,
          amount: amountPaid,
          currency: normaliseCurrency(session.currency),
          paymentIntentId: paymentIntentReference,
          snapshot: pickStripeIntentSnapshot(session)
        });

        // 정산 자동 생성 시도
        try {
          const settlement = await createSettlementIfTargetReached(projectId);
          return NextResponse.json({
            status: 'recorded',
            funding,
            settlement: settlement ? { id: settlement.id, status: settlement.payoutStatus } : null
          });
        } catch (settlementError) {
          console.warn('정산 자동 생성 실패:', settlementError);
          return NextResponse.json({
            status: 'recorded',
            funding,
            settlement: null,
            warning: '펀딩은 성공했지만 정산 생성에 실패했습니다.'
          });
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('구매자 이메일')) {
        return buildError(error.message, 422);
      }

      const message =
        error instanceof Error ? error.message : '결제 검증 중 오류가 발생했습니다.';
      return buildError(message, 500);
    }
  }

  const normalisedAmount = ensureIntegerAmount(amount);
  if (!normalisedAmount) {
    return buildError('결제 금액이 올바르지 않습니다.');
  }

  try {
    if (mode === 'checkout') {
      if (!successUrl || !cancelUrl) {
        return buildError('Checkout 세션에는 성공 및 취소 URL이 필요합니다.');
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: normalisedAmount,
              product_data: {
                name: project.title,
                description: `Collab Funding – ${project.title}`
              }
            }
          }
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: receiptEmail,
        metadata: {
          projectId
        }
      });

      return NextResponse.json({
        mode: 'checkout',
        checkoutSessionId: session.id,
        url: session.url
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: normalisedAmount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { projectId },
      receipt_email: receiptEmail,
      description: `Collab Funding – ${project.title}`
    });

    return NextResponse.json({
      mode: 'payment_intent',
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '결제 요청 처리에 실패했습니다.';
    return buildError(message, 500);
  }
}
