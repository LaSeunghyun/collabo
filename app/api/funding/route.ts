import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import {
  FundingStatus,
  PaymentProvider,
  ProjectStatus,
  type Funding
} from '@/types/auth';
import Stripe from 'stripe';

import { prisma } from '@/lib/prisma';
import { createSettlementIfTargetReached } from '@/lib/server/funding-settlement';
import { buildApiError } from '@/lib/server/error-handling';
import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';

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

async function upsertPaymentTransaction(
  tx: Prisma.TransactionClient,
  fundingId: string,
  externalId: string,
  amount: number,
  currency: string,
  rawPayload?: unknown
) {
  await tx.paymentTransaction.upsert({
    where: { fundingId },
    update: {
      provider: PaymentProvider.STRIPE,
      externalId,
      status: FundingStatus.SUCCEEDED,
      amount,
      currency,
      rawPayload: rawPayload as any
    },
    create: {
      fundingId,
      provider: PaymentProvider.STRIPE,
      externalId,
      status: FundingStatus.SUCCEEDED,
      amount,
      currency,
      rawPayload: rawPayload as any
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
  snapshot: unknown;
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
  let sessionUser;
  const authContext = { headers: request.headers };

  try {
    sessionUser = await requireApiUser({}, authContext);
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

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

  const normalisedReceiptEmail =
    typeof receiptEmail === 'string' && receiptEmail.trim().length > 0
      ? receiptEmail.trim()
      : sessionUser.email ?? undefined;

  const normalisedCustomerName =
    typeof customerName === 'string' && customerName.trim().length > 0
      ? customerName.trim()
      : sessionUser.name ?? undefined;

  const baseMetadata: Record<string, string> = { projectId };
  const metadata = normalisedCustomerName
    ? { ...baseMetadata, customerName: normalisedCustomerName }
    : baseMetadata;

  if (!projectId) {
    return buildError('프로젝트 정보가 누락되었습니다.');
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return buildError('해당 프로젝트를 찾을 수 없습니다.', 404);
  }

  if (![ProjectStatus.LIVE, ProjectStatus.EXECUTING].includes(project.status as any)) {
    return buildError('현재 상태에서는 결제를 진행할 수 없습니다.', 409);
  }

  let stripe: Stripe;
  try {
    stripe = createStripeClient();
  } catch (error) {
    return buildError(error instanceof Error ? error.message : 'Stripe 클라이언트를 생성할 수 없습니다.', 500);
  }

  // Verification path
  if (paymentIntentId || checkoutSessionId) {
    try {
      if (paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
          return buildError(`결제 상태가 완료되지 않았습니다 (현재 상태: ${paymentIntent.status})`, 409);
        }

        const amountReceived = ensureIntegerAmount(
          paymentIntent.amount_received ?? paymentIntent.amount
        );
        if (!amountReceived) {
          return buildError('결제 금액을 확인할 수 없습니다.', 422);
        }

        const funding = await recordSuccessfulFunding({
          projectId,
          userId: sessionUser.id,
          amount: amountReceived,
          currency: normaliseCurrency(paymentIntent.currency),
          paymentIntentId: paymentIntent.id,
          snapshot: pickStripeIntentSnapshot(paymentIntent)
        });

        // 정산 자동 생성 로직
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
            warning: '목표 달성 여부 확인 중 정산 생성에 실패했습니다.'
          });
        }
      }

      if (checkoutSessionId) {
        const session = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
          expand: ['payment_intent']
        });

        if (session.payment_status !== 'paid') {
          return buildError(`체크아웃 세션이 완료되지 않았습니다 (현재 상태: ${session.payment_status})`, 409);
        }

        const amountPaid = ensureIntegerAmount(session.amount_total);
        if (!amountPaid) {
          return buildError('결제 금액을 확인할 수 없습니다.', 422);
        }

        const paymentIntentReference =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? session.id;

        const funding = await recordSuccessfulFunding({
          projectId,
          userId: sessionUser.id,
          amount: amountPaid,
          currency: normaliseCurrency(session.currency),
          paymentIntentId: paymentIntentReference,
          snapshot: pickStripeIntentSnapshot(session)
        });

        // 정산 자동 생성 로직
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
            warning: '목표 달성 여부 확인 중 정산 생성에 실패했습니다.'
          });
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '결제 검증 과정에서 오류가 발생했습니다.';
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
                description: `Collab Funding ? ${project.title}`
              }
            }
          }
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: normalisedReceiptEmail,
        metadata
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
      metadata,
      receipt_email: normalisedReceiptEmail,
      description: `Collab Funding ? ${project.title}`
    });

    return NextResponse.json({
      mode: 'payment_intent',
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '결제 요청 처리 중 오류가 발생했습니다.';
    return buildError(message, 500);
  }
}

