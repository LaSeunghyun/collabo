import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

import { createParticipantUser, findUserByEmail } from '@/lib/auth/user';
import { getDb } from '@/lib/db/client';
import { user as userSchema } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        // 입력 검증
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: '이름, 이메일, 비밀번호는 필수입니다.' },
                { status: 400 }
            );
        }

        if (name.length < 2 || name.length > 20) {
            return NextResponse.json(
                { error: '이름은 2자 이상 20자 이하여야 합니다.' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: '비밀번호는 6자 이상이어야 합니다.' },
                { status: 400 }
            );
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: '올바른 이메일 형식이 아닙니다.' },
                { status: 400 }
            );
        }

        // 이메일 중복 확인
        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            return NextResponse.json(
                { error: '이미 사용 중인 이메일입니다.' },
                { status: 400 }
            );
        }

        // 이름 중복 확인
        const db = await getDb();
        const existingName = await db.select().from(userSchema).where(eq(userSchema.name, name)).limit(1).then(rows => rows[0] || null);

        if (existingName) {
            return NextResponse.json(
                { error: '이미 사용 중인 이름입니다.' },
                { status: 400 }
            );
        }

        // 비밀번호 해시화
        const hashedPassword = await hash(password, 12);

        // 사용자 생성
        const user = await createParticipantUser({
            name,
            email,
            passwordHash: hashedPassword,
        });

        return NextResponse.json({
            message: '회원가입이 완료되었습니다.',
            user
        });

    } catch (error) {
        console.error('회원가입 오류:', error);
        console.error('오류 상세:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json(
            { 
                error: '회원가입 중 오류가 발생했습니다.',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}