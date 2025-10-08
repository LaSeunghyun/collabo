import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { wallet as walletSchema } from '@/drizzle/schema';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDb();

    const wallet = await db.select().from(walletSchema).where(eq(walletSchema.userId, user.id)).limit(1).then(rows => rows[0] || null);

    if (!wallet) {
      // 지갑이 없으면 생성
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

      const newWallet = await db.select().from(walletSchema).where(eq(walletSchema.id, created.id)).limit(1).then(rows => rows[0] || null);

      if (!newWallet) {
        throw new Error('Failed to create wallet');
      }

      return NextResponse.json(newWallet);
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Failed to fetch wallet:', error);
    return NextResponse.json(
      { message: 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDb();
    const body = await request.json();
    const { amount, type } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { message: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!['DEPOSIT', 'WITHDRAW', 'TRANSFER'].includes(type)) {
      return NextResponse.json(
        { message: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    // 지갑이 없으면 생성
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

      wallet = await db.select().from(walletSchema).where(eq(walletSchema.id, created.id)).limit(1).then(rows => rows[0] || null);

      if (!wallet) {
        throw new Error('Failed to create wallet');
      }
    }

    // 잔액 업데이트
    const newBalance = type === 'WITHDRAW'
      ? wallet.balance - amount
      : wallet.balance + amount;

    if (newBalance < 0) {
      return NextResponse.json(
        { message: 'Insufficient balance' },
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

    const updatedWallet = await db.select().from(walletSchema).where(eq(walletSchema.id, updated.id)).limit(1).then(rows => rows[0] || null);

    if (!updatedWallet) {
      throw new Error('Failed to load updated wallet');
    }

    return NextResponse.json(updatedWallet);
  } catch (error) {
    console.error('Failed to update wallet:', error);
    return NextResponse.json(
      { message: 'Failed to update wallet' },
      { status: 500 }
    );
  }
}
