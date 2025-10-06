import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { responses } from '@/lib/server/api-responses';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json(responses.success([]));
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, avatarUrl: true },
      take: 10
    });

    return NextResponse.json(responses.success(users));
  } catch (error) {
    console.error('Failed to search users', error);
    return NextResponse.json(responses.success([])); // Return empty array on error
  }
}
