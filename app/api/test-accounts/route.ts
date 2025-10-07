import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/auth';

export async function POST() {
  try {
    console.log('?�� ?�스??계정 ?�성 ?�작...');

    // 기존 계정 ??�� (?�택?�항)
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin@collabo.com', 'fan@collabo.com', 'partner@collabo.com']
        }
      }
    });

    const hashedPassword = await hash('1234', 10);

    // 1. 관리자 계정 ?�성
    const admin = await prisma.user.create({
      data: {
        name: '관리자',
        email: 'admin@collabo.com',
        passwordHash: hashedPassword,
        role: UserRole.ADMIN
      }
    });
    console.log('??관리자 계정 ?�성 ?�료:', admin.email);

    // 2. ??계정 ?�성 (참여??
    const fan = await prisma.user.create({
      data: {
        name: '??,
        email: 'fan@collabo.com',
        passwordHash: hashedPassword,
        role: UserRole.PARTICIPANT
      }
    });
    console.log('????계정 ?�성 ?�료:', fan.email);

    // 3. ?�트??계정 ?�성
    const partner = await prisma.user.create({
      data: {
        name: '?�트??,
        email: 'partner@collabo.com',
        passwordHash: hashedPassword,
        role: UserRole.PARTNER
      }
    });
    console.log('???�트??계정 ?�성 ?�료:', partner.email);

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
