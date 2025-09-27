import { NotificationType, Prisma } from '@prisma/client';

import {
  ANNOUNCEMENT_CATEGORY_LABELS,
  DEFAULT_ANNOUNCEMENT_CATEGORY,
  type AnnouncementCategory
} from '@/lib/constants/announcements';
import { prisma } from '@/lib/prisma';

export interface AnnouncementListItem {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory | string;
  isPinned: boolean;
  publishedAt: Date | null;
  author: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  isRead: boolean;
  isNew: boolean;
}

export interface AnnouncementDetail extends AnnouncementListItem {
  updatedAt: Date;
}

const mapAnnouncement = (
  announcement: Prisma.AnnouncementGetPayload<{
    include: {
      author: true;
      reads: { select: { userId: true } };
    };
  }>,
  userId?: string | null,
  referenceDate: Date = new Date()
): AnnouncementListItem => {
  const hasRead = userId ? announcement.reads.some((read) => read.userId === userId) : false;
  const publishedAt = announcement.publishedAt ?? announcement.createdAt;
  const isPublished = !announcement.publishedAt || announcement.publishedAt <= referenceDate;
  const rawCategory = announcement.category as AnnouncementCategory;
  const category = Object.prototype.hasOwnProperty.call(
    ANNOUNCEMENT_CATEGORY_LABELS,
    rawCategory
  )
    ? rawCategory
    : announcement.category;

  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    category,
    isPinned: announcement.isPinned,
    publishedAt,
    author: {
      id: announcement.author.id,
      name: announcement.author.name,
      avatarUrl: announcement.author.avatarUrl
    },
    isRead: hasRead,
    isNew: isPublished && !hasRead
  };
};

export async function getAnnouncements(params: {
  userId?: string | null;
  category?: string | null;
  includeScheduled?: boolean;
}): Promise<{ announcements: AnnouncementListItem[]; unreadCount: number }>
export async function getAnnouncements({
  userId,
  category,
  includeScheduled = false
}: {
  userId?: string | null;
  category?: string | null;
  includeScheduled?: boolean;
}): Promise<{ announcements: AnnouncementListItem[]; unreadCount: number }> {
  const now = new Date();
  const where: Prisma.AnnouncementWhereInput = {};

  if (!includeScheduled) {
    where.OR = [{ publishedAt: null }, { publishedAt: { lte: now } }];
  }

  if (category && category !== 'all') {
    where.category = category;
  }

  const announcements = await prisma.announcement.findMany({
    where,
    include: {
      author: true,
      reads: userId
        ? {
            where: { userId },
            select: { userId: true }
          }
        : { select: { userId: true } }
    },
    orderBy: [
      { isPinned: 'desc' },
      { publishedAt: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  const mapped = announcements.map((announcement) => mapAnnouncement(announcement, userId, now));

  const unreadCount = userId
    ? await prisma.announcement.count({
        where: {
          OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
          reads: {
            none: {
              userId
            }
          }
        }
      })
    : 0;

  return {
    announcements: mapped,
    unreadCount
  };
}

export async function getAnnouncementDetail(
  id: string,
  userId?: string | null
): Promise<AnnouncementDetail | null> {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      author: true,
      reads: userId
        ? {
            where: { userId },
            select: { userId: true }
          }
        : { select: { userId: true } }
    }
  });

  if (!announcement) {
    return null;
  }

  const mapped = mapAnnouncement(announcement, userId);

  return {
    ...mapped,
    updatedAt: announcement.updatedAt
  };
}

interface AnnouncementPayload {
  title: string;
  content: string;
  category?: string;
  isPinned?: boolean;
  publishedAt?: string | Date | null;
}

const resolveCategory = (category?: string | null): AnnouncementCategory => {
  if (!category) {
    return DEFAULT_ANNOUNCEMENT_CATEGORY;
  }

  const candidate = category as AnnouncementCategory;
  if (Object.prototype.hasOwnProperty.call(ANNOUNCEMENT_CATEGORY_LABELS, candidate)) {
    return candidate;
  }

  return DEFAULT_ANNOUNCEMENT_CATEGORY;
};

const resolvePublishedAt = (publishedAt?: string | Date | null): Date => {
  if (!publishedAt) {
    return new Date();
  }

  if (publishedAt instanceof Date) {
    return publishedAt;
  }

  return new Date(publishedAt);
};

export async function createAnnouncement(
  payload: AnnouncementPayload,
  authorId: string
): Promise<AnnouncementDetail> {
  const category = resolveCategory(payload.category);
  const publishedAt = resolvePublishedAt(payload.publishedAt);

  const announcement = await prisma.announcement.create({
    data: {
      title: payload.title,
      content: payload.content,
      category,
      isPinned: payload.isPinned ?? false,
      publishedAt,
      authorId
    },
    include: {
      author: true,
      reads: { select: { userId: true } }
    }
  });

  const recipients = await prisma.user.findMany({
    where: { id: { not: authorId } },
    select: { id: true }
  });

  if (recipients.length > 0) {
    await prisma.notification.createMany({
      data: recipients.map(({ id }) => ({
        userId: id,
        type: NotificationType.ANNOUNCEMENT,
        payload: {
          announcementId: announcement.id,
          title: announcement.title
        }
      })),
      skipDuplicates: true
    });
  }

  const mapped = mapAnnouncement(announcement, authorId);

  return {
    ...mapped,
    updatedAt: announcement.updatedAt
  };
}

export async function updateAnnouncement(
  id: string,
  payload: AnnouncementPayload
): Promise<AnnouncementDetail | null> {
  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      title: payload.title,
      content: payload.content,
      category: resolveCategory(payload.category),
      isPinned: payload.isPinned ?? false,
      publishedAt: resolvePublishedAt(payload.publishedAt)
    },
    include: {
      author: true,
      reads: { select: { userId: true } }
    }
  }).catch(() => null);

  if (!announcement) {
    return null;
  }

  const mapped = mapAnnouncement(announcement);
  return {
    ...mapped,
    updatedAt: announcement.updatedAt
  };
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await prisma.announcement.delete({ where: { id } });
}

export async function markAnnouncementAsRead(
  id: string,
  userId: string
): Promise<void> {
  await prisma.announcementRead.upsert({
    where: {
      announcementId_userId: {
        announcementId: id,
        userId
      }
    },
    create: {
      announcementId: id,
      userId
    },
    update: {
      readAt: new Date()
    }
  });
}

export async function getUnreadAnnouncementCount(userId: string): Promise<number> {
  const now = new Date();

  const count = await prisma.announcement.count({
    where: {
      OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
      reads: {
        none: {
          userId
        }
      }
    }
  });

  return count;
}
