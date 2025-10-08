import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { eq, inArray } from 'drizzle-orm';
import { users, userRoleEnum } from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';

export async function POST() {
  try {
    console.log('🔐 테스트 계정 생성 시작...');

    // 기존 계정 삭제 (선택사항)
    const db = await getDb();
    await db.delete(users).where(
      inArray(users.email, ['admin@collabo.com', 'fan@collabo.com', 'partner@collabo.com'])
    );

    const hashedPassword = await hash('1234', 10);

    // 1. 관리자 계정 생성
    const admin = await db.insert(users).values({
      id: crypto.randomUUID(),
      name: '관리자',
      email: 'admin@collabo.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();
    console.log('✅ 관리자 계정 생성 완료:', admin[0].email);

    // 2. 팬 계정 생성 (참여자)
    const fan = await db.insert(users).values({
      id: crypto.randomUUID(),
      name: '팬',
      email: 'fan@collabo.com',
      passwordHash: hashedPassword,
      role: 'PARTICIPANT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();
    console.log('✅ 팬 계정 생성 완료:', fan[0].email);

    // 3. 파트너 계정 생성
    const partner = await db.insert(users).values({
      id: crypto.randomUUID(),
      name: '파트너',
      email: 'partner@collabo.com',
      passwordHash: hashedPassword,
      role: 'PARTNER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();
    console.log('✅ 파트너 계정 생성 완료:', partner[0].email);

    return NextResponse.json({
      success: true,
      message: '모든 테스트 계정이 성공적으로 생성되었습니다!',
      accounts: [
        { email: 'admin@collabo.com', role: 'ADMIN', password: '1234' },
        { email: 'fan@collabo.com', role: 'PARTICIPANT', password: '1234' },
        { email: 'partner@collabo.com', role: 'PARTNER', password: '1234' }
      ]
    });

  } catch (error) {
    console.error('❌ 계정 생성 중 오류 발생:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '계정 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
