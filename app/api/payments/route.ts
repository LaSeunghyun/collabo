import { NextRequest, NextResponse } from 'next/server';

import { PaymentProvider } from '@prisma/client';
import { requireApiUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as PaymentProvider | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = { funding: { userId: user.id } };
    if (provider) where.provider = provider;

    const [payments, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where,
        include: {
          funding: {
            include: {
              project: {
                select: {
                  id: true,
                  title: true,
                  owner: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.paymentTransaction.count({ where })
    ]);

    return NextResponse.json({
      payments,
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

    // 펀딩 정보 확인
    const funding = await prisma.funding.findUnique({
      where: { id: fundingId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            owner: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!funding || funding.userId !== user.id) {
      return NextResponse.json(
        { message: 'Funding not found or unauthorized' },
        { status: 404 }
      );
    }

    // 기존 결제 거래 확인
    const existingPayment = await prisma.paymentTransaction.findUnique({
      where: { fundingId }
    });

    if (existingPayment) {
      return NextResponse.json(
        { message: 'Payment already exists for this funding' },
        { status: 400 }
      );
    }

    // 결제 거래 생성
    const payment = await prisma.paymentTransaction.create({
      data: {
        fundingId,
        provider,
        externalId,
        amount,
        status: 'PENDING'
      },
      include: {
        funding: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                owner: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Failed to create payment:', error);
    return NextResponse.json(
      { message: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
