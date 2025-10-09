import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';

import { createSettlementIfTargetReached } from '@/lib/server/funding-settlement';
import { buildApiError } from '@/lib/server/error-handling';
import { requireApiUser } from '@/lib/auth/guards';
import { getDbClient } from '@/lib/db/client';
import { fundings, paymentTransactions, projects } from '@/lib/db/schema';
import { FundingStatus, PaymentProvider } from '@/types/shared';

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
  return new Stripe(secretKey, { apiVersion: '2024-06-20' });
};

async function upsertPaymentTransaction(
  db: any,
  fundingId: string,
  externalId: string,
  amount: number,
  currency: string
) {
  // 기존 트랜잭션 확인
  const existing = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.fundingId, fundingId))
    .limit(1);

  if (existing.length > 0) {
    // 업데이트
    return await db
      .update(paymentTransactions)
      .set({
        provider: PaymentProvider.STRIPE,
        externalId,
        status: FundingStatus.SUCCEEDED,
        amount,
        currency,
        updatedAt: new Date().toISOString()
      })
      .where(eq(paymentTransactions.fundingId, fundingId))
      .returning();
  } else {
    // 생성
    return await db
      .insert(paymentTransactions)
      .values({
        id: crypto.randomUUID(),
        fundingId,
        provider: PaymentProvider.STRIPE,
        externalId,
        status: FundingStatus.SUCCEEDED,
        amount,
        currency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();
  }
}

async function createFundingWithTransaction(
  db: any,
  userId: string,
  projectId: string,
  amount: number,
  currency: string,
  paymentIntentId: string
) {
  return await db.transaction(async (tx: any) => {
    // 기존 펀딩 확인
    const existing = await tx
      .select()
      .from(fundings)
      .where(eq(fundings.paymentIntentId, paymentIntentId))
      .limit(1);

    if (existing.length > 0) {
      const existingFunding = existing[0];
      const needsUpdate =
        existingFunding.paymentStatus !== FundingStatus.SUCCEEDED ||
        existingFunding.amount !== amount ||
        existingFunding.currency !== currency;

      if (needsUpdate) {
        const updatedFunding = await tx
          .update(fundings)
          .set({
            amount,
            currency,
            paymentStatus: FundingStatus.SUCCEEDED,
            updatedAt: new Date().toISOString()
          })
          .where(eq(fundings.id, existingFunding.id))
          .returning();

        // 트랜잭션 정보도 함께 조회
        const transaction = await tx
          .select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.fundingId, existingFunding.id))
          .limit(1);

        return {
          ...updatedFunding[0],
          transaction: transaction[0] || null
        };
      } else {
        // 트랜잭션 정보도 함께 조회
        const transaction = await tx
          .select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.fundingId, existingFunding.id))
          .limit(1);

        return {
          ...existingFunding,
          transaction: transaction[0] || null
        };
      }
    }

    // 새 펀딩 생성
    const newFunding = await tx
      .insert(fundings)
      .values({
        id: crypto.randomUUID(),
        userId,
        projectId,
        amount,
        currency,
        paymentIntentId,
        paymentStatus: FundingStatus.SUCCEEDED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    // 결제 트랜잭션 생성
    await upsertPaymentTransaction(tx, newFunding[0].id, paymentIntentId, amount, currency);

    // 트랜잭션 정보도 함께 조회
    const transaction = await tx
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.fundingId, newFunding[0].id))
      .limit(1);

    return {
      ...newFunding[0],
      transaction: transaction[0] || null
    };
  });
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
    return buildApiError('요청 본문을 확인할 수 없습니다.');
  }

  const { projectId, amount, currency, paymentMethod, successUrl, cancelUrl, receiptEmail } = payload;

  if (!projectId) {
    return buildApiError('프로젝트 정보가 누락되었습니다.');
  }

  const user = await requireApiUser({}, { headers: request.headers });

  // 프로젝트 조회
  const db = await getDbClient();
  const projectResult = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (projectResult.length === 0) {
    return buildApiError('해당 프로젝트를 찾을 수 없습니다.', 404);
  }

  const project = projectResult[0];
  if (!project || !['LIVE', 'EXECUTING'].includes(project.status)) {
    return buildApiError('현재 상태에서는 결제를 진행할 수 없습니다.', 409);
  }

  let stripe: Stripe;
  try {
    stripe = createStripeClient();
  } catch (error) {
    return buildApiError(error instanceof Error ? error.message : 'Stripe 클라이언트를 생성할 수 없습니다.', 500);
  }

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
        customer_email: receiptEmail || undefined
      });

      return NextResponse.json({
        sessionId: session.id,
        url: session.url
      });
    } else {
      return buildApiError('지원하지 않는 결제 방법입니다.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '결제 요청 처리 중 오류가 발생했습니다.';
    return buildApiError(message, 500);
  }
}

export async function PUT(request: NextRequest) {
  let payload: { paymentIntentId?: string; sessionId?: string };

  try {
    payload = await request.json();
  } catch {
    return buildApiError('요청 본문을 확인할 수 없습니다.');
  }

  const { paymentIntentId, sessionId } = payload;

  if (!paymentIntentId && !sessionId) {
    return buildApiError('결제 정보가 필요합니다.');
  }

  const user = await requireApiUser({}, { headers: request.headers });

  let stripe: Stripe;
  try {
    stripe = createStripeClient();
  } catch (error) {
    return buildApiError(error instanceof Error ? error.message : 'Stripe 클라이언트를 생성할 수 없습니다.', 500);
  }

  try {
    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return buildApiError(`결제 상태가 완료되지 않았습니다 (현재 상태: ${paymentIntent.status})`, 409);
      }

      const amountReceived = ensureIntegerAmount(paymentIntent.amount_received);
      if (!amountReceived) {
        return buildApiError('결제 금액을 확인할 수 없습니다.', 422);
      }

      // 펀딩 생성
      const db = await getDbClient();
      const funding = await createFundingWithTransaction(
        db,
        user.id,
        paymentIntent.metadata.projectId,
        amountReceived,
        paymentIntent.currency,
        paymentIntent.id
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
        return buildApiError(`체크아웃 세션이 완료되지 않았습니다 (현재 상태: ${session.payment_status})`, 409);
      }

      const amountPaid = ensureIntegerAmount(session.amount_total);
      if (!amountPaid) {
        return buildApiError('결제 금액을 확인할 수 없습니다.', 422);
      }

      // 펀딩 생성
      const db = await getDbClient();
      const funding = await createFundingWithTransaction(
        db,
        user.id,
        session.metadata?.projectId || '',
        amountPaid,
        session.currency || 'krw',
        session.payment_intent as string
      );

      // 정산 자동 생성 로직
      try {
        const settlement = await createSettlementIfTargetReached(session.metadata?.projectId || '');
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
    return buildApiError(message, 500);
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
    return buildApiError('필수 매개변수가 누락되었습니다.');
  }

  const normalisedAmount = ensureIntegerAmount(amount);
  if (!normalisedAmount) {
    return buildApiError('결제 금액이 올바르지 않습니다.');
  }

  try {
    if (mode === 'checkout') {
      if (!successUrl || !cancelUrl) {
        return buildApiError('Checkout 세션에는 성공 및 취소 URL이 필요합니다.');
      }

      const stripe = createStripeClient();
      const session = await stripe.checkout.sessions.create({
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
        customer_email: receiptEmail || undefined
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
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '결제 요청 처리 중 오류가 발생했습니다.';
    return buildApiError(message, 500);
  }
}