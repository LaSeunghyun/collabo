import { NextRequest, NextResponse } from 'next/server';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient } from '@/lib/db/client';
import { posts, postBookmarks } from '@/lib/db/schema/tables';
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

    // 이미 북마크한지 확인
    const existingBookmark = await db
      .select()
      .from(postBookmarks)
      .where(
        and(
          eq(postBookmarks.postId, params.id),
          eq(postBookmarks.userId, user.id)
        )
      )
      .limit(1);

    if (existingBookmark.length > 0) {
      return NextResponse.json(
        { error: '이미 저장한 게시글입니다.' },
        { status: 400 }
      );
    }

    // 북마크 추가
    await db.insert(postBookmarks).values({
      id: crypto.randomUUID(),
      postId: params.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: '게시글이 저장되었습니다.',
    });
  } catch (error) {
    console.error('북마크 추가 오류:', error);
    return NextResponse.json(
      { error: '북마크 추가에 실패했습니다.' },
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

    // 북마크 삭제
    const deletedBookmark = await db
      .delete(postBookmarks)
      .where(
        and(
          eq(postBookmarks.postId, params.id),
          eq(postBookmarks.userId, user.id)
        )
      )
      .returning();

    if (deletedBookmark.length === 0) {
      return NextResponse.json(
        { error: '북마크를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '저장이 취소되었습니다.',
    });
  } catch (error) {
    console.error('북마크 취소 오류:', error);
    return NextResponse.json(
      { error: '북마크 취소에 실패했습니다.' },
      { status: 500 }
    );
  }
}
