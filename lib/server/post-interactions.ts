import { ModerationTargetType, ModerationStatus } from '@/types/drizzle';
// PostStatus enum removed - using string type
import { prisma } from '@/lib/prisma';

export interface PostInteractionResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * 게시글 좋아요 처리
 */
export async function togglePostLike(
  postId: string,
  userId: string
): Promise<PostInteractionResult> {
  try {
    // 게시글 존재 확인
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return {
        success: false,
        message: '게시글을 찾을 수 없습니다.'
      };
    }

    // 삭제된 게시글 확인
    if (post.status === PostStatus.DELETED) {
      return {
        success: false,
        message: '삭제된 게시글에는 좋아요를 할 수 없습니다.'
      };
    }

    // 기존 좋아요 확인
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    // 트랜잭션으로 좋아요 토글 처리
    const result = await prisma.$transaction(async (tx) => {
      if (existingLike) {
        // 좋아요 취소
        await tx.postLike.delete({
          where: {
            postId_userId: {
              postId,
              userId
            }
          }
        });

        await tx.post.update({
          where: { id: postId },
          data: {
            likesCount: {
              decrement: 1
            }
          }
        });

        return { action: 'removed', count: post.likesCount - 1 };
      } else {
        // 싫어요가 있다면 먼저 제거
        await tx.postDislike.deleteMany({
          where: {
            postId,
            userId
          }
        });

        // 좋아요 추가
        await tx.postLike.create({
          data: {
            postId,
            userId
          }
        });

        await tx.post.update({
          where: { id: postId },
          data: {
            likesCount: {
              increment: 1
            }
          }
        });

        return { action: 'added', count: post.likesCount + 1 };
      }
    });

    return {
      success: true,
      message: result.action === 'added' ? '좋아요가 추가되었습니다.' : '좋아요가 취소되었습니다.',
      data: result
    };
  } catch (error) {
    console.error('좋아요 처리 실패:', error);
    return {
      success: false,
      message: '좋아요 처리에 실패했습니다.'
    };
  }
}

/**
 * 게시글 싫어요 처리
 */
export async function togglePostDislike(
  postId: string,
  userId: string
): Promise<PostInteractionResult> {
  try {
    // 게시글 존재 확인
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return {
        success: false,
        message: '게시글을 찾을 수 없습니다.'
      };
    }

    // 삭제된 게시글 확인
    if (post.status === PostStatus.DELETED) {
      return {
        success: false,
        message: '삭제된 게시글에는 싫어요를 할 수 없습니다.'
      };
    }

    // 기존 싫어요 확인
    const existingDislike = await prisma.postDislike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    // 트랜잭션으로 싫어요 토글 처리
    const result = await prisma.$transaction(async (tx) => {
      if (existingDislike) {
        // 싫어요 취소
        await tx.postDislike.delete({
          where: {
            postId_userId: {
              postId,
              userId
            }
          }
        });

        return { action: 'removed' };
      } else {
        // 좋아요가 있다면 먼저 제거
        await tx.postLike.deleteMany({
          where: {
            postId,
            userId
          }
        });

        // 싫어요 추가
        await tx.postDislike.create({
          data: {
            postId,
            userId
          }
        });

        return { action: 'added' };
      }
    });

    return {
      success: true,
      message: result.action === 'added' ? '싫어요가 추가되었습니다.' : '싫어요가 취소되었습니다.',
      data: result
    };
  } catch (error) {
    console.error('싫어요 처리 실패:', error);
    return {
      success: false,
      message: '싫어요 처리에 실패했습니다.'
    };
  }
}

/**
 * 게시글 신고 처리
 */
export async function reportPost(
  postId: string,
  userId: string,
  reason: string
): Promise<PostInteractionResult> {
  try {
    // 필수 필드 검증
    if (!reason || reason.trim().length === 0) {
      return {
        success: false,
        message: '신고 사유를 입력해주세요.'
      };
    }

    // 게시글 존재 확인
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return {
        success: false,
        message: '게시글을 찾을 수 없습니다.'
      };
    }

    // 삭제된 게시글 확인
    if (post.status === PostStatus.DELETED) {
      return {
        success: false,
        message: '삭제된 게시글은 신고할 수 없습니다.'
      };
    }

    // 본인 게시글 신고 방지
    if (post.authorId === userId) {
      return {
        success: false,
        message: '본인의 게시글은 신고할 수 없습니다.'
      };
    }

    // 중복 신고 확인
    const existingReport = await prisma.moderationReport.findFirst({
      where: {
        targetType: ModerationTargetType.POST,
        targetId: postId,
        reporterId: userId,
        status: {
          in: [ModerationStatus.PENDING, ModerationStatus.REVIEWING]
        }
      }
    });

    if (existingReport) {
      return {
        success: false,
        message: '이미 신고한 게시글입니다.'
      };
    }

    // 트랜잭션으로 신고 생성 및 카운트 증가
    const result = await prisma.$transaction(async (tx) => {
      // 신고 생성
      const report = await tx.moderationReport.create({
        data: {
          targetType: ModerationTargetType.POST,
          targetId: postId,
          reporterId: userId,
          reason: reason.trim(),
          status: ModerationStatus.PENDING
        }
      });

      // 신고 카운트 증가
      await tx.post.update({
        where: { id: postId },
        data: {
          reportsCount: {
            increment: 1
          }
        }
      });

      return report;
    });

    // 신고 누적 임계치 확인 (3건 이상 시 자동 숨김)
    const reportCount = await prisma.moderationReport.count({
      where: {
        targetType: ModerationTargetType.POST,
        targetId: postId,
        status: {
          in: [ModerationStatus.PENDING, ModerationStatus.REVIEWING]
        }
      }
    });

    if (reportCount >= 3) {
      await prisma.post.update({
        where: { id: postId },
        data: {
          status: PostStatus.HIDDEN
        }
      });
    }

    return {
      success: true,
      message: '신고가 접수되었습니다.',
      data: result
    };
  } catch (error) {
    console.error('신고 접수 실패:', error);
    return {
      success: false,
      message: '신고 접수에 실패했습니다.'
    };
  }
}

/**
 * 게시글 상호작용 상태 조회
 */
export async function getPostInteractionStatus(
  postId: string,
  userId?: string
): Promise<{
  liked: boolean;
  disliked: boolean;
  canReport: boolean;
}> {
  try {
    if (!userId) {
      return {
        liked: false,
        disliked: false,
        canReport: false
      };
    }

    const [likeRecord, dislikeRecord, post] = await Promise.all([
      prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId
          }
        }
      }),
      prisma.postDislike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId
          }
        }
      }),
      prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, status: true }
      })
    ]);

    const canReport = post && post.authorId !== userId && post.status !== PostStatus.DELETED;

    return {
      liked: Boolean(likeRecord),
      disliked: Boolean(dislikeRecord),
      canReport: Boolean(canReport)
    };
  } catch (error) {
    console.error('상호작용 상태 조회 실패:', error);
    return {
      liked: false,
      disliked: false,
      canReport: false
    };
  }
}
