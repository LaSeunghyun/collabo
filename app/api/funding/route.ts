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
  // ê¸°ì¡´ ?¸ëœ??…˜ ?•ì¸
  const existing = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.fundingId, fundingId))
    .limit(1);

  if (existing.length > 0) {
    // ?…ë°?´íŠ¸
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
    // ?ì„±
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
    // ê¸°ì¡´ ?€???•ì¸
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

        // ?¸ëœ??…˜ ?•ë³´???¨ê»˜ ì¡°íšŒ
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
        // ?¸ëœ??…˜ ?•ë³´???¨ê»˜ ì¡°íšŒ
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

    // ???€???ì„±
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

    // ê²°ì œ ?¸ëœ??…˜ ?ì„±
    await upsertPaymentTransaction(tx, newFunding[0].id, paymentIntentId, amount, currency);

    // ?¸ëœ??…˜ ?•ë³´???¨ê»˜ ì¡°íšŒ
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
    return buildApiError('?”ì²­ ë³¸ë¬¸???•ì¸?????†ìŠµ?ˆë‹¤.');
  }

  const { projectId, amount, currency, paymentMethod, successUrl, cancelUrl, receiptEmail } = payload;

  if (!projectId) {
    return buildApiError('?„ë¡œ?íŠ¸ ?•ë³´ê°€ ?„ë½?˜ì—ˆ?µë‹ˆ??');
  }

  const user = await requireApiUser({}, { headers: request.headers });

  // ?„ë¡œ?íŠ¸ ì¡°íšŒ
  const db = await getDbClient();
  const projectResult = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (projectResult.length === 0) {
    return buildApiError('?´ë‹¹ ?„ë¡œ?íŠ¸ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.', 404);
  }

  const project = projectResult[0];
  if (!project || !['LIVE', 'EXECUTING'].includes(project.status)) {
    return buildApiError('?„ì¬ ?íƒœ?ì„œ??ê²°ì œë¥?ì§„í–‰?????†ìŠµ?ˆë‹¤.', 409);
  }

  let stripe: Stripe;
  try {
    stripe = createStripeClient();
  } catch (error) {
    return buildApiError(error instanceof Error ? error.message : 'Stripe ?´ë¼?´ì–¸?¸ë? ?ì„±?????†ìŠµ?ˆë‹¤.', 500);
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
                description: `Collab Funding ??${project.title}`
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
      return buildApiError('ì§€?í•˜ì§€ ?ŠëŠ” ê²°ì œ ë°©ë²•?…ë‹ˆ??');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ê²°ì œ ?”ì²­ ì²˜ë¦¬ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.';
    return buildApiError(message, 500);
  }
}

export async function PUT(request: NextRequest) {
  let payload: { paymentIntentId?: string; sessionId?: string };

  try {
    payload = await request.json();
  } catch {
    return buildApiError('?”ì²­ ë³¸ë¬¸???•ì¸?????†ìŠµ?ˆë‹¤.');
  }

  const { paymentIntentId, sessionId } = payload;

  if (!paymentIntentId && !sessionId) {
    return buildApiError('ê²°ì œ ?•ë³´ê°€ ?„ìš”?©ë‹ˆ??');
  }

  const user = await requireApiUser({}, { headers: request.headers });

  let stripe: Stripe;
  try {
    stripe = createStripeClient();
  } catch (error) {
    return buildApiError(error instanceof Error ? error.message : 'Stripe ?´ë¼?´ì–¸?¸ë? ?ì„±?????†ìŠµ?ˆë‹¤.', 500);
  }

  try {
    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return buildApiError(`ê²°ì œ ?íƒœê°€ ?„ë£Œ?˜ì? ?Šì•˜?µë‹ˆ??(?„ì¬ ?íƒœ: ${paymentIntent.status})`, 409);
      }

      const amountReceived = ensureIntegerAmount(paymentIntent.amount_received);
      if (!amountReceived) {
        return buildApiError('ê²°ì œ ê¸ˆì•¡???•ì¸?????†ìŠµ?ˆë‹¤.', 422);
      }

      // ?€???ì„±
      const db = await getDbClient();
      const funding = await createFundingWithTransaction(
        db,
        user.id,
        paymentIntent.metadata.projectId,
        amountReceived,
        paymentIntent.currency,
        paymentIntent.id
      );

      // ?•ì‚° ?ë™ ?ì„± ë¡œì§
      try {
        const settlement = await createSettlementIfTargetReached(paymentIntent.metadata.projectId);
        return NextResponse.json({
          status: 'recorded',
          funding,
          settlement
        });
      } catch (settlementError) {
        console.warn('?•ì‚° ?ë™ ?ì„± ?¤íŒ¨:', settlementError);
        return NextResponse.json({
          status: 'recorded',
          funding,
          settlement: null,
          warning: 'ëª©í‘œ ?¬ì„± ?¬ë? ?•ì¸ ì¤??•ì‚° ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.'
        });
      }
    } else if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return buildApiError(`ì²´í¬?„ì›ƒ ?¸ì…˜???„ë£Œ?˜ì? ?Šì•˜?µë‹ˆ??(?„ì¬ ?íƒœ: ${session.payment_status})`, 409);
      }

      const amountPaid = ensureIntegerAmount(session.amount_total);
      if (!amountPaid) {
        return buildApiError('ê²°ì œ ê¸ˆì•¡???•ì¸?????†ìŠµ?ˆë‹¤.', 422);
      }

      // ?€???ì„±
      const db = await getDbClient();
      const funding = await createFundingWithTransaction(
        db,
        user.id,
        session.metadata?.projectId || '',
        amountPaid,
        session.currency || 'krw',
        session.payment_intent as string
      );

      // ?•ì‚° ?ë™ ?ì„± ë¡œì§
      try {
        const settlement = await createSettlementIfTargetReached(session.metadata?.projectId || '');
        return NextResponse.json({
          status: 'recorded',
          funding,
          settlement
        });
      } catch (settlementError) {
        console.warn('?•ì‚° ?ë™ ?ì„± ?¤íŒ¨:', settlementError);
        return NextResponse.json({
          status: 'recorded',
          funding,
          settlement: null,
          warning: 'ëª©í‘œ ?¬ì„± ?¬ë? ?•ì¸ ì¤??•ì‚° ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.'
        });
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'ê²°ì œ ê²€ì¦?ê³¼ì •?ì„œ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.';
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
    return buildApiError('?„ìˆ˜ ë§¤ê°œë³€?˜ê? ?„ë½?˜ì—ˆ?µë‹ˆ??');
  }

  const normalisedAmount = ensureIntegerAmount(amount);
  if (!normalisedAmount) {
    return buildApiError('ê²°ì œ ê¸ˆì•¡???¬ë°”ë¥´ì? ?ŠìŠµ?ˆë‹¤.');
  }

  try {
    if (mode === 'checkout') {
      if (!successUrl || !cancelUrl) {
        return buildApiError('Checkout ?¸ì…˜?ëŠ” ?±ê³µ ë°?ì·¨ì†Œ URL???„ìš”?©ë‹ˆ??');
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
                description: `Collab Funding ??${projectId}`
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
    const message = error instanceof Error ? error.message : 'ê²°ì œ ?”ì²­ ì²˜ë¦¬ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.';
    return buildApiError(message, 500);
  }
}
