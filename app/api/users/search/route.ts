import { NextRequest, NextResponse } from 'next/server';
import { ilike, or } from 'drizzle-orm';

import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const db = await getDb();
    const escapedQuery = query.replace(/[\\%_]/g, (char) => `\\${char}`);
    const likePattern = `%${escapedQuery}%`;

    const results = await db
      .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(or(ilike(users.name, likePattern), ilike(users.email, likePattern)))
      .limit(10);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to search users', error);
    return NextResponse.json([]);
  }
}
