import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { inArray } from 'drizzle-orm';
import { users } from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';

export async function POST() {
  try {
    console.log('?�� ?�스??계정 ?�성 ?�작...');

    // 기존 계정 ??�� (?�택?�항)
    const db = await getDb();
    await db.delete(users).where(
      inArray(users.email, ['admin@collabo.com', 'fan@collabo.com', 'partner@collabo.com'])
    );

    const hashedPassword = await hash('1234', 10);

    // 1. 관리자 계정 ?�성
    const admin = await db.insert(users).values({
      id: crypto.randomUUID(),
      name: '관리자',
      email: 'admin@collabo.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();
    console.log('??관리자 계정 ?�성 ?�료:', admin[0].email);

    // 2. ??계정 ?�성 (참여??
    const fan = await db.insert(users).values({
      id: crypto.randomUUID(),
      name: '??,
      email: 'fan@collabo.com',
      passwordHash: hashedPassword,
      role: 'PARTICIPANT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();
    console.log('????계정 ?�성 ?�료:', fan[0].email);

    // 3. ?�트??계정 ?�성
    const partner = await db.insert(users).values({
      id: crypto.randomUUID(),
      name: '?�트??,
      email: 'partner@collabo.com',
      passwordHash: hashedPassword,
      role: 'PARTNER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();
    console.log('???�트??계정 ?�성 ?�료:', partner[0].email);

    return NextResponse.json({
      success: true,
      message: '모든 ?�스??계정???�공?�으�??�성?�었?�니??',
      accounts: [
        { email: 'admin@collabo.com', role: 'ADMIN', password: '1234' },
        { email: 'fan@collabo.com', role: 'PARTICIPANT', password: '1234' },
        { email: 'partner@collabo.com', role: 'PARTNER', password: '1234' }
      ]
    });

  } catch (error) {
    console.error('??계정 ?�성 �??�류 발생:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '계정 ?�성 �??�류가 발생?�습?�다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
