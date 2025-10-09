import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { getDbClient } from '@/lib/db/client';
import { userBlocks, communityPosts, users } from '@/lib/db/schema';
import { getServerAuthSession } from '@/lib/auth/session';
import { withCSRFProtection } from '@/lib/auth/csrf';


export const POST = withCSRFProtection(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { id } = params;
  
  try {
    // 세션 확인
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 });
    }

    const blockerId = session.user.id;
    const db = await getDbClient();

    // 게시글 조회
    const post = await db
      .select({ 
        id: communityPosts.id,
        authorId: communityPosts.authorId,
        title: communityPosts.title
      })
      .from(communityPosts)
      .where(eq(communityPosts.id, id))
      .limit(1);

    if (!post[0]) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    const postAuthorId = post[0].authorId;

    // 자기 자신을 차단할 수 없음
    if (postAuthorId === blockerId) {
      return NextResponse.json({ message: 'You cannot block yourself.' }, { status: 400 });
    }

    // 이미 차단했는지 확인
    const existingBlock = await db
      .select({ id: userBlocks.id })
      .from(userBlocks)
      .where(and(
        eq(userBlocks.blockerId, blockerId),
        eq(userBlocks.blockedUserId, postAuthorId)
      ))
      .limit(1);

    if (existingBlock[0]) {
      return NextResponse.json({ 
        message: 'User is already blocked.',
        alreadyBlocked: true
      }, { status: 400 });
    }

    // 차단 생성
    const now = new Date().toISOString();
    const [newBlock] = await db
      .insert(userBlocks)
      .values({
        id: randomUUID(),
        blockerId,
        blockedUserId: postAuthorId,
        createdAt: now
      })
      .returning();

    if (!newBlock) {
      throw new Error('Failed to create block');
    }

    return NextResponse.json(
      {
        id: newBlock.id,
        blockerId: newBlock.blockerId,
        blockedUserId: newBlock.blockedUserId,
        createdAt: newBlock.createdAt,
        message: 'User has been blocked successfully.'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to block user', error);
    return NextResponse.json({ message: 'Unable to block user.' }, { status: 500 });
  }
});
