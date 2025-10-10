import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';

import { 
  communityPosts,
  users,
  communityPostLikes,
  communityPostDislikes,
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
        id: communityPosts.id,
        title: communityPosts.title,
        content: communityPosts.content,
        category: communityPosts.category,
        projectId: communityPosts.projectId,
        isPinned: communityPosts.isPinned,
        createdAt: communityPosts.createdAt,
        author: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl
        }
      })
      .from(communityPosts)
      .innerJoin(users, eq(communityPosts.authorId, users.id))
      .where(eq(communityPosts.id, postId))
      .limit(1);

    const post = postResult[0];

    if (!post) {
      return null;
    }

    // 좋아요, 싫어요, 댓글 수를 별도로 조회
    const [likesResult, dislikesResult, commentsResult] = await Promise.all([
      db.select({ count: count() }).from(communityPostLikes).where(eq(communityPostLikes.postId, postId)),
      db.select({ count: count() }).from(communityPostDislikes).where(eq(communityPostDislikes.postId, postId)),
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
          db.select().from(communityPostLikes).where(and(eq(communityPostLikes.postId, postId), eq(communityPostLikes.userId, viewerId))).limit(1),
          db
            .select()
            .from(communityPostDislikes)
            .where(and(eq(communityPostDislikes.postId, postId), eq(communityPostDislikes.userId, viewerId)))
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
  const action = body.action; // 'like', 'dislike', 'unlike', 'undislike', 'update'
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
    
    // 게시글 존재 여부 및 작성자 확인
    const existingPost = await db
      .select({ 
        id: communityPosts.id, 
        authorId: communityPosts.authorId,
        title: communityPosts.title,
        content: communityPosts.content,
        category: communityPosts.category
      })
      .from(communityPosts)
      .where(eq(communityPosts.id, params.id))
      .limit(1);

    if (!existingPost[0]) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // 게시글 수정인 경우
    if (action === 'update') {
      const { title, content, category } = body;
      
      // 권한 확인 (작성자 또는 관리자만 수정 가능)
      if (existingPost[0].authorId !== sessionUser.id && sessionUser.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
      }

      // 입력 검증
      if (title !== undefined && (title.length < 1 || title.length > 200)) {
        return NextResponse.json(
          { error: '제목은 1자 이상 200자 이하여야 합니다.' },
          { status: 400 }
        );
      }

      if (content !== undefined && (content.length < 1 || content.length > 10000)) {
        return NextResponse.json(
          { error: '내용은 1자 이상 10000자 이하여야 합니다.' },
          { status: 400 }
        );
      }

      // 카테고리 검증
      if (category !== undefined) {
        const validCategories = ['GENERAL', 'NOTICE', 'COLLAB', 'SUPPORT', 'SHOWCASE'];
        const normalizedCategory = category.toUpperCase();
        
        if (!validCategories.includes(normalizedCategory)) {
          return NextResponse.json(
            { error: '유효하지 않은 카테고리입니다.' },
            { status: 400 }
          );
        }
      }

      // 게시글 업데이트
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };

      if (title !== undefined) updateData.title = title.trim();
      if (content !== undefined) updateData.content = content.trim();
      if (category !== undefined) updateData.category = category.toUpperCase();

      await db
        .update(communityPosts)
        .set(updateData)
        .where(eq(communityPosts.id, params.id));

      const updated = await buildPostResponse(params.id, sessionUser.id);
      return NextResponse.json(updated);
    }

    // 좋아요/싫어요 처리 (기존 로직)
    if (action === 'like') {
      // 싫어요가 있다면 먼저 제거
      await db
        .delete(communityPostDislikes)
        .where(and(eq(communityPostDislikes.postId, params.id), eq(communityPostDislikes.userId, sessionUser.id)));
      
      // 좋아요 추가 (중복 방지를 위해 INSERT ... ON CONFLICT 사용)
      await db
        .insert(communityPostLikes)
        .values({
          id: crypto.randomUUID(),
          postId: params.id,
          userId: sessionUser.id,
          createdAt: new Date().toISOString()
        })
        .onConflictDoNothing();
    } else if (action === 'dislike') {
      // 좋아요가 있다면 먼저 제거
      await db
        .delete(communityPostLikes)
        .where(and(eq(communityPostLikes.postId, params.id), eq(communityPostLikes.userId, sessionUser.id)));
      
      // 싫어요 추가 (중복 방지를 위해 INSERT ... ON CONFLICT 사용)
      await db
        .insert(communityPostDislikes)
        .values({
          id: crypto.randomUUID(),
          postId: params.id,
          userId: sessionUser.id,
          createdAt: new Date().toISOString()
        })
        .onConflictDoNothing();
    } else if (action === 'unlike') {
      // 좋아요 제거
      await db
        .delete(communityPostLikes)
        .where(and(eq(communityPostLikes.postId, params.id), eq(communityPostLikes.userId, sessionUser.id)));
    } else if (action === 'undislike') {
      // 싫어요 제거
      await db
        .delete(communityPostDislikes)
        .where(and(eq(communityPostDislikes.postId, params.id), eq(communityPostDislikes.userId, sessionUser.id)));
    }

    const updated = await buildPostResponse(params.id, sessionUser.id);

    if (!updated) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update post.', error);
    return NextResponse.json({ message: 'Unable to update post.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // 게시글 존재 여부 및 작성자 확인
    const existingPost = await db
      .select({ 
        id: communityPosts.id, 
        authorId: communityPosts.authorId,
        title: communityPosts.title
      })
      .from(communityPosts)
      .where(eq(communityPosts.id, params.id))
      .limit(1);

    if (!existingPost[0]) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // 권한 확인 (작성자 또는 관리자만 삭제 가능)
    if (existingPost[0].authorId !== sessionUser.id && sessionUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Soft delete: status를 'DELETED'로 변경
    await db
      .update(communityPosts)
      .set({ 
        status: 'DELETED',
        updatedAt: new Date().toISOString()
      })
      .where(eq(communityPosts.id, params.id));

    return NextResponse.json({ 
      message: 'Post deleted successfully',
      id: params.id
    });
  } catch (error) {
    console.error('Failed to delete post.', error);
    return NextResponse.json({ message: 'Unable to delete post.' }, { status: 500 });
  }
}