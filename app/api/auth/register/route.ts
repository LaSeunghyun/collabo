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

        // ?�력 검�?
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: '?�네?? ?�메?? 비�?번호???�수?�니??' },
                { status: 400 }
            );
        }

        if (name.length < 2 || name.length > 20) {
            return NextResponse.json(
                { error: '?�네?��? 2???�상 20???�하?�야 ?�니??' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: '비�?번호??6???�상?�어???�니??' },
                { status: 400 }
            );
        }

        // ?�메???�식 검�?
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: '?�바�??�메???�식???�닙?�다.' },
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

        // ?�네??중복 ?�인
        const db = await getDb();
        const existingName = await db.select().from(userSchema).where(eq(userSchema.name, name)).limit(1).then(rows => rows[0] || null);

        if (existingName) {
            return NextResponse.json(
                { error: '?��? ?�용 중인 ?�네?�입?�다.' },
                { status: 400 }
            );
        }

        // 비�?번호 ?�시??
        const hashedPassword = await hash(password, 12);

        // ?�용???�성
        const user = await createParticipantUser({
            name,
            email,
            passwordHash: hashedPassword,
        });

        return NextResponse.json({
            message: '?�원가?�이 ?�료?�었?�니??',
            user
        });

    } catch (error) {
        console.error('?�원가???�러:', error);
        console.error('?�러 ?�세:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json(
            { 
                error: '?�원가??�??�류가 발생?�습?�다.',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
