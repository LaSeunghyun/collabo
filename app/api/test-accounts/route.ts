import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users } from '@/drizzle/schema';
import { hashPassword } from '@/lib/auth/password';
import { randomUUID } from 'crypto';

export async function POST() {
  try {
    const db = await getDb();
    const hashedPassword = await hashPassword('test123!');

    // 1. 관리자 계정 생성
    const admin = await db.insert(users).values({
      id: randomUUID(),
      name: '관리자',
      email: 'admin@collabo.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    console.log('테스트 관리자 계정 생성 완료:', admin[0].email);

    // 2. 팬 계정 생성 (참여자)
    const fan = await db.insert(users).values({
      id: randomUUID(),
      name: '팬',
      email: 'fan@collabo.com',
      passwordHash: hashedPassword,
      role: 'PARTICIPANT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    console.log('테스트 팬 계정 생성 완료:', fan[0].email);

    // 3. 파트너 계정 생성
    const partner = await db.insert(users).values({
      id: randomUUID(),
      name: '파트너',
      email: 'partner@collabo.com',
      passwordHash: hashedPassword,
      role: 'PARTNER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    console.log('테스트 파트너 계정 생성 완료:', partner[0].email);

    // 4. 아티스트 계정 생성
    const artist = await db.insert(users).values({
      id: randomUUID(),
      name: '아티스트',
      email: 'artist@collabo.com',
      passwordHash: hashedPassword,
      role: 'CREATOR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    console.log('테스트 아티스트 계정 생성 완료:', artist[0].email);

    return NextResponse.json({
      message: '테스트 계정들이 성공적으로 생성되었습니다.',
      accounts: {
        admin: admin[0].email,
        fan: fan[0].email,
        partner: partner[0].email,
        artist: artist[0].email
      }
    });
  } catch (error) {
    console.error('테스트 계정 생성 중 오류 발생:', error);
    return NextResponse.json(
      { error: '테스트 계정 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}