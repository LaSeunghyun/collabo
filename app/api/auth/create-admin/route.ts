import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

import { createAdminUser, findUserByEmail } from '@/lib/auth/user';

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

        if (password.length < 4) {
            return NextResponse.json(
                { error: '비밀번호는 최소 4자 이상이어야 합니다.' },
                { status: 400 }
            );
        }

        // 이메일 중복 확인
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                { error: '이미 존재하는 이메일입니다.' },
                { status: 409 }
            );
        }

        // 비밀번호 해시화
        const hashedPassword = await hash(password, 12);

        // 관리자 사용자 생성
        const adminUser = await createAdminUser({
            name,
            email,
            password: hashedPassword
        });

        return NextResponse.json({
            message: '관리자 계정이 성공적으로 생성되었습니다.',
            user: {
                id: adminUser.id,
                name: adminUser.name,
                email: adminUser.email,
                role: adminUser.role
            }
        }, { status: 201 });

    } catch (error) {
        console.error('관리자 계정 생성 오류:', error);
        return NextResponse.json(
            { error: '관리자 계정 생성에 실패했습니다.' },
            { status: 500 }
        );
    }
}