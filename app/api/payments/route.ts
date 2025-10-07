import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count, desc } from 'drizzle-orm';

import { paymentTransactions, fundings, paymentProviderEnum, fundingStatusEnum } from '@/lib/db/schema';
import { db } from '@/lib/db/client';
import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as string | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // 조건부 필터링
    const conditions = [eq(fundings.userId, user.id)];
    if (provider && Object.values(paymentProviderEnum.enumValues).includes(provider as any)) {
      conditions.push(eq(paymentTransactions.provider, provider as any));
    }

    // 결제 내역 조회
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

    // 전체 개수 조회
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
    const body = await request.json();
    const { fundingId, provider, externalId, amount } = body;

    if (!fundingId || !provider || !externalId || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Drizzle로 전환 필요
    // 펀딩 정보 확인
    const funding = { id: fundingId, userId: user.id };

    if (!funding || funding.userId !== user.id) {
      return NextResponse.json(
        { message: 'Funding not found or unauthorized' },
        { status: 404 }
      );
    }

    // TODO: Drizzle로 전환 필요
    // 기존 결제 거래 확인
    const existingPayment = null;

    if (existingPayment) {
      return NextResponse.json(
        { message: 'Payment already exists for this funding' },
        { status: 400 }
      );
    }

    // TODO: Drizzle로 전환 필요
    // 결제 거래 생성
    const payment = {
      id: 'temp-payment-id',
      fundingId,
      provider,
      externalId,
      amount,
      status: 'PENDING'
    };

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Failed to create payment:', error);
    return NextResponse.json(
      { message: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
