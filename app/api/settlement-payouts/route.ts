import { NextRequest, NextResponse } from 'next/server';

import { SettlementStakeholderType } from '@prisma/client';
import { requireApiUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const { searchParams } = new URL(request.url);
    const stakeholderType = searchParams.get('stakeholderType') as SettlementStakeholderType | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = { stakeholderId: user.id };
    if (stakeholderType) where.stakeholderType = stakeholderType;

    const [payouts, total] = await Promise.all([
      prisma.settlementPayout.findMany({
        where,
        include: {
          settlement: {
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
      prisma.settlementPayout.count({ where })
    ]);

    return NextResponse.json({
      payouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch settlement payouts:', error);
    return NextResponse.json(
      { message: 'Failed to fetch settlement payouts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const body = await request.json();
    const { settlementId, stakeholderType, amount } = body;

    if (!settlementId || !stakeholderType || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // ?•ì‚° ?•ë³´ ?•ì¸
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
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

    if (!settlement) {
      return NextResponse.json(
        { message: 'Settlement not found' },
        { status: 404 }
      );
    }

    // ê¶Œí•œ ?•ì¸ (?„ë¡œ?íŠ¸ ?Œìœ ???ëŠ” ê´€ë¦¬ìë§?
    if (settlement.project.owner.id !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // ?•ì‚° ì§€ê¸??ì„±
    const payout = await prisma.settlementPayout.create({
      data: {
        settlementId,
        stakeholderType,
        stakeholderId: user.id,
        amount,
        status: 'PENDING'
      },
      include: {
        settlement: {
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

    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    console.error('Failed to create settlement payout:', error);
    return NextResponse.json(
      { message: 'Failed to create settlement payout' },
      { status: 500 }
    );
  }
}
