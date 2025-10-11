import { NextRequest, NextResponse } from 'next/server';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient } from '@/lib/db/client';
import { posts, postLikes } from '@/lib/db/schema/tables';
import { eq, and } from 'drizzle-orm';
import { PostScope, PostStatus } from '@/lib/constants/enums';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDbClient();
    const user = await requireApiUser(
      {} as GuardRequirement,
      { headers: request.headers }
    );

    // 게시글 존재 확인
    const post = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.id, params.id),
          eq(posts.scope, PostScope.GLOBAL),
          eq(posts.status, PostStatus.PUBLISHED)
        )
      )
      .limit(1);

    if (post.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 좋아요한지 확인
    const existingLike = await db
      .select()
      .from(postLikes)
      .where(
        and(
          eq(postLikes.postId, params.id),
          eq(postLikes.userId, user.id)
        )
      )
      .limit(1);

    if (existingLike.length > 0) {
      return NextResponse.json(
        { error: '이미 좋아요한 게시글입니다.' },
        { status: 400 }
      );
    }

    // 좋아요 추가
    await db.insert(postLikes).values({
      id: crypto.randomUUID(),
      postId: params.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: '좋아요가 추가되었습니다.',
    });
  } catch (error) {
    console.error('좋아요 추가 오류:', error);
    return NextResponse.json(
      { error: '좋아요 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser(
      {} as GuardRequirement,
      { headers: request.headers }
    );

    // 좋아요 삭제
    const deletedLike = await db
      .delete(postLikes)
      .where(
        and(
          eq(postLikes.postId, params.id),
          eq(postLikes.userId, user.id)
        )
      )
      .returning();

    if (deletedLike.length === 0) {
      return NextResponse.json(
        { error: '좋아요를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '좋아요가 취소되었습니다.',
    });
  } catch (error) {
    console.error('좋아요 취소 오류:', error);
    return NextResponse.json(
      { error: '좋아요 취소에 실패했습니다.' },
      { status: 500 }
    );
  }
}
