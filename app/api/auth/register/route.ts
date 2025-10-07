import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/auth';

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

        if (password.length < 6) {
            return NextResponse.json(
                { error: '비�?번호??6???�상?�어???�니??' },
                { status: 400 }
            );
        }

        // ?�메??중복 ?�인
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: '?��? ?�용 중인 ?�메?�입?�다.' },
                { status: 400 }
            );
        }

        // 비�?번호 ?�시??
        const hashedPassword = await hash(password, 12);

        // ?�용???�성
        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                role: UserRole.PARTICIPANT,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });

        return NextResponse.json({
            message: '?�원가?�이 ?�료?�었?�니??',
            user
        });

    } catch (error) {
        console.error('?�원가???�러:', error);
        return NextResponse.json(
            { error: '?�원가??�??�류가 발생?�습?�다.' },
            { status: 500 }
        );
    }
}
