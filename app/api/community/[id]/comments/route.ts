import { NextRequest, NextResponse } from 'next/server';

import { type CommunityComment } from '@/lib/data/community';
import { prisma } from '@/lib/prisma';

const DEMO_USER = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@collaborium.ai'
};

async function ensureDemoUser() {
  try {
    await prisma.user.upsert({
      where: { id: DEMO_USER.id },
      update: { name: DEMO_USER.name, email: DEMO_USER.email },
      create: {
        id: DEMO_USER.id,
        name: DEMO_USER.name,
        email: DEMO_USER.email
      }
    });
  } catch (error) {
    console.error('[communityComment.ensureDemoUser]', error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const userId = body.userId ?? DEMO_USER.id;

  try {
    await ensureDemoUser();

    const comment = await prisma.comment.create({
      data: {
        content: body.content,
        postId: params.id,
        authorId: userId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    const response: CommunityComment = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      author: comment.author
        ? {
            id: comment.author.id,
            name: comment.author.name,
            image: comment.author.image ?? null
          }
        : undefined
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[communityComment.POST]', error);
    const fallback: CommunityComment = {
      id: crypto.randomUUID(),
      content: body.content,
      createdAt: new Date().toISOString(),
      author: {
        id: DEMO_USER.id,
        name: DEMO_USER.name
      }
    };
    return NextResponse.json(fallback, { status: 201 });
  }
}
