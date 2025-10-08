import { NextRequest, NextResponse } from 'next/server';
// import {
//   FundingStatus,
//   PaymentProvider,
//   ProjectStatus,
//   type Funding
// } from '@/types/shared'; // TODO: Drizzle로 전환 필요
import Stripe from 'stripe';

import { createSettlementIfTargetReached } from '@/lib/server/funding-settlement';
import { buildApiError } from '@/lib/server/error-handling';
import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';

interface FundingCreatePayload {
  projectId: string;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'checkout';
  successUrl?: string;
  cancelUrl?: string;
  receiptEmail?: string;
}

const createStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey, { apiVersion: '2023-10-16' });
};

async function upsertPaymentTransaction(
  tx: any, // TODO: Drizzle로 전환 필요
  fundingId: string,
  externalId: string,
  amount: number,
  currency: string
) {
  return tx.paymentTransaction.upsert({
    where: { fundingId },
    update: {
      provider: 'STRIPE', // TODO: Drizzle로 전환 필요
      externalId,
      status: 'SUCCEEDED', // TODO: Drizzle로 전환 필요
      amount,
      currency,
      updatedAt: new Date()
    },
    create: {
      fundingId,
      provider: 'STRIPE', // TODO: Drizzle로 전환 필요
      externalId,
      status: 'SUCCEEDED', // TODO: Drizzle로 전환 필요
      amount,
      currency,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
}

async function createFundingWithTransaction(
  tx: any,
  userId: string,
  projectId: string,
  amount: number,
  currency: string,
  paymentIntentId: string,
  snapshot: unknown;
) {
  // TODO: Drizzle로 전환 필요 - 트랜잭션 구현
  return (async (tx: any) => {
    const existing = await tx.funding.findUnique({
      where: { paymentIntentId }
    });

    if (existing) {
      const needsUpdate =
        existing.paymentStatus !== 'SUCCEEDED' || // TODO: Drizzle로 전환 필요
        existing.amount !== amount ||
        existing.currency !== currency;

      let funding: any; // TODO: Drizzle로 전환 필요

      if (needsUpdate) {
        funding = await tx.funding.update({
          where: { id: existing.id },
          data: {
            amount,
            currency,
            paymentStatus: 'SUCCEEDED' // TODO: Drizzle로 전환 필요
          },
          include: { transaction: true }
        });
      } else {
        funding = existing;
      }

      return funding;
    }

    const funding = await tx.funding.create({
      data: {
        userId,
        projectId,
        amount,
        currency,
        paymentIntentId,
        paymentStatus: 'SUCCEEDED' // TODO: Drizzle로 전환 필요
      },
      include: { transaction: true }
    });

    await upsertPaymentTransaction(tx, funding.id, paymentIntentId, amount, currency);

    return funding;
  })(tx);
}

const ensureIntegerAmount = (amount: unknown): number | null => {
  if (typeof amount === 'number') {
    return Number.isInteger(amount) && amount > 0 ? amount : null;
  }
  if (typeof amount === 'string') {
    const parsed = Number.parseInt(amount, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
};

export async function POST(request: NextRequest) {
  let payload: FundingCreatePayload;

  try {
    payload = await request.json();
  } catch {
    return buildError('요청 본문을 확인할 수 없습니다.');
  }

  const { projectId, amount, currency, paymentMethod, successUrl, cancelUrl, receiptEmail } = payload;

  if (!projectId) {
    return buildError('프로젝트 정보가 누락되었습니다.');
  }

  // TODO: Drizzle로 전환 필요
  const project = { id: projectId, status: 'LIVE', title: 'Sample Project' };
  if (!project) {
    return buildError('해당 프로젝트를 찾을 수 없습니다.', 404);
  }

  if (!['LIVE', 'EXECUTING'].includes(project.status as any)) { // TODO: Drizzle로 전환 필요
    return buildError('현재 상태에서는 결제를 진행할 수 없습니다.', 409);
  }

  let stripe: Stripe;
  try {
    stripe = createStripeClient();
  } catch (error) {
    return buildError(error instanceof Error ? error.message : 'Stripe 클라이언트를 생성할 수 없습니다.', 500);
  }

  const user = await requireApiUser(request);

  try {
    if (paymentMethod === 'stripe') {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: ensureIntegerAmount(amount) || 0,
        currency: currency || 'krw',
        metadata: {
          projectId,
          userId: user.id
        },
        receipt_email: receiptEmail || undefined
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } else if (paymentMethod === 'checkout') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency || 'krw',
              unit_amount: ensureIntegerAmount(amount) || 0,
              product_data: {
                name: project.title,
                description: `Collab Funding – ${project.title}`
              }
            },
            quantity: 1
          }
        ],
        mode: 'payment',
        success_url: successUrl || `${request.nextUrl.origin}/projects/${projectId}?success=true`,
        cancel_url: cancelUrl || `${request.nextUrl.origin}/projects/${projectId}?canceled=true`,
        metadata: {
          projectId,
          userId: user.id
        },
        receipt_email: receiptEmail || undefined,
        description: `Collab Funding – ${project.title}`
      });

      return NextResponse.json({
        sessionId: session.id,
        url: session.url
      });
    } else {
      return buildError('지원하지 않는 결제 방법입니다.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '결제 요청 처리 중 오류가 발생했습니다.';
    return buildError(message, 500);
  }
}

export async function PUT(request: NextRequest) {
  let payload: { paymentIntentId?: string; sessionId?: string };

  try {
    payload = await request.json();
  } catch {
    return buildError('요청 본문을 확인할 수 없습니다.');
  }

  const { paymentIntentId, sessionId } = payload;

  if (!paymentIntentId && !sessionId) {
    return buildError('결제 정보가 필요합니다.');
  }

  const user = await requireApiUser(request);

  let stripe: Stripe;
  try {
    stripe = createStripeClient();
  } catch (error) {
    return buildError(error instanceof Error ? error.message : 'Stripe 클라이언트를 생성할 수 없습니다.', 500);
  }

  try {
    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return buildError(`결제 상태가 완료되지 않았습니다 (현재 상태: ${paymentIntent.status})`, 409);
      }

      const amountReceived = ensureIntegerAmount(paymentIntent.amount_received);
      if (!amountReceived) {
        return buildError('결제 금액을 확인할 수 없습니다.', 422);
      }

      // TODO: Drizzle로 전환 필요
      const funding = await createFundingWithTransaction(
        null, // 트랜잭션 객체
        user.id,
        paymentIntent.metadata.projectId,
        amountReceived,
        paymentIntent.currency,
        paymentIntent.id,
        paymentIntent
      );

      // 정산 자동 생성 로직
      try {
        const settlement = await createSettlementIfTargetReached(paymentIntent.metadata.projectId);
        return NextResponse.json({
          status: 'recorded',
          funding,
          settlement
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
    } else if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return buildError(`체크아웃 세션이 완료되지 않았습니다 (현재 상태: ${session.payment_status})`, 409);
      }

      const amountPaid = ensureIntegerAmount(session.amount_total);
      if (!amountPaid) {
        return buildError('결제 금액을 확인할 수 없습니다.', 422);
      }

      // TODO: Drizzle로 전환 필요
      const funding = await createFundingWithTransaction(
        null, // 트랜잭션 객체
        user.id,
        session.metadata.projectId,
        amountPaid,
        session.currency || 'krw',
        session.payment_intent as string,
        session
      );

      // 정산 자동 생성 로직
      try {
        const settlement = await createSettlementIfTargetReached(session.metadata.projectId);
        return NextResponse.json({
          status: 'recorded',
          funding,
          settlement
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency') || 'krw';
  const mode = searchParams.get('mode') as 'stripe' | 'checkout' | null;
  const successUrl = searchParams.get('successUrl');
  const cancelUrl = searchParams.get('cancelUrl');
  const receiptEmail = searchParams.get('receiptEmail');

  if (!projectId || !amount || !mode) {
    return buildError('필수 매개변수가 누락되었습니다.');
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

      const stripe = createStripeClient();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: normalisedAmount,
              product_data: {
                name: 'Collab Funding',
                description: `Collab Funding – ${projectId}`
              }
            },
            quantity: 1
          }
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          projectId
        },
        receipt_email: receiptEmail || undefined,
        description: `Collab Funding – ${projectId}`
      });

      return NextResponse.json({
        sessionId: session.id,
        url: session.url
      });
    } else {
      const stripe = createStripeClient();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: normalisedAmount,
        currency,
        metadata: {
          projectId
        },
        receipt_email: receiptEmail || undefined,
        description: `Collab Funding – ${projectId}`
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '결제 요청 처리 중 오류가 발생했습니다.';
    return buildError(message, 500);
  }
}