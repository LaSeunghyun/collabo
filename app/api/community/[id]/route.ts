import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import {
  posts,
  users,
  postLikes,
  postDislikes,
  moderationReports,
  comments
} from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { evaluateAuthorization } from '@/lib/auth/session';
import type { SessionUser } from '@/lib/auth/session';

const DETAIL_CONFIG = {
  trendingDays: 3,
  trendingMinLikes: 5,
  trendingMinComments: 3
} as const;

const toCategorySlug = (category: string | null | undefined) =>
  String(category ?? 'GENERAL').toLowerCase();

const isTrendingPost = (createdAt: Date, commentCount: number, likeCount: number) => {
  const thresholdDate = new Date(Date.now() - DETAIL_CONFIG.trendingDays * 24 * 60 * 60 * 1000);
  return (
    createdAt >= thresholdDate &&
    (commentCount >= DETAIL_CONFIG.trendingMinComments || likeCount >= DETAIL_CONFIG.trendingMinLikes)
  );
};

const buildPostResponse = async (postId: string, viewerId?: string | null) => {
  try {
    const db = await getDb();

    // 게시글과 작성자 정보를 함께 조회
    const postResult = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        category: posts.category,
        projectId: posts.projectId,
        isPinned: posts.isPinned,
        createdAt: posts.createdAt,
        author: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, postId))
      .limit(1);

    const post = postResult[0];

    if (!post) {
      return null;
    }

    // 좋아요, 싫어요, 댓글 수를 별도로 조회
    const [likesResult, dislikesResult, commentsResult] = await Promise.all([
      db.select({ count: count() }).from(postLikes).where(eq(postLikes.postId, postId)),
      db.select({ count: count() }).from(postDislikes).where(eq(postDislikes.postId, postId)),
      db.select({ count: count() }).from(comments).where(eq(comments.postId, postId))
    ]);

    const postWithCounts = {
      ...post,
      _count: {
        likes: likesResult[0]?.count || 0,
        dislikes: dislikesResult[0]?.count || 0,
        comments: commentsResult[0]?.count || 0
      }
    };

    // 안전한 liked/disliked 체크
    let liked = false;
    let disliked = false;
    if (viewerId) {
      try {
        const [likeRecord, dislikeRecord] = await Promise.all([
          db.select().from(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, viewerId))).limit(1),
          db
            .select()
            .from(postDislikes)
            .where(and(eq(postDislikes.postId, postId), eq(postDislikes.userId, viewerId)))
            .limit(1)
        ]);
        liked = Boolean(likeRecord[0]);
        disliked = Boolean(dislikeRecord[0]);
      } catch (error) {
        console.warn('Failed to check like/dislike status:', error);
        liked = false;
        disliked = false;
      }
    }

    // 안전한 reports 카운트
    let reports = 0;
    try {
      const reportsResult = await db
        .select({ count: count() })
        .from(moderationReports)
        .where(and(eq(moderationReports.targetType, 'POST'), eq(moderationReports.targetId, postId)));
      reports = reportsResult[0]?.count || 0;
    } catch (reportError) {
      console.warn('Failed to count reports:', reportError);
      reports = 0;
    }

    return {
      id: postWithCounts.id || '',
      title: postWithCounts.title || '',
      content: postWithCounts.content || '',
      likes: postWithCounts._count?.likes || 0,
      dislikes: postWithCounts._count?.dislikes || 0,
      comments: postWithCounts._count?.comments || 0,
      reports,
      projectId: postWithCounts.projectId ?? undefined,
      createdAt: postWithCounts.createdAt || new Date().toISOString(),
      liked,
      disliked,
      category: toCategorySlug(postWithCounts.category),
      isPinned: postWithCounts.isPinned || false,
      isTrending: isTrendingPost(
        new Date(postWithCounts.createdAt),
        postWithCounts._count?.comments || 0,
        postWithCounts._count?.likes || 0
      ),
      author: {
        id: postWithCounts.author?.id || '',
        name: postWithCounts.author?.name || 'Unknown',
        avatarUrl: postWithCounts.author?.avatarUrl || null
      }
    };
  } catch (error) {
    console.error('Failed to build post response:', error);
    return null;
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authContext = { headers: request.headers };
    // 인증 체크를 더 안전하게 처리
    let viewerId: string | null = null;
    try {
      const { user: viewer } = await evaluateAuthorization({}, authContext);
      viewerId = viewer?.id || null;
    } catch (authError) {
      console.warn('Authorization check failed:', authError);
      // 인증 실패해도 기본 데이터는 반환
    }

    const post = await buildPostResponse(params.id, viewerId);

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Failed to load post:', error);

    // 더 자세한 에러 정보 제공
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        message: 'Unable to load post.',
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const action = body.action; // 'like', 'dislike', 'unlike', 'undislike'
  const authContext = { headers: request.headers };

  let sessionUser: SessionUser;

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
    const db = await getDb();
    // 게시글 존재 여부 확인
    const existingPost = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, params.id))
      .limit(1);

    if (!existingPost[0]) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // 좋아요와 싫어요를 상호 배타적으로 처리
    if (action === 'like') {
      // 싫어요가 있다면 먼저 제거
      await db
        .delete(postDislikes)
        .where(and(eq(postDislikes.postId, params.id), eq(postDislikes.userId, sessionUser.id)));

      // 좋아요 추가 (중복 방지를 위해 INSERT ... ON CONFLICT 사용)
      await db
        .insert(postLikes)
        .values({
          id: randomUUID(),
          postId: params.id,
          userId: sessionUser.id,
          createdAt: new Date().toISOString()
        })
        .onConflictDoNothing();
    } else if (action === 'dislike') {
      // 좋아요가 있다면 먼저 제거
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.postId, params.id), eq(postLikes.userId, sessionUser.id)));

      // 싫어요 추가 (중복 방지를 위해 INSERT ... ON CONFLICT 사용)
      await db
        .insert(postDislikes)
        .values({
          id: randomUUID(),
          postId: params.id,
          userId: sessionUser.id,
          createdAt: new Date().toISOString()
        })
        .onConflictDoNothing();
    } else if (action === 'unlike') {
      // 좋아요 제거
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.postId, params.id), eq(postLikes.userId, sessionUser.id)));
    } else if (action === 'undislike') {
      // 싫어요 제거
      await db
        .delete(postDislikes)
        .where(and(eq(postDislikes.postId, params.id), eq(postDislikes.userId, sessionUser.id)));
    }

    const updated = await buildPostResponse(params.id, sessionUser.id);

    if (!updated) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update post likes/dislikes.', error);
    return NextResponse.json({ message: 'Unable to update like/dislike state.' }, { status: 500 });
  }
}
