import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { settlementPayouts, settlements, projects } from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';
import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const { searchParams } = new URL(request.url);
    const stakeholderType = searchParams.get('stakeholderType') as string | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const db = await getDb();

    // WHERE 조건 구성
    const whereConditions = [eq(settlementPayouts.stakeholderId, user.id)];
    if (stakeholderType) {
      whereConditions.push(eq(settlementPayouts.stakeholderType, stakeholderType as any));
    }

    // 정산 지급 내역 조회
    const payouts = await db
      .select({
        id: settlementPayouts.id,
        settlementId: settlementPayouts.settlementId,
        stakeholderType: settlementPayouts.stakeholderType,
        stakeholderId: settlementPayouts.stakeholderId,
        amount: settlementPayouts.amount,
        percentage: settlementPayouts.percentage,
        status: settlementPayouts.status,
        createdAt: settlementPayouts.createdAt,
        updatedAt: settlementPayouts.updatedAt
      })
      .from(settlementPayouts)
      .where(and(...whereConditions))
      .orderBy(desc(settlementPayouts.createdAt))
      .limit(limit)
      .offset(offset);

    // 전체 개수 조회
    const [totalResult] = await db
      .select({ count: count() })
      .from(settlementPayouts)
      .where(and(...whereConditions));

    const total = totalResult?.count || 0;

    return NextResponse.json({
      payouts: payouts.map(payout => ({
        ...payout,
        createdAt: payout.createdAt,
        updatedAt: payout.updatedAt
      })),
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

    const db = await getDb();

    // 정산 정보 확인 (프로젝트 소유자 정보 포함)
    const [settlement] = await db
      .select({
        id: settlements.id,
        projectId: settlements.projectId,
        projectOwnerId: projects.ownerId
      })
      .from(settlements)
      .innerJoin(projects, eq(settlements.projectId, projects.id))
      .where(eq(settlements.id, settlementId))
      .limit(1);

    if (!settlement) {
      return NextResponse.json(
        { message: 'Settlement not found' },
        { status: 404 }
      );
    }

    // 권한 확인 (프로젝트 소유자 또는 관리자만)
    if (settlement.projectOwnerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 정산 지급 생성
    const [payout] = await db
      .insert(settlementPayouts)
      .values({
        id: randomUUID(),
        settlementId,
        stakeholderType: stakeholderType as any,
        stakeholderId: user.id,
        amount: Number(amount),
        percentage: 0, // 필요시 계산
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning({
        id: settlementPayouts.id,
        settlementId: settlementPayouts.settlementId,
        stakeholderType: settlementPayouts.stakeholderType,
        stakeholderId: settlementPayouts.stakeholderId,
        amount: settlementPayouts.amount,
        percentage: settlementPayouts.percentage,
        status: settlementPayouts.status,
        createdAt: settlementPayouts.createdAt,
        updatedAt: settlementPayouts.updatedAt
      });

    return NextResponse.json({
      ...payout,
      createdAt: payout.createdAt,
      updatedAt: payout.updatedAt
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create settlement payout:', error);
    return NextResponse.json(
      { message: 'Failed to create settlement payout' },
      { status: 500 }
    );
  }
}
