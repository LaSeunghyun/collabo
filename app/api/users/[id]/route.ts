import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { eq } from 'drizzle-orm';

import { authOptions } from '@/lib/auth/options';
import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 본인의 정보만 조회 가능
        if (session.user.id !== params.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const db = await getDb();

        const [user] = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                createdAt: users.createdAt,
                role: users.role,
                avatarUrl: users.avatarUrl,
                bio: users.bio,
                language: users.language,
                timezone: users.timezone
            })
            .from(users)
            .where(eq(users.id, params.id))
            .limit(1);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
