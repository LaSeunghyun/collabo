import type { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { jsonError } from '@/lib/api/responses';
import { withPrisma } from '@/lib/api/withPrisma';

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

async function resolveUserId({
  receiptEmail,
  customerName,
  stripeEmailFallback,
  prisma
}: {
  receiptEmail?: string;
  customerName?: string;
  stripeEmailFallback?: string;
  prisma: PrismaClient;
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

async function recordFunding({
  projectId,
  userId,
  amount,
  paymentReference,
  prisma
}: {
  projectId: string;
  userId: string;
  amount: number;
  paymentReference: string;
  prisma: PrismaClient;
}) {
  const existing = await prisma.funding.findUnique({ where: { paymentReference } });
  if (existing) {
    return existing;
  }

  const funding = await prisma.$transaction(async (tx) => {
    const created = await tx.funding.create({
      data: {
        projectId,
        userId,
        amount,
        paymentReference
      }
    });

    await tx.project.update({
      where: { id: projectId },
      data: {
        currentAmount: {
          increment: amount
        }
      }
    });

    return created;
  });

  return funding;
}

export const POST = withPrisma(async ({ request, prisma }) => {
  let payload: FundingRequestPayload;

  try {
    payload = await request.json();
  } catch {
    return jsonError('요청 본문을 확인할 수 없습니다.');
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
    return jsonError('프로젝트 정보가 누락되었습니다.');
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return jsonError('해당 프로젝트를 찾을 수 없습니다.', 404);
  }

  let stripe: Stripe;
  try {
    stripe = createStripeClient();
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Stripe 구성이 잘못되었습니다.', 500);
  }

  // Verification path
  if (paymentIntentId || checkoutSessionId) {
    try {
      if (paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
          return jsonError(
            `결제 상태가 완료되지 않았습니다. (현재 상태: ${paymentIntent.status})`,
            409
          );
        }

        const amountReceived = paymentIntent.amount_received ?? paymentIntent.amount ?? 0;
        if (!amountReceived) {
          return jsonError('결제 금액을 확인할 수 없습니다.', 422);
        }

        const userId = await resolveUserId({
          receiptEmail,
          customerName,
          stripeEmailFallback:
            paymentIntent.receipt_email ?? paymentIntent.charges.data[0]?.billing_details.email ?? undefined,
          prisma
        });

        const funding = await recordFunding({
          projectId,
          userId,
          amount: amountReceived,
          paymentReference: paymentIntent.id,
          prisma
        });

        return NextResponse.json({
          status: 'recorded',
          funding
        });
      }

      if (checkoutSessionId) {
        const session = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
          expand: ['payment_intent']
        });

        if (session.payment_status !== 'paid') {
          return jsonError(
            `체크아웃이 완료되지 않았습니다. (현재 상태: ${session.payment_status})`,
            409
          );
        }

        const amountPaid = session.amount_total;
        if (!amountPaid) {
          return jsonError('결제 금액을 확인할 수 없습니다.', 422);
        }

        const paymentIntentReference =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? session.id;

        const userId = await resolveUserId({
          receiptEmail,
          customerName,
          stripeEmailFallback:
            session.customer_details?.email ?? session.customer_email ?? undefined,
          prisma
        });

        const funding = await recordFunding({
          projectId,
          userId,
          amount: amountPaid,
          paymentReference: paymentIntentReference,
          prisma
        });

        return NextResponse.json({
          status: 'recorded',
          funding
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('구매자 이메일')) {
        return jsonError(error.message, 422);
      }

      const message =
        error instanceof Error ? error.message : '결제 검증 중 오류가 발생했습니다.';
      return jsonError(message, 500);
    }
  }

  // Creation path
  if (!amount || Number.isNaN(amount) || amount <= 0) {
    return jsonError('결제 금액이 올바르지 않습니다.');
  }

  try {
    if (mode === 'checkout') {
      if (!successUrl || !cancelUrl) {
        return jsonError('Checkout 세션에는 성공 및 취소 URL이 필요합니다.');
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: amount,
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
      amount,
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
    return jsonError(message, 500);
  }
});
