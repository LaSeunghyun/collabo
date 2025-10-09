import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient, isDrizzleAvailable } from '@/lib/db/client';
import { wallets } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    // 데이터베이스 사용 가능 여부 확인
    if (!(await isDrizzleAvailable())) {
      return NextResponse.json(
        { 
          error: '데이터베이스에 연결할 수 없습니다.',
          details: 'DATABASE_URL이 설정되지 않았습니다.'
        },
        { status: 503 }
      );
    }

    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDbClient();

    const wallet = await db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1).then(rows => rows[0] || null);

    if (!wallet) {
      // 지갑이 없으면 생성
      const now = new Date().toISOString();
      const [created] = await db
        .insert(wallets)
        .values({
          id: randomUUID(),
          userId: user.id,
          balance: 0,
          pendingBalance: 0,
          currency: 'KRW',
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: wallets.id });

      if (!created) {
        throw new Error('지갑 생성에 실패했습니다.');
      }

      const newWallet = await db.select().from(wallets).where(eq(wallets.id, created.id)).limit(1).then(rows => rows[0] || null);

      if (!newWallet) {
        throw new Error('생성된 지갑을 불러올 수 없습니다.');
      }

      return NextResponse.json(newWallet);
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('지갑 조회 중 오류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('user-id') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: '지갑 정보를 불러오는데 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 데이터베이스 사용 가능 여부 확인
    if (!(await isDrizzleAvailable())) {
      return NextResponse.json(
        { 
          error: '데이터베이스에 연결할 수 없습니다.',
          details: 'DATABASE_URL이 설정되지 않았습니다.'
        },
        { status: 503 }
      );
    }

    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDbClient();
    
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 본문입니다.' },
        { status: 400 }
      );
    }

    const { amount, type } = body as { amount?: number; type?: string };

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: '유효하지 않은 거래 금액입니다.' },
        { status: 400 }
      );
    }

    if (!type || !['DEPOSIT', 'WITHDRAW', 'TRANSFER'].includes(type)) {
      return NextResponse.json(
        { error: '유효하지 않은 거래 유형입니다.' },
        { status: 400 }
      );
    }

    // 지갑이 없으면 생성
    let wallet = await db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1).then(rows => rows[0] || null);

    if (!wallet) {
      const now = new Date().toISOString();
      const [created] = await db
        .insert(wallets)
        .values({
          id: randomUUID(),
          userId: user.id,
          balance: 0,
          pendingBalance: 0,
          currency: 'KRW',
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: wallets.id });

      if (!created) {
        throw new Error('지갑 생성에 실패했습니다.');
      }

      wallet = await db.select().from(wallets).where(eq(wallets.id, created.id)).limit(1).then(rows => rows[0] || null);

      if (!wallet) {
        throw new Error('생성된 지갑을 불러올 수 없습니다.');
      }
    }

    // 잔액 업데이트
    const newBalance = type === 'WITHDRAW'
      ? wallet.balance - amount
      : wallet.balance + amount;

    if (newBalance < 0) {
      return NextResponse.json(
        { error: '잔액이 부족합니다.' },
        { status: 400 }
      );
    }

    const newPendingBalance =
      type === 'DEPOSIT' ? wallet.pendingBalance + amount : wallet.pendingBalance;
    const [updated] = await db
      .update(wallets)
      .set({
        balance: newBalance,
        pendingBalance: newPendingBalance,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(wallets.id, wallet.id))
      .returning({ id: wallets.id });

    if (!updated) {
      throw new Error('지갑 업데이트에 실패했습니다.');
    }

    const updatedWallet = await db.select().from(wallets).where(eq(wallets.id, updated.id)).limit(1).then(rows => rows[0] || null);

    if (!updatedWallet) {
      throw new Error('업데이트된 지갑을 불러올 수 없습니다.');
    }

    return NextResponse.json(updatedWallet);
  } catch (error) {
    console.error('지갑 업데이트 중 오류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('user-id') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: '지갑 업데이트에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}