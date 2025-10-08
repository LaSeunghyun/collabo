import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { and, count, desc, eq } from 'drizzle-orm';

import {
  paymentTransactions,
  fundings,
  paymentProviderEnum,
  fundingStatusEnum,
} from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';
import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as string | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // 조건부 ?�터�?
    const conditions = [eq(fundings.userId, user.id)];
    if (provider && Object.values(paymentProviderEnum.enumValues).includes(provider as any)) {
      conditions.push(eq(paymentTransactions.provider, provider as any));
    }

    // 결제 ?�역 조회
    const paymentsList = await db
      .select({
        id: paymentTransactions.id,
        fundingId: paymentTransactions.fundingId,
        provider: paymentTransactions.provider,
        externalId: paymentTransactions.externalId,
        status: paymentTransactions.status,
        amount: paymentTransactions.amount,
        currency: paymentTransactions.currency,
        gatewayFee: paymentTransactions.gatewayFee,
        rawPayload: paymentTransactions.rawPayload,
        metadata: paymentTransactions.metadata,
        createdAt: paymentTransactions.createdAt,
        updatedAt: paymentTransactions.updatedAt,
        funding: {
          id: fundings.id,
          projectId: fundings.projectId,
          amount: fundings.amount,
          paymentStatus: fundings.paymentStatus
        }
      })
      .from(paymentTransactions)
      .innerJoin(fundings, eq(paymentTransactions.fundingId, fundings.id))
      .where(and(...conditions))
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    // ?�체 개수 조회
    const totalResult = await db
      .select({ count: count() })
      .from(paymentTransactions)
      .innerJoin(fundings, eq(paymentTransactions.fundingId, fundings.id))
      .where(and(...conditions));
    
    const total = totalResult[0]?.count || 0;

    return NextResponse.json({
      payments: paymentsList,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return NextResponse.json(
      { message: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDb();
    const body = await request.json();
    const { fundingId, provider, externalId, amount } = body;

    if (!fundingId || !provider || !externalId || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const providerValue = provider.toUpperCase();
    if (!paymentProviderEnum.enumValues.includes(providerValue as typeof paymentProviderEnum.enumValues[number])) {
      return NextResponse.json(
        { message: 'Invalid payment provider' },
        { status: 400 }
      );
    }

    const normalizedAmount = typeof amount === 'string' ? Number.parseInt(amount, 10) : Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return NextResponse.json(
        { message: 'Invalid payment amount' },
        { status: 400 }
      );
    }

    const [funding] = await db
      .select({
        id: fundings.id,
        userId: fundings.userId,
        projectId: fundings.projectId,
        amount: fundings.amount,
        currency: fundings.currency,
        paymentStatus: fundings.paymentStatus,
      })
      .from(fundings)
      .where(eq(fundings.id, fundingId))
      .limit(1);

    if (!funding || funding.userId !== user.id) {
      return NextResponse.json(
        { message: 'Funding not found or unauthorized' },
        { status: 404 }
      );
    }

    const [existingPayment] = await db
      .select({ id: paymentTransactions.id })
      .from(paymentTransactions)
      .where(eq(paymentTransactions.fundingId, fundingId))
      .limit(1);

    if (existingPayment) {
      return NextResponse.json(
        { message: 'Payment already exists for this funding' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const pendingStatus = 'PENDING' as (typeof fundingStatusEnum.enumValues)[number];
    const [createdPayment] = await db
      .insert(paymentTransactions)
      .values({
        id: randomUUID(),
        fundingId,
        provider: providerValue as typeof paymentProviderEnum.enumValues[number],
        externalId,
        amount: normalizedAmount,
        status: pendingStatus,
        currency: funding.currency,
        gatewayFee: 0,
        updatedAt: now,
      })
      .returning({ id: paymentTransactions.id });

    await db
      .update(fundings)
      .set({ paymentStatus: pendingStatus, updatedAt: now })
      .where(eq(fundings.id, fundingId));

    const [payment] = await db
      .select({
        id: paymentTransactions.id,
        fundingId: paymentTransactions.fundingId,
        provider: paymentTransactions.provider,
        externalId: paymentTransactions.externalId,
        status: paymentTransactions.status,
        amount: paymentTransactions.amount,
        currency: paymentTransactions.currency,
        gatewayFee: paymentTransactions.gatewayFee,
        rawPayload: paymentTransactions.rawPayload,
        metadata: paymentTransactions.metadata,
        createdAt: paymentTransactions.createdAt,
        updatedAt: paymentTransactions.updatedAt,
        funding: {
          id: fundings.id,
          projectId: fundings.projectId,
          amount: fundings.amount,
          paymentStatus: fundings.paymentStatus,
        },
      })
      .from(paymentTransactions)
      .innerJoin(fundings, eq(paymentTransactions.fundingId, fundings.id))
      .where(eq(paymentTransactions.id, createdPayment.id))
      .limit(1);

    if (!payment) {
      throw new Error('Failed to create payment transaction');
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Failed to create payment:', error);
    return NextResponse.json(
      { message: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
