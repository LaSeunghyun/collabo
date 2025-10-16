import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

import { createParticipantUser, findUserByEmail } from '@/lib/auth/user';

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

        if (password.length < 6) {
            return NextResponse.json(
                { error: '비밀번호는 6자 이상이어야 합니다.' },
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
        console.error('회원가입 에러:', error);

        // 데이터베이스 연결 에러인지 확인
        if (error instanceof Error && error.message.includes('Database connection failed')) {
            return NextResponse.json(
                { error: '데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: '회원가입 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
