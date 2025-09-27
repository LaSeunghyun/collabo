import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json([]);
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

    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to search users', error);
    return NextResponse.json([]);
  }
}
