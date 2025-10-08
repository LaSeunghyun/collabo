import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDb, isDrizzleAvailable } from '@/lib/db/client';
import { wallet as walletSchema } from '@/drizzle/schema';

export async function GET(request: NextRequest) {
  try {
    // ?�이?�베?�스 ?�용 가???��? ?�인
    if (!isDrizzleAvailable()) {
      return NextResponse.json(
        { 
          error: '?�이?�베?�스???�결?????�습?�다.',
          details: 'DATABASE_URL???�정?��? ?�았?�니??'
        },
        { status: 503 }
      );
    }

    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDb();

    const wallet = await db.select().from(walletSchema).where(eq(walletSchema.userId, user.id)).limit(1).then(rows => rows[0] || null);

    if (!wallet) {
      // 지갑이 ?�으�??�성
      const now = new Date().toISOString();
      const [created] = await db
        .insert(walletSchema)
        .values({
          id: randomUUID(),
          userId: user.id,
          balance: 0,
          pendingBalance: 0,
          updatedAt: now,
        })
        .returning({ id: walletSchema.id });

      if (!created) {
        throw new Error('지�??�성???�패?�습?�다.');
      }

      const newWallet = await db.select().from(walletSchema).where(eq(walletSchema.id, created.id)).limit(1).then(rows => rows[0] || null);

      if (!newWallet) {
        throw new Error('?�성??지갑을 불러?????�습?�다.');
      }

      return NextResponse.json(newWallet);
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('지�?조회 �??�류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('user-id') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: '지�??�보�?불러?�는???�패?�습?�다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ?�이?�베?�스 ?�용 가???��? ?�인
    if (!isDrizzleAvailable()) {
      return NextResponse.json(
        { 
          error: '?�이?�베?�스???�결?????�습?�다.',
          details: 'DATABASE_URL???�정?��? ?�았?�니??'
        },
        { status: 503 }
      );
    }

    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDb();
    
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '?�못???�청 본문?�니??' },
        { status: 400 }
      );
    }

    const { amount, type } = body as { amount?: number; type?: string };

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: '?�효?��? ?��? 금액?�니??' },
        { status: 400 }
      );
    }

    if (!type || !['DEPOSIT', 'WITHDRAW', 'TRANSFER'].includes(type)) {
      return NextResponse.json(
        { error: '?�효?��? ?��? 거래 ?�형?�니??' },
        { status: 400 }
      );
    }

    // 지갑이 ?�으�??�성
    let wallet = await db.select().from(walletSchema).where(eq(walletSchema.userId, user.id)).limit(1).then(rows => rows[0] || null);

    if (!wallet) {
      const now = new Date().toISOString();
      const [created] = await db
        .insert(walletSchema)
        .values({
          id: randomUUID(),
          userId: user.id,
          balance: 0,
          pendingBalance: 0,
          updatedAt: now,
        })
        .returning({ id: walletSchema.id });

      if (!created) {
        throw new Error('지�??�성???�패?�습?�다.');
      }

      wallet = await db.select().from(walletSchema).where(eq(walletSchema.id, created.id)).limit(1).then(rows => rows[0] || null);

      if (!wallet) {
        throw new Error('?�성??지갑을 불러?????�습?�다.');
      }
    }

    // ?�액 ?�데?�트
    const newBalance = type === 'WITHDRAW'
      ? wallet.balance - amount
      : wallet.balance + amount;

    if (newBalance < 0) {
      return NextResponse.json(
        { error: '?�액??부족합?�다.' },
        { status: 400 }
      );
    }

    const newPendingBalance =
      type === 'DEPOSIT' ? wallet.pendingBalance + amount : wallet.pendingBalance;
    const [updated] = await db
      .update(walletSchema)
      .set({
        balance: newBalance,
        pendingBalance: newPendingBalance,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(walletSchema.id, wallet.id))
      .returning({ id: walletSchema.id });

    if (!updated) {
      throw new Error('지�??�데?�트???�패?�습?�다.');
    }

    const updatedWallet = await db.select().from(walletSchema).where(eq(walletSchema.id, updated.id)).limit(1).then(rows => rows[0] || null);

    if (!updatedWallet) {
      throw new Error('?�데?�트??지갑을 불러?????�습?�다.');
    }

    return NextResponse.json(updatedWallet);
  } catch (error) {
    console.error('지�??�데?�트 �??�류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('user-id') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: '지�??�데?�트???�패?�습?�다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
