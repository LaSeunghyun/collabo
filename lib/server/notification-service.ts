import { NotificationType } from '@/types/drizzle';
import { prisma } from '@/lib/drizzle';
import { responses } from './api-responses';

export interface NotificationCreateData {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  metadata?: any;
  relatedId?: string;
  relatedType?: string;
}

export interface NotificationFilters {
  userId?: string;
  type?: NotificationType;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

/**
 * ?Œë¦¼ ?ì„±
 */
export async function createNotification(data: NotificationCreateData) {
  try {
    const { userId, type, title, content, metadata, relatedId, relatedType } = data;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        metadata,
        relatedId,
        relatedType
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });

    return responses.success(notification, '?Œë¦¼???ì„±?˜ì—ˆ?µë‹ˆ??');
  } catch (error) {
    console.error('?Œë¦¼ ?ì„± ?¤íŒ¨:', error);
    return responses.error('?Œë¦¼ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ?Œë¦¼ ëª©ë¡ ì¡°íšŒ
 */
export async function getNotifications(filters: NotificationFilters) {
  try {
    const { userId, type, isRead, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where })
    ]);

    return responses.success({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('?Œë¦¼ ëª©ë¡ ì¡°íšŒ ?¤íŒ¨:', error);
    return responses.error('?Œë¦¼ ëª©ë¡??ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
  }
}

/**
 * ?Œë¦¼ ?ì„¸ ì¡°íšŒ
 */
export async function getNotification(notificationId: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });

    if (!notification) {
      return responses.notFound('?Œë¦¼');
    }

    return responses.success(notification);
  } catch (error) {
    console.error('?Œë¦¼ ì¡°íšŒ ?¤íŒ¨:', error);
    return responses.error('?Œë¦¼ ?•ë³´ë¥?ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
  }
}

/**
 * ?Œë¦¼ ?½ìŒ ì²˜ë¦¬
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return responses.notFound('?Œë¦¼');
    }

    // ë³¸ì¸ ?Œë¦¼ë§??½ìŒ ì²˜ë¦¬ ê°€??
    if (notification.userId !== userId) {
      return responses.forbidden();
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });

    return responses.success(updatedNotification, '?Œë¦¼???½ìŒ ì²˜ë¦¬?˜ì—ˆ?µë‹ˆ??');
  } catch (error) {
    console.error('?Œë¦¼ ?½ìŒ ì²˜ë¦¬ ?¤íŒ¨:', error);
    return responses.error('?Œë¦¼ ?½ìŒ ì²˜ë¦¬???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ëª¨ë“  ?Œë¦¼ ?½ìŒ ì²˜ë¦¬
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: { 
        userId,
        isRead: false
      },
      data: { 
        isRead: true, 
        readAt: new Date() 
      }
    });

    return responses.success(null, 'ëª¨ë“  ?Œë¦¼???½ìŒ ì²˜ë¦¬?˜ì—ˆ?µë‹ˆ??');
  } catch (error) {
    console.error('?„ì²´ ?Œë¦¼ ?½ìŒ ì²˜ë¦¬ ?¤íŒ¨:', error);
    return responses.error('?„ì²´ ?Œë¦¼ ?½ìŒ ì²˜ë¦¬???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ?Œë¦¼ ?? œ
 */
export async function deleteNotification(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return responses.notFound('?Œë¦¼');
    }

    // ë³¸ì¸ ?Œë¦¼ë§??? œ ê°€??
    if (notification.userId !== userId) {
      return responses.forbidden();
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    return responses.success(null, '?Œë¦¼???? œ?˜ì—ˆ?µë‹ˆ??');
  } catch (error) {
    console.error('?Œë¦¼ ?? œ ?¤íŒ¨:', error);
    return responses.error('?Œë¦¼ ?? œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ?Œë¦¼ ?µê³„ ì¡°íšŒ
 */
export async function getNotificationStats(userId?: string) {
  try {
    const where = userId ? { userId } : {};

    const [totalNotifications, unreadNotifications, readNotifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ 
        where: { 
          ...where, 
          isRead: false 
        } 
      }),
      prisma.notification.count({ 
        where: { 
          ...where, 
          isRead: true 
        } 
      })
    ]);

    const stats = {
      total: totalNotifications,
      unread: unreadNotifications,
      read: readNotifications
    };

    return responses.success(stats);
  } catch (error) {
    console.error('?Œë¦¼ ?µê³„ ì¡°íšŒ ?¤íŒ¨:', error);
    return responses.error('?Œë¦¼ ?µê³„ë¥?ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
  }
}

/**
 * ?„ë¡œ?íŠ¸ ê´€???Œë¦¼ ?ì„±
 */
export async function createProjectNotification(
  projectId: string,
  type: NotificationType,
  title: string,
  content: string,
  targetUserIds: string[],
  metadata?: any
) {
  try {
    const notifications = await Promise.all(
      targetUserIds.map(userId =>
        prisma.notification.create({
          data: {
            userId,
            type,
            title,
            content,
            metadata: {
              ...metadata,
              projectId
            },
            relatedId: projectId,
            relatedType: 'PROJECT'
          }
        })
      )
    );

    return responses.success(notifications, '?„ë¡œ?íŠ¸ ?Œë¦¼???ì„±?˜ì—ˆ?µë‹ˆ??');
  } catch (error) {
    console.error('?„ë¡œ?íŠ¸ ?Œë¦¼ ?ì„± ?¤íŒ¨:', error);
    return responses.error('?„ë¡œ?íŠ¸ ?Œë¦¼ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ?€???±ê³µ ?Œë¦¼ ?ì„±
 */
export async function createFundingSuccessNotification(
  projectId: string,
  projectTitle: string,
  amount: number,
  userId: string
) {
  return await createNotification({
    userId,
    type: NotificationType.FUNDING_SUCCESS,
    title: '?€???±ê³µ!',
    content: `${projectTitle} ?„ë¡œ?íŠ¸??${amount.toLocaleString()}???€?©ì´ ?±ê³µ?ˆìŠµ?ˆë‹¤.`,
    metadata: {
      projectId,
      projectTitle,
      amount
    },
    relatedId: projectId,
    relatedType: 'PROJECT'
  });
}

/**
 * ???“ê? ?Œë¦¼ ?ì„±
 */
export async function createNewCommentNotification(
  postId: string,
  postTitle: string,
  commentAuthor: string,
  projectOwnerId: string
) {
  return await createNotification({
    userId: projectOwnerId,
    type: NotificationType.NEW_COMMENT,
    title: '???“ê?',
    content: `${postTitle}??${commentAuthor}?˜ì´ ?“ê????¨ê²¼?µë‹ˆ??`,
    metadata: {
      postId,
      postTitle,
      commentAuthor
    },
    relatedId: postId,
    relatedType: 'POST'
  });
}

/**
 * ?ŒíŠ¸???”ì²­ ?Œë¦¼ ?ì„±
 */
export async function createPartnerRequestNotification(
  projectId: string,
  projectTitle: string,
  partnerName: string,
  projectOwnerId: string
) {
  return await createNotification({
    userId: projectOwnerId,
    type: NotificationType.PARTNER_REQUEST,
    title: '?ŒíŠ¸???”ì²­',
    content: `${projectTitle} ?„ë¡œ?íŠ¸??${partnerName}?˜ì´ ?ŒíŠ¸???”ì²­??ë³´ëƒˆ?µë‹ˆ??`,
    metadata: {
      projectId,
      projectTitle,
      partnerName
    },
    relatedId: projectId,
    relatedType: 'PROJECT'
  });
}

/**
 * ?•ì‚° ?„ë£Œ ?Œë¦¼ ?ì„±
 */
export async function createSettlementPaidNotification(
  projectId: string,
  projectTitle: string,
  amount: number,
  userId: string
) {
  return await createNotification({
    userId,
    type: NotificationType.SETTLEMENT_PAID,
    title: '?•ì‚° ?„ë£Œ',
    content: `${projectTitle} ?„ë¡œ?íŠ¸???•ì‚°???„ë£Œ?˜ì—ˆ?µë‹ˆ?? (${amount.toLocaleString()}??`,
    metadata: {
      projectId,
      projectTitle,
      amount
    },
    relatedId: projectId,
    relatedType: 'PROJECT'
  });
}
