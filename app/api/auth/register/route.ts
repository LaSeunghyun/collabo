import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        // ?…ë ¥ ê²€ì¦?
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: '?´ë¦„, ?´ë©”?? ë¹„ë?ë²ˆí˜¸???„ìˆ˜?…ë‹ˆ??' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'ë¹„ë?ë²ˆí˜¸??6???´ìƒ?´ì–´???©ë‹ˆ??' },
                { status: 400 }
            );
        }

        // ?´ë©”??ì¤‘ë³µ ?•ì¸
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: '?´ë? ?¬ìš© ì¤‘ì¸ ?´ë©”?¼ìž…?ˆë‹¤.' },
                { status: 400 }
            );
        }

        // ë¹„ë?ë²ˆí˜¸ ?´ì‹œ??
        const hashedPassword = await hash(password, 12);

        // ?¬ìš©???ì„±
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
            message: '?Œì›ê°€?…ì´ ?„ë£Œ?˜ì—ˆ?µë‹ˆ??',
            user
        });

    } catch (error) {
        console.error('?Œì›ê°€???ëŸ¬:', error);
        return NextResponse.json(
            { error: '?Œì›ê°€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.' },
            { status: 500 }
        );
    }
}
