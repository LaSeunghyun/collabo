import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/drizzle';
import { UserRole } from '@/types/drizzle';

export async function POST() {
  try {
    console.log('?” ?ŒìŠ¤??ê³„ì • ?ì„± ?œì‘...');

    // ê¸°ì¡´ ê³„ì • ?? œ (? íƒ?¬í•­)
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin@collabo.com', 'fan@collabo.com', 'partner@collabo.com']
        }
      }
    });

    const hashedPassword = await hash('1234', 10);

    // 1. ê´€ë¦¬ì ê³„ì • ?ì„±
    const admin = await prisma.user.create({
      data: {
        name: 'ê´€ë¦¬ì',
        email: 'admin@collabo.com',
        passwordHash: hashedPassword,
        role: UserRole.ADMIN
      }
    });
    console.log('??ê´€ë¦¬ì ê³„ì • ?ì„± ?„ë£Œ:', admin.email);

    // 2. ??ê³„ì • ?ì„± (ì°¸ì—¬??
    const fan = await prisma.user.create({
      data: {
        name: '??,
        email: 'fan@collabo.com',
        passwordHash: hashedPassword,
        role: UserRole.PARTICIPANT
      }
    });
    console.log('????ê³„ì • ?ì„± ?„ë£Œ:', fan.email);

    // 3. ?ŒíŠ¸??ê³„ì • ?ì„±
    const partner = await prisma.user.create({
      data: {
        name: '?ŒíŠ¸??,
        email: 'partner@collabo.com',
        passwordHash: hashedPassword,
        role: UserRole.PARTNER
      }
    });
    console.log('???ŒíŠ¸??ê³„ì • ?ì„± ?„ë£Œ:', partner.email);

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
