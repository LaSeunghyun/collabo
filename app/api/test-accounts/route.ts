import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { randomUUID } from 'crypto';

export async function POST() {
  try {
    const db = await getDb();
    const hashedPassword = await hashPassword('test123!');

    // 1. 관리자 계정 ?�성
    const admin = await db.insert(users).values({
      id: randomUUID(),
      name: '관리자',
      email: 'admin@collabo.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    console.log('?�스??관리자 계정 ?�성 ?�료:', admin[0].email);

    // 2. ??계정 ?�성 (참여??
    const fan = await db.insert(users).values({
      id: randomUUID(),
      name: '??,
      email: 'fan@collabo.com',
      passwordHash: hashedPassword,
      role: 'PARTICIPANT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    console.log('?�스????계정 ?�성 ?�료:', fan[0].email);

    // 3. ?�트??계정 ?�성
    const partner = await db.insert(users).values({
      id: randomUUID(),
      name: '?�트??,
      email: 'partner@collabo.com',
      passwordHash: hashedPassword,
      role: 'PARTNER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    console.log('?�스???�트??계정 ?�성 ?�료:', partner[0].email);

    // 4. ?�티?�트 계정 ?�성
    const artist = await db.insert(users).values({
      id: randomUUID(),
      name: '?�티?�트',
      email: 'artist@collabo.com',
      passwordHash: hashedPassword,
      role: 'CREATOR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    console.log('?�스???�티?�트 계정 ?�성 ?�료:', artist[0].email);

    return NextResponse.json({
      message: '?�스??계정?�이 ?�공?�으�??�성?�었?�니??',
      accounts: {
        admin: admin[0].email,
        fan: fan[0].email,
        partner: partner[0].email,
        artist: artist[0].email
      }
    });
  } catch (error) {
    console.error('?�스??계정 ?�성 �??�류 발생:', error);
    return NextResponse.json(
      { error: '?�스??계정 ?�성???�패?�습?�다.' },
      { status: 500 }
    );
  }
}
