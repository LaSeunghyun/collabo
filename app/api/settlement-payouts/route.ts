import { NextRequest, NextResponse } from 'next/server';

import { SettlementStakeholderType } from '@prisma/client';
import { requireApiUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
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
    const user = await requireApiUser(request);
    const body = await request.json();
    const { settlementId, stakeholderType, amount, description } = body;

    if (!settlementId || !stakeholderType || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 정산 정보 확인
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

    // 권한 확인 (프로젝트 소유자 또는 관리자만)
    if (settlement.project.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 정산 지급 생성
    const payout = await prisma.settlementPayout.create({
      data: {
        settlementId,
        stakeholderType,
        stakeholderId: user.id,
        amount,
        description,
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
