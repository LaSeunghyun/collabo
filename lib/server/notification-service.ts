import { NotificationType } from '@/types/drizzle';
import { prisma } from '@/lib/prisma';
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
 * 알림 생성
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

    return responses.success(notification, '알림이 생성되었습니다.');
  } catch (error) {
    console.error('알림 생성 실패:', error);
    return responses.error('알림 생성에 실패했습니다.');
  }
}

/**
 * 알림 목록 조회
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
    console.error('알림 목록 조회 실패:', error);
    return responses.error('알림 목록을 불러올 수 없습니다.');
  }
}

/**
 * 알림 상세 조회
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
      return responses.notFound('알림');
    }

    return responses.success(notification);
  } catch (error) {
    console.error('알림 조회 실패:', error);
    return responses.error('알림 정보를 불러올 수 없습니다.');
  }
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return responses.notFound('알림');
    }

    // 본인 알림만 읽음 처리 가능
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

    return responses.success(updatedNotification, '알림이 읽음 처리되었습니다.');
  } catch (error) {
    console.error('알림 읽음 처리 실패:', error);
    return responses.error('알림 읽음 처리에 실패했습니다.');
  }
}

/**
 * 모든 알림 읽음 처리
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

    return responses.success(null, '모든 알림이 읽음 처리되었습니다.');
  } catch (error) {
    console.error('전체 알림 읽음 처리 실패:', error);
    return responses.error('전체 알림 읽음 처리에 실패했습니다.');
  }
}

/**
 * 알림 삭제
 */
export async function deleteNotification(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return responses.notFound('알림');
    }

    // 본인 알림만 삭제 가능
    if (notification.userId !== userId) {
      return responses.forbidden();
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    return responses.success(null, '알림이 삭제되었습니다.');
  } catch (error) {
    console.error('알림 삭제 실패:', error);
    return responses.error('알림 삭제에 실패했습니다.');
  }
}

/**
 * 알림 통계 조회
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
    console.error('알림 통계 조회 실패:', error);
    return responses.error('알림 통계를 불러올 수 없습니다.');
  }
}

/**
 * 프로젝트 관련 알림 생성
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

    return responses.success(notifications, '프로젝트 알림이 생성되었습니다.');
  } catch (error) {
    console.error('프로젝트 알림 생성 실패:', error);
    return responses.error('프로젝트 알림 생성에 실패했습니다.');
  }
}

/**
 * 펀딩 성공 알림 생성
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
    title: '펀딩 성공!',
    content: `${projectTitle} 프로젝트에 ${amount.toLocaleString()}원 펀딩이 성공했습니다.`,
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
 * 새 댓글 알림 생성
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
    title: '새 댓글',
    content: `${postTitle}에 ${commentAuthor}님이 댓글을 남겼습니다.`,
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
 * 파트너 요청 알림 생성
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
    title: '파트너 요청',
    content: `${projectTitle} 프로젝트에 ${partnerName}님이 파트너 요청을 보냈습니다.`,
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
 * 정산 완료 알림 생성
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
    title: '정산 완료',
    content: `${projectTitle} 프로젝트의 정산이 완료되었습니다. (${amount.toLocaleString()}원)`,
    metadata: {
      projectId,
      projectTitle,
      amount
    },
    relatedId: projectId,
    relatedType: 'PROJECT'
  });
}
