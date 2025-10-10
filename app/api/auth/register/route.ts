import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';

import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { user } from '@/lib/db/schema';

const registerSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다.'),
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
  role: z.enum(['CREATOR', 'PARTICIPANT', 'PARTNER']).optional().default('PARTICIPANT')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const { name, email, password, role } = validatedData;

    const db = await getDb();

    // 이메일 중복 확인
    const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다.' },
        { status: 409 }
      );
    }

    // 비밀번호 해시화
    const hashedPassword = await hash(password, 12);

    // 사용자 생성
    const [newUser] = await db.insert(user).values({
      name,
      email,
      passwordHash: hashedPassword,
      role: role as 'CREATOR' | 'PARTICIPANT' | 'PARTNER' | 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    return NextResponse.json({
      message: '회원가입이 성공적으로 완료되었습니다.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }

    console.error('회원가입 처리 중 오류:', error);
    return NextResponse.json(
      { error: '회원가입 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}