import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

import { createAdminUser, findUserByEmail } from '@/lib/auth/user';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        // ?�력 검�?
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: '?�름, ?�메?? 비�?번호???�수?�니??' },
                { status: 400 }
            );
        }

        if (password.length < 4) {
            return NextResponse.json(
                { error: '비�?번호??4???�상?�어???�니??' },
                { status: 400 }
            );
        }

        // ?�메??중복 ?�인
        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            return NextResponse.json(
                { error: '?��? ?�용 중인 ?�메?�입?�다.' },
                { status: 400 }
            );
        }

        // 비�?번호 ?�시??
        const hashedPassword = await hash(password, 12);

        // 관리자 ?�용???�성
        const user = await createAdminUser({
            name,
            email,
            passwordHash: hashedPassword,
        });

        return NextResponse.json({
            message: '관리자 계정???�성?�었?�니??',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('관리자 계정 ?�성 ?�러:', error);
        return NextResponse.json(
            { error: '관리자 계정 ?�성 �??�류가 발생?�습?�다.' },
            { status: 500 }
        );
    }
}
