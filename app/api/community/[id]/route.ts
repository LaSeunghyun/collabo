import { NextRequest, NextResponse } from 'next/server';

import { CommunityCategory, ModerationTargetType } from '@prisma/client';

import { handleAuthorizationError, requireApiUser } from '@/lib/auth/guards';
import { evaluateAuthorization } from '@/lib/auth/session';
import type { SessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const DETAIL_CONFIG = {
  trendingDays: 3,
  trendingMinLikes: 5,
  trendingMinComments: 3
} as const;

const toCategorySlug = (category: CommunityCategory | null | undefined) =>
  String(category ?? CommunityCategory.GENERAL).toLowerCase();

const isTrendingPost = (createdAt: Date, commentCount: number, likeCount: number) => {
  const thresholdDate = new Date(Date.now() - DETAIL_CONFIG.trendingDays * 24 * 60 * 60 * 1000);
  return (
    createdAt >= thresholdDate &&
    (commentCount >= DETAIL_CONFIG.trendingMinComments || likeCount >= DETAIL_CONFIG.trendingMinLikes)
  );
};

const buildPostResponse = async (postId: string, viewerId?: string | null) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { likes: true, dislikes: true, comments: true } }
      }
    });

    if (!post) {
      return null;
    }

    // 안전한 liked/disliked 체크
    let liked = false;
    let disliked = false;
    if (viewerId) {
      try {
        const [likeRecord, dislikeRecord] = await Promise.all([
          prisma.postLike.findUnique({
            where: { postId_userId: { postId, userId: viewerId } }
          }),
          prisma.postDislike.findUnique({
            where: { postId_userId: { postId, userId: viewerId } }
          })
        ]);
        liked = Boolean(likeRecord);
        disliked = Boolean(dislikeRecord);
      } catch (error) {
        console.warn('Failed to check like/dislike status:', error);
        liked = false;
        disliked = false;
      }
    }

    // 안전한 reports 카운트
    let reports = 0;
    try {
      reports = await prisma.moderationReport.count({
        where: {
          targetType: ModerationTargetType.POST,
          targetId: post.id
        }
      });
    } catch (reportError) {
      console.warn('Failed to count reports:', reportError);
      reports = 0;
    }

    return {
      id: post.id || '',
      title: post.title || '',
      content: post.content || '',
      likes: post._count?.likes || 0,
      dislikes: post._count?.dislikes || 0,
      comments: post._count?.comments || 0,
      reports,
      projectId: post.projectId ?? undefined,
      createdAt: post.createdAt?.toISOString() || new Date().toISOString(),
      liked,
      disliked,
      category: toCategorySlug(post.category),
      isPinned: post.isPinned || false,
      isTrending: isTrendingPost(post.createdAt, post._count?.comments || 0, post._count?.likes || 0),
      author: {
        id: post.author?.id || '',
        name: post.author?.name || 'Unknown',
        avatarUrl: post.author?.avatarUrl || null
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
    const existing = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true } });

    if (!existing) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // 좋아요와 싫어요를 상호 배타적으로 처리
    if (action === 'like') {
      // 싫어요가 있다면 먼저 제거
      await prisma.postDislike.deleteMany({
        where: {
          postId: params.id,
          userId: sessionUser.id
        }
      });
      
      // 좋아요 추가
      await prisma.postLike.upsert({
        where: {
          postId_userId: {
            postId: params.id,
            userId: sessionUser.id
          }
        },
        create: {
          postId: params.id,
          userId: sessionUser.id
        },
        update: {}
      });
    } else if (action === 'dislike') {
      // 좋아요가 있다면 먼저 제거
      await prisma.postLike.deleteMany({
        where: {
          postId: params.id,
          userId: sessionUser.id
        }
      });
      
      // 싫어요 추가
      await prisma.postDislike.upsert({
        where: {
          postId_userId: {
            postId: params.id,
            userId: sessionUser.id
          }
        },
        create: {
          postId: params.id,
          userId: sessionUser.id
        },
        update: {}
      });
    } else if (action === 'unlike') {
      // 좋아요 제거
      await prisma.postLike.deleteMany({
        where: {
          postId: params.id,
          userId: sessionUser.id
        }
      });
    } else if (action === 'undislike') {
      // 싫어요 제거
      await prisma.postDislike.deleteMany({
        where: {
          postId: params.id,
          userId: sessionUser.id
        }
      });
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
