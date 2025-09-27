import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => ({}));
  const blockerId = typeof body.blockerId === 'string' ? body.blockerId : undefined;

  if (!blockerId) {
    return NextResponse.json({ message: 'blockerId is required.' }, { status: 400 });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { authorId: true }
    });

    if (!post) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    if (post.authorId === blockerId) {
      return NextResponse.json({ message: 'You cannot block yourself.' }, { status: 400 });
    }

    const block = await prisma.userBlock.upsert({
      where: {
        blockerId_blockedUserId: {
          blockerId,
          blockedUserId: post.authorId
        }
      },
      create: {
        blockerId,
        blockedUserId: post.authorId
      },
      update: {}
    });

    return NextResponse.json(
      {
        id: block.id,
        blockerId: block.blockerId,
        blockedUserId: block.blockedUserId,
        createdAt: block.createdAt.toISOString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to block user', error);
    return NextResponse.json({ message: 'Unable to block user.' }, { status: 500 });
  }
}
