import { ModerationTargetType, ModerationStatus } from '@/types/drizzle';
// PostStatus enum removed - using string type
import { prisma } from '@/lib/drizzle';

export interface PostInteractionResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * ê²Œì‹œê¸€ ì¢‹ì•„??ì²˜ë¦¬
 */
export async function togglePostLike(
  postId: string,
  userId: string
): Promise<PostInteractionResult> {
  try {
    // ê²Œì‹œê¸€ ì¡´ì¬ ?•ì¸
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return {
        success: false,
        message: 'ê²Œì‹œê¸€??ì°¾ì„ ???†ìŠµ?ˆë‹¤.'
      };
    }

    // ?? œ??ê²Œì‹œê¸€ ?•ì¸
    if (post.status === PostStatus.DELETED) {
      return {
        success: false,
        message: '?? œ??ê²Œì‹œê¸€?ëŠ” ì¢‹ì•„?”ë? ?????†ìŠµ?ˆë‹¤.'
      };
    }

    // ê¸°ì¡´ ì¢‹ì•„???•ì¸
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    // ?¸ëœ??…˜?¼ë¡œ ì¢‹ì•„??? ê? ì²˜ë¦¬
    const result = await prisma.$transaction(async (tx) => {
      if (existingLike) {
        // ì¢‹ì•„??ì·¨ì†Œ
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
        // ?«ì–´?”ê? ?ˆë‹¤ë©?ë¨¼ì? ?œê±°
        await tx.postDislike.deleteMany({
          where: {
            postId,
            userId
          }
        });

        // ì¢‹ì•„??ì¶”ê?
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
      message: result.action === 'added' ? 'ì¢‹ì•„?”ê? ì¶”ê??˜ì—ˆ?µë‹ˆ??' : 'ì¢‹ì•„?”ê? ì·¨ì†Œ?˜ì—ˆ?µë‹ˆ??',
      data: result
    };
  } catch (error) {
    console.error('ì¢‹ì•„??ì²˜ë¦¬ ?¤íŒ¨:', error);
    return {
      success: false,
      message: 'ì¢‹ì•„??ì²˜ë¦¬???¤íŒ¨?ˆìŠµ?ˆë‹¤.'
    };
  }
}

/**
 * ê²Œì‹œê¸€ ?«ì–´??ì²˜ë¦¬
 */
export async function togglePostDislike(
  postId: string,
  userId: string
): Promise<PostInteractionResult> {
  try {
    // ê²Œì‹œê¸€ ì¡´ì¬ ?•ì¸
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return {
        success: false,
        message: 'ê²Œì‹œê¸€??ì°¾ì„ ???†ìŠµ?ˆë‹¤.'
      };
    }

    // ?? œ??ê²Œì‹œê¸€ ?•ì¸
    if (post.status === PostStatus.DELETED) {
      return {
        success: false,
        message: '?? œ??ê²Œì‹œê¸€?ëŠ” ?«ì–´?”ë? ?????†ìŠµ?ˆë‹¤.'
      };
    }

    // ê¸°ì¡´ ?«ì–´???•ì¸
    const existingDislike = await prisma.postDislike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    // ?¸ëœ??…˜?¼ë¡œ ?«ì–´??? ê? ì²˜ë¦¬
    const result = await prisma.$transaction(async (tx) => {
      if (existingDislike) {
        // ?«ì–´??ì·¨ì†Œ
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
        // ì¢‹ì•„?”ê? ?ˆë‹¤ë©?ë¨¼ì? ?œê±°
        await tx.postLike.deleteMany({
          where: {
            postId,
            userId
          }
        });

        // ?«ì–´??ì¶”ê?
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
      message: result.action === 'added' ? '?«ì–´?”ê? ì¶”ê??˜ì—ˆ?µë‹ˆ??' : '?«ì–´?”ê? ì·¨ì†Œ?˜ì—ˆ?µë‹ˆ??',
      data: result
    };
  } catch (error) {
    console.error('?«ì–´??ì²˜ë¦¬ ?¤íŒ¨:', error);
    return {
      success: false,
      message: '?«ì–´??ì²˜ë¦¬???¤íŒ¨?ˆìŠµ?ˆë‹¤.'
    };
  }
}

/**
 * ê²Œì‹œê¸€ ? ê³  ì²˜ë¦¬
 */
export async function reportPost(
  postId: string,
  userId: string,
  reason: string
): Promise<PostInteractionResult> {
  try {
    // ?„ìˆ˜ ?„ë“œ ê²€ì¦?
    if (!reason || reason.trim().length === 0) {
      return {
        success: false,
        message: '? ê³  ?¬ìœ ë¥??…ë ¥?´ì£¼?¸ìš”.'
      };
    }

    // ê²Œì‹œê¸€ ì¡´ì¬ ?•ì¸
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return {
        success: false,
        message: 'ê²Œì‹œê¸€??ì°¾ì„ ???†ìŠµ?ˆë‹¤.'
      };
    }

    // ?? œ??ê²Œì‹œê¸€ ?•ì¸
    if (post.status === PostStatus.DELETED) {
      return {
        success: false,
        message: '?? œ??ê²Œì‹œê¸€?€ ? ê³ ?????†ìŠµ?ˆë‹¤.'
      };
    }

    // ë³¸ì¸ ê²Œì‹œê¸€ ? ê³  ë°©ì?
    if (post.authorId === userId) {
      return {
        success: false,
        message: 'ë³¸ì¸??ê²Œì‹œê¸€?€ ? ê³ ?????†ìŠµ?ˆë‹¤.'
      };
    }

    // ì¤‘ë³µ ? ê³  ?•ì¸
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
        message: '?´ë? ? ê³ ??ê²Œì‹œê¸€?…ë‹ˆ??'
      };
    }

    // ?¸ëœ??…˜?¼ë¡œ ? ê³  ?ì„± ë°?ì¹´ìš´??ì¦ê?
    const result = await prisma.$transaction(async (tx) => {
      // ? ê³  ?ì„±
      const report = await tx.moderationReport.create({
        data: {
          targetType: ModerationTargetType.POST,
          targetId: postId,
          reporterId: userId,
          reason: reason.trim(),
          status: ModerationStatus.PENDING
        }
      });

      // ? ê³  ì¹´ìš´??ì¦ê?
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

    // ? ê³  ?„ì  ?„ê³„ì¹??•ì¸ (3ê±??´ìƒ ???ë™ ?¨ê?)
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
      message: '? ê³ ê°€ ?‘ìˆ˜?˜ì—ˆ?µë‹ˆ??',
      data: result
    };
  } catch (error) {
    console.error('? ê³  ?‘ìˆ˜ ?¤íŒ¨:', error);
    return {
      success: false,
      message: '? ê³  ?‘ìˆ˜???¤íŒ¨?ˆìŠµ?ˆë‹¤.'
    };
  }
}

/**
 * ê²Œì‹œê¸€ ?í˜¸?‘ìš© ?íƒœ ì¡°íšŒ
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
    console.error('?í˜¸?‘ìš© ?íƒœ ì¡°íšŒ ?¤íŒ¨:', error);
    return {
      liked: false,
      disliked: false,
      canReport: false
    };
  }
}
