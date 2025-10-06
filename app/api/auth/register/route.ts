import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Drizzle enum values
const UserRole = {
  CREATOR: 'CREATOR',
  PARTICIPANT: 'PARTICIPANT',
  PARTNER: 'PARTNER',
  ADMIN: 'ADMIN',
} as const;

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
        const [existingUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existingUser) {
            return NextResponse.json(
                { error: '?��? ?�용 중인 ?�메?�입?�다.' },
                { status: 400 }
            );
        }

        // 비�?번호 ?�시??
        const hashedPassword = await hash(password, 12);

        // ?�용???�성
        const [user] = await db
            .insert(users)
            .values({
                name,
                email,
                passwordHash: hashedPassword,
                role: UserRole.PARTICIPANT,
            })
            .returning({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                createdAt: users.createdAt,
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
