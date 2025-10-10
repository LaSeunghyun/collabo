import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient, isDrizzleAvailable } from '@/lib/db/client';
import { wallets } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    // ?°ì´?°ë² ?´ìŠ¤ ?¬ìš© ê°€???¬ë? ?•ì¸
    if (!(await isDrizzleAvailable())) {
      return NextResponse.json(
        { 
          error: '?°ì´?°ë² ?´ìŠ¤???°ê²°?????†ìŠµ?ˆë‹¤.',
          details: 'DATABASE_URL???¤ì •?˜ì? ?Šì•˜?µë‹ˆ??'
        },
        { status: 503 }
      );
    }

    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDbClient();

    const wallet = await db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1).then(rows => rows[0] || null);

    if (!wallet) {
      // ì§€ê°‘ì´ ?†ìœ¼ë©??ì„±
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
        throw new Error('ì§€ê°??ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
      }

      const newWallet = await db.select().from(wallets).where(eq(wallets.id, created.id)).limit(1).then(rows => rows[0] || null);

      if (!newWallet) {
        throw new Error('?ì„±??ì§€ê°‘ì„ ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
      }

      return NextResponse.json(newWallet);
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('ì§€ê°?ì¡°íšŒ ì¤??¤ë¥˜ ë°œìƒ:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('user-id') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: 'ì§€ê°??•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ?°ì´?°ë² ?´ìŠ¤ ?¬ìš© ê°€???¬ë? ?•ì¸
    if (!(await isDrizzleAvailable())) {
      return NextResponse.json(
        { 
          error: '?°ì´?°ë² ?´ìŠ¤???°ê²°?????†ìŠµ?ˆë‹¤.',
          details: 'DATABASE_URL???¤ì •?˜ì? ?Šì•˜?µë‹ˆ??'
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
        { error: '?˜ëª»???”ì²­ ë³¸ë¬¸?…ë‹ˆ??' },
        { status: 400 }
      );
    }

    const { amount, type } = body as { amount?: number; type?: string };

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: '? íš¨?˜ì? ?Šì? ê±°ë˜ ê¸ˆì•¡?…ë‹ˆ??' },
        { status: 400 }
      );
    }

    if (!type || !['DEPOSIT', 'WITHDRAW', 'TRANSFER'].includes(type)) {
      return NextResponse.json(
        { error: '? íš¨?˜ì? ?Šì? ê±°ë˜ ? í˜•?…ë‹ˆ??' },
        { status: 400 }
      );
    }

    // ì§€ê°‘ì´ ?†ìœ¼ë©??ì„±
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
        throw new Error('ì§€ê°??ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
      }

      wallet = await db.select().from(wallets).where(eq(wallets.id, created.id)).limit(1).then(rows => rows[0] || null);

      if (!wallet) {
        throw new Error('?ì„±??ì§€ê°‘ì„ ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
      }
    }

    // ?”ì•¡ ?…ë°?´íŠ¸
    const newBalance = type === 'WITHDRAW'
      ? wallet.balance - amount
      : wallet.balance + amount;

    if (newBalance < 0) {
      return NextResponse.json(
        { error: '?”ì•¡??ë¶€ì¡±í•©?ˆë‹¤.' },
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
      throw new Error('ì§€ê°??…ë°?´íŠ¸???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    }

    const updatedWallet = await db.select().from(wallets).where(eq(wallets.id, updated.id)).limit(1).then(rows => rows[0] || null);

    if (!updatedWallet) {
      throw new Error('?…ë°?´íŠ¸??ì§€ê°‘ì„ ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
    }

    return NextResponse.json(updatedWallet);
  } catch (error) {
    console.error('ì§€ê°??…ë°?´íŠ¸ ì¤??¤ë¥˜ ë°œìƒ:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('user-id') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: 'ì§€ê°??…ë°?´íŠ¸???¤íŒ¨?ˆìŠµ?ˆë‹¤.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
