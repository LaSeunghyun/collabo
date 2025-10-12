import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

import { userBlocks, posts } from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';
import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import type { SessionUser } from '@/lib/auth/session';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let sessionUser: SessionUser;
  const authContext = { headers: request.headers };

  try {
    sessionUser = await requireApiUser({}, authContext);
  } catch (error) {
    const response = handleAuthorizationError(error);
    if (response) {
      return response;
    }

    throw error;
  }

  try {
    const { id } = params;
    const db = await getDb();

    // 게시글과 작성자 정보 조회
    const postResult = await db
      .select({
        id: posts.id,
        authorId: posts.authorId
      })
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!postResult[0]) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    const post = postResult[0];

    if (post.authorId === sessionUser.id) {
      return NextResponse.json({ message: 'You cannot block yourself.' }, { status: 400 });
    }

    // 중복 차단 확인
    const existingBlock = await db
      .select({ id: userBlocks.id })
      .from(userBlocks)
      .where(and(
        eq(userBlocks.blockerId, sessionUser.id),
        eq(userBlocks.blockedUserId, post.authorId)
      ))
      .limit(1);

    if (existingBlock[0]) {
      return NextResponse.json({ message: 'User already blocked.' }, { status: 409 });
    }

    // 차단 생성
    const [newBlock] = await db
      .insert(userBlocks)
      .values({
        id: crypto.randomUUID(),
        blockerId: sessionUser.id,
        blockedUserId: post.authorId,
        createdAt: new Date().toISOString()
      })
      .returning({
        id: userBlocks.id,
        blockerId: userBlocks.blockerId,
        blockedUserId: userBlocks.blockedUserId,
        createdAt: userBlocks.createdAt
      });

    return NextResponse.json(
      {
        id: newBlock.id,
        blockerId: newBlock.blockerId,
        blockedUserId: newBlock.blockedUserId,
        createdAt: newBlock.createdAt
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to block user', error);
    return NextResponse.json({ message: 'Unable to block user.' }, { status: 500 });
  }
}
