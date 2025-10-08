import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { inArray } from 'drizzle-orm';
import { users } from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';

export async function POST() {
  try {
    console.log('?” ?ŒìŠ¤??ê³„ì • ?ì„± ?œì‘...');

    // ê¸°ì¡´ ê³„ì • ?? œ (? íƒ?¬í•­)
    const db = await getDb();
    await db.delete(users).where(
      inArray(users.email, ['admin@collabo.com', 'fan@collabo.com', 'partner@collabo.com'])
    );

    const hashedPassword = await hash('1234', 10);

    // 1. ê´€ë¦¬ì ê³„ì • ?ì„±
    const admin = await db.insert(users).values({
      id: crypto.randomUUID(),
      name: 'ê´€ë¦¬ì',
      email: 'admin@collabo.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();
    console.log('??ê´€ë¦¬ì ê³„ì • ?ì„± ?„ë£Œ:', admin[0].email);

    // 2. ??ê³„ì • ?ì„± (ì°¸ì—¬??
    const fan = await db.insert(users).values({
      id: crypto.randomUUID(),
      name: '??,
      email: 'fan@collabo.com',
      passwordHash: hashedPassword,
      role: 'PARTICIPANT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();
    console.log('????ê³„ì • ?ì„± ?„ë£Œ:', fan[0].email);

    // 3. ?ŒíŠ¸??ê³„ì • ?ì„±
    const partner = await db.insert(users).values({
      id: crypto.randomUUID(),
      name: '?ŒíŠ¸??,
      email: 'partner@collabo.com',
      passwordHash: hashedPassword,
      role: 'PARTNER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();
    console.log('???ŒíŠ¸??ê³„ì • ?ì„± ?„ë£Œ:', partner[0].email);

    return NextResponse.json({
      success: true,
      message: 'ëª¨ë“  ?ŒìŠ¤??ê³„ì •???±ê³µ?ìœ¼ë¡??ì„±?˜ì—ˆ?µë‹ˆ??',
      accounts: [
        { email: 'admin@collabo.com', role: 'ADMIN', password: '1234' },
        { email: 'fan@collabo.com', role: 'PARTICIPANT', password: '1234' },
        { email: 'partner@collabo.com', role: 'PARTNER', password: '1234' }
      ]
    });

  } catch (error) {
    console.error('??ê³„ì • ?ì„± ì¤??¤ë¥˜ ë°œìƒ:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'ê³„ì • ?ì„± ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
