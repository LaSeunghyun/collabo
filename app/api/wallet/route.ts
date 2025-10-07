import { NextRequest, NextResponse } from 'next/server';

import { requireApiUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!wallet) {
      // ÏßÄÍ∞ëÏù¥ ?ÜÏúºÎ©??ùÏÑ±
      const newWallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          pendingBalance: 0
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
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

    // ÏßÄÍ∞ëÏù¥ ?ÜÏúºÎ©??ùÏÑ±
    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          pendingBalance: 0
        }
      });
    }

    // ?îÏï° ?ÖÎç∞?¥Ìä∏
    const newBalance = type === 'WITHDRAW' 
      ? wallet.balance - amount 
      : wallet.balance + amount;

    if (newBalance < 0) {
      return NextResponse.json(
        { message: 'Insufficient balance' },
        { status: 400 }
      );
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        pendingBalance: type === 'DEPOSIT' ? wallet.pendingBalance + amount : wallet.pendingBalance
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedWallet);
  } catch (error) {
    console.error('Failed to update wallet:', error);
    return NextResponse.json(
      { message: 'Failed to update wallet' },
      { status: 500 }
    );
  }
}
