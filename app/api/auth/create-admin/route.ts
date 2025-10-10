import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

import { createAdminUser, findUserByEmail } from '@/lib/auth/user';

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

        if (password.length < 4) {
            return NextResponse.json(
                { error: 'ë¹„ë?ë²ˆí˜¸??4???´ìƒ?´ì–´???©ë‹ˆ??' },
                { status: 400 }
            );
        }

        // ?´ë©”??ì¤‘ë³µ ?•ì¸
        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            return NextResponse.json(
                { error: '?´ë? ?¬ìš© ì¤‘ì¸ ?´ë©”?¼ìž…?ˆë‹¤.' },
                { status: 400 }
            );
        }

        // ë¹„ë?ë²ˆí˜¸ ?´ì‹œ??
        const hashedPassword = await hash(password, 12);

        // ê´€ë¦¬ìž ?¬ìš©???ì„±
        const user = await createAdminUser({
            name,
            email,
            passwordHash: hashedPassword,
        });

        return NextResponse.json({
            message: 'ê´€ë¦¬ìž ê³„ì •???ì„±?˜ì—ˆ?µë‹ˆ??',
            user
        });

    } catch (error) {
        console.error('ê´€ë¦¬ìž ê³„ì • ?ì„± ?¤ë¥˜:', error);
        return NextResponse.json(
            { 
                error: 'ê´€ë¦¬ìž ê³„ì • ?ì„± ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
