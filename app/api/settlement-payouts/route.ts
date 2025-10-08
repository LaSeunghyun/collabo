import { NextRequest, NextResponse } from 'next/server';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const { searchParams } = new URL(request.url);
    const stakeholderType = searchParams.get('stakeholderType') as string | null; // TODO: Drizzle로 전환 필요
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = { stakeholderId: user.id };
    if (stakeholderType) where.stakeholderType = stakeholderType;

    // TODO: Drizzle로 전환 필요
    const [payouts, total] = [[], 0];

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

    // TODO: Drizzle로 전환 필요
    // 정산 정보 확인
    const settlement = { 
      id: settlementId,
      project: {
        owner: { id: user.id }
      }
    };

    if (!settlement) {
      return NextResponse.json(
        { message: 'Settlement not found' },
        { status: 404 }
      );
    }

    // 권한 확인 (프로젝트 소유자 또는 관리자만)
    if (settlement.project.owner.id !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // TODO: Drizzle로 전환 필요
    // 정산 지급 생성
    const payout = {
      id: 'temp-payout-id',
      settlementId,
      stakeholderType,
      stakeholderId: user.id,
      amount,
      status: 'PENDING'
    };

    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    console.error('Failed to create settlement payout:', error);
    return NextResponse.json(
      { message: 'Failed to create settlement payout' },
      { status: 500 }
    );
  }
}