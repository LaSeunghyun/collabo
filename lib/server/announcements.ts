import {
  ANNOUNCEMENT_CATEGORY_LABELS,
  DEFAULT_ANNOUNCEMENT_CATEGORY,
  type AnnouncementCategory
} from '@/lib/constants/announcements';

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
  announcement: any,
  userId?: string | null,
  referenceDate: Date = new Date()
): AnnouncementListItem => {
  const reads = Array.isArray(announcement.reads) ? announcement.reads : [];
  const hasRead = userId ? reads.some((read: any) => read.userId === userId) : false;
  const publishedAtInput = announcement.publishedAt ?? announcement.createdAt;
  const publishedAt = publishedAtInput ? resolvePublishedAt(publishedAtInput) : null;
  const isPublished = !announcement.publishedAt || (publishedAt ? publishedAt <= referenceDate : false);
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
    isPinned: Boolean(announcement.isPinned),
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
  const where: any = {};

  if (!includeScheduled) {
    where.OR = [{ publishedAt: null }, { publishedAt: { lte: now } }];
  }

  if (category && category !== 'all') {
    where.category = category;
  }

  // const announcements = await prisma.announcement.findMany({
  //   where,
  //   include: {
  //     author: true,
  //     reads: userId
  //       ? {
  //           where: { userId },
  //           select: { userId: true }
  //         }
  //       : { select: { userId: true } }
  //   },
  //   orderBy: [
  //     { isPinned: 'desc' },
  //     { publishedAt: 'desc' },
  //     { createdAt: 'desc' }
  //   ]
  // });

  // Mock data for now
  const announcements: any[] = [];

  const mapped = announcements.map((announcement) => mapAnnouncement(announcement, userId, now));

  // const unreadCount = userId
  //   ? await prisma.announcement.count({
  //       where: {
  //         OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  //         reads: {
  //           none: {
  //             userId
  //           }
  //         }
  //       }
  //     })
  //   : 0;

  // Mock data for now
  const unreadCount = 0;

  return {
    announcements: mapped,
    unreadCount
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getAnnouncementDetail(
  _id: string,
  _userId?: string | null
): Promise<AnnouncementDetail | null> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const announcement = await prisma.announcement.findUnique({
  //   where: { id },
  //   include: {
  //     author: true,
  //     reads: userId
  //       ? {
  //           where: { userId },
  //           select: { userId: true }
  //         }
  //       : { select: { userId: true } }
  //   }
  // });

  // if (!announcement) {
  //   return null;
  // }

  // const mapped = mapAnnouncement(announcement, userId);

  // Mock data for now
  console.log('getAnnouncementDetail called with:', _id, _userId);
  return null;
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

  // 문자?�인 경우 Date.parse�??�싱
  if (typeof publishedAt === 'string') {
    const parsed = Date.parse(publishedAt);
    if (Number.isNaN(parsed)) {
      return new Date();
    }
    return new Date(parsed);
  }

  // 기�? 경우 ?�재 ?�간 반환
  return new Date();
};

export async function createAnnouncement(
  payload: AnnouncementPayload,
  authorId: string
): Promise<AnnouncementDetail> {
  const category = resolveCategory(payload.category);
  const publishedAt = resolvePublishedAt(payload.publishedAt);

  // const announcement = await prisma.announcement.create({
  //   data: {
  //     title: payload.title,
  //     content: payload.content,
  //     category,
  //     isPinned: payload.isPinned ?? false,
  //     publishedAt,
  //     authorId
  //   },
  //   include: {
  //     author: true,
  //     reads: { select: { userId: true } }
  //   }
  // });

  // Mock data for now
  const announcement: any = {
    id: 'mock-id',
    title: payload.title,
    content: payload.content,
    category,
    isPinned: payload.isPinned ?? false,
    publishedAt,
    authorId,
    author: {
      id: authorId,
      name: 'Mock Author',
      avatarUrl: null
    },
    reads: []
  };

  // const recipients = await prisma.user.findMany({
  //   where: { id: { not: authorId } },
  //   select: { id: true }
  // });

  // if (recipients.length > 0) {
  //   await prisma.notification.createMany({
  //     data: recipients.map(({ id }) => ({
  //       userId: id,
  //       type: NotificationType.ANNOUNCEMENT,
  //       payload: {
  //         announcementId: announcement.id,
  //         title: announcement.title
  //       }
  //     })),
  //     skipDuplicates: true
  //   });
  // }

  const mapped = mapAnnouncement(announcement, authorId);

  return {
    ...mapped,
    updatedAt: announcement.updatedAt
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function updateAnnouncement(
  _id: string,
  _payload: AnnouncementPayload
): Promise<AnnouncementDetail | null> {
  // const announcement = await prisma.announcement.update({
  //   where: { id },
  //   data: {
  //     title: payload.title,
  //     content: payload.content,
  //     category: resolveCategory(payload.category),
  //     isPinned: payload.isPinned ?? false,
  //     publishedAt: resolvePublishedAt(payload.publishedAt)
  //   },
  //   include: {
  //     author: true,
  //     reads: { select: { userId: true } }
  //   }
  // }).catch(() => null);

  // Mock data for now
  console.log('updateAnnouncement called with:', _id, _payload);
  const announcement: any = null;

  if (!announcement) {
    return null;
  }

  const mapped = mapAnnouncement(announcement);
  return {
    ...mapped,
    updatedAt: announcement.updatedAt
  };
}

export async function deleteAnnouncement(_id: string): Promise<void> {
  // await prisma.announcement.delete({ where: { id } });
  console.log('deleteAnnouncement called with:', _id);
}

export async function markAnnouncementAsRead(
  _id: string,
  _userId: string
): Promise<void> {
  // await prisma.announcementRead.upsert({
  //   where: {
  //     announcementId_userId: {
  //       announcementId: id,
  //       userId
  //     }
  //   },
  //   create: {
  //     announcementId: id,
  //     userId
  //   },
  //   update: {
  //     readAt: new Date()
  //   }
  // });
  console.log('markAnnouncementAsRead called with:', _id, _userId);
}

export async function getUnreadAnnouncementCount(_userId: string): Promise<number> {
  // const now = new Date();

  // const count = await prisma.announcement.count({
  //   where: {
  //     OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  //     reads: {
  //       none: {
  //         userId
  //       }
  //     }
  //   }
  // });

  // return count;

  // Mock data for now
  console.log('getUnreadAnnouncementCount called with:', _userId);
  return 0;
}
