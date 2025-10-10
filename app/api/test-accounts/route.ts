import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { randomUUID } from 'crypto';

export async function POST() {
  try {
    const db = await getDb();
    const hashedPassword = await hashPassword('test123!');

    // 1. ê´€ë¦¬ì ê³„ì • ?ì„±
    const admin = await db.insert(users).values({
      id: randomUUID(),
      name: 'ê´€ë¦¬ì',
      email: 'admin@collabo.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    console.log('?ŒìŠ¤??ê´€ë¦¬ì ê³„ì • ?ì„± ?„ë£Œ:', admin[0].email);

    // 2. ??ê³„ì • ?ì„± (ì°¸ì—¬??
    const fan = await db.insert(users).values({
      id: randomUUID(),
      name: '??,
      email: 'fan@collabo.com',
      passwordHash: hashedPassword,
      role: 'PARTICIPANT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    console.log('?ŒìŠ¤????ê³„ì • ?ì„± ?„ë£Œ:', fan[0].email);

    // 3. ?ŒíŠ¸??ê³„ì • ?ì„±
    const partner = await db.insert(users).values({
      id: randomUUID(),
      name: '?ŒíŠ¸??,
      email: 'partner@collabo.com',
      passwordHash: hashedPassword,
      role: 'PARTNER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    console.log('?ŒìŠ¤???ŒíŠ¸??ê³„ì • ?ì„± ?„ë£Œ:', partner[0].email);

    // 4. ?„í‹°?¤íŠ¸ ê³„ì • ?ì„±
    const artist = await db.insert(users).values({
      id: randomUUID(),
      name: '?„í‹°?¤íŠ¸',
      email: 'artist@collabo.com',
      passwordHash: hashedPassword,
      role: 'CREATOR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    console.log('?ŒìŠ¤???„í‹°?¤íŠ¸ ê³„ì • ?ì„± ?„ë£Œ:', artist[0].email);

    return NextResponse.json({
      message: '?ŒìŠ¤??ê³„ì •?¤ì´ ?±ê³µ?ìœ¼ë¡??ì„±?˜ì—ˆ?µë‹ˆ??',
      accounts: {
        admin: admin[0].email,
        fan: fan[0].email,
        partner: partner[0].email,
        artist: artist[0].email
      }
    });
  } catch (error) {
    console.error('?ŒìŠ¤??ê³„ì • ?ì„± ì¤??¤ë¥˜ ë°œìƒ:', error);
    return NextResponse.json(
      { error: '?ŒìŠ¤??ê³„ì • ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.' },
      { status: 500 }
    );
  }
}
