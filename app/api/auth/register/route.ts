import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

import { createParticipantUser, findUserByEmail } from '@/lib/auth/user';
import { getDb } from '@/lib/db/client';
import { user as userSchema } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        // ?…ë ¥ ê²€ì¦?        if (!name || !email || !password) {
            return NextResponse.json(
                { error: '?´ë¦„, ?´ë©”?? ë¹„ë?ë²ˆí˜¸???„ìˆ˜?…ë‹ˆ??' },
                { status: 400 }
            );
        }

        if (name.length < 2 || name.length > 20) {
            return NextResponse.json(
                { error: '?´ë¦„?€ 2???´ìƒ 20???´í•˜?¬ì•¼ ?©ë‹ˆ??' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'ë¹„ë?ë²ˆí˜¸??6???´ìƒ?´ì–´???©ë‹ˆ??' },
                { status: 400 }
            );
        }

        // ?´ë©”???•ì‹ ê²€ì¦?        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: '?¬ë°”ë¥??´ë©”???•ì‹???„ë‹™?ˆë‹¤.' },
                { status: 400 }
            );
        }

        // ?´ë©”??ì¤‘ë³µ ?•ì¸
        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            return NextResponse.json(
                { error: '?´ë? ?¬ìš© ì¤‘ì¸ ?´ë©”?¼ì…?ˆë‹¤.' },
                { status: 400 }
            );
        }

        // ?´ë¦„ ì¤‘ë³µ ?•ì¸
        const db = await getDb();
        const existingName = await db.select().from(userSchema).where(eq(userSchema.name, name)).limit(1).then(rows => rows[0] || null);

        if (existingName) {
            return NextResponse.json(
                { error: '?´ë? ?¬ìš© ì¤‘ì¸ ?´ë¦„?…ë‹ˆ??' },
                { status: 400 }
            );
        }

        // ë¹„ë?ë²ˆí˜¸ ?´ì‹œ??        const hashedPassword = await hash(password, 12);

        // ?¬ìš©???ì„±
        const user = await createParticipantUser({
            name,
            email,
            passwordHash: hashedPassword,
        });

        return NextResponse.json({
            message: '?Œì›ê°€?…ì´ ?„ë£Œ?˜ì—ˆ?µë‹ˆ??',
            user
        });

    } catch (error) {
        console.error('?Œì›ê°€???¤ë¥˜:', error);
        console.error('?¤ë¥˜ ?ì„¸:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json(
            { 
                error: '?Œì›ê°€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
