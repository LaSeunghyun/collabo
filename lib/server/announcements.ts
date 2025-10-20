import {
  ANNOUNCEMENT_CATEGORY_LABELS,
  DEFAULT_ANNOUNCEMENT_CATEGORY,
  type AnnouncementCategory
} from '@/lib/constants/announcements';
import { getAnnouncements as getAnnouncementsQuery, markAnnouncementAsRead as markAsRead } from '@/lib/db/queries/announcements';

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
  try {
    return await getAnnouncementsQuery({ userId, category, includeScheduled });
  } catch (error) {
    console.error('Failed to get announcements:', error);
    return {
      announcements: [],
      unreadCount: 0
    };
  }
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

  const parsed = Date.parse(publishedAt);
  if (Number.isNaN(parsed)) {
    return new Date();
  }

  return new Date(parsed);
};

export async function createAnnouncement(
  payload: AnnouncementPayload,
  authorId: string
): Promise<AnnouncementDetail> {
  try {
    const db = await getDb();
    const category = resolveCategory(payload.category);
    const publishedAt = resolvePublishedAt(payload.publishedAt);
    const announcementId = `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 공지사항 생성
    const [announcement] = await db
      .insert(announcements)
      .values({
        id: announcementId,
        title: payload.title,
        content: payload.content,
        category,
        isPinned: payload.isPinned ?? false,
        publishedAt: publishedAt.toISOString(),
        authorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    // 작성자 정보 조회
    const [author] = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl
      })
      .from(users)
      .where(eq(users.id, authorId))
      .limit(1);

    const announcementWithAuthor = {
      ...announcement,
      author: author || { id: authorId, name: 'Unknown', avatarUrl: null },
      reads: []
    };

    const mapped = mapAnnouncement(announcementWithAuthor, authorId);

    return {
      ...mapped,
      updatedAt: announcement.updatedAt
    };
  } catch (error) {
    console.error('Failed to create announcement:', error);
    throw new Error('공지사항 생성에 실패했습니다.');
  }
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
  id: string,
  userId: string
): Promise<void> {
  try {
    await markAsRead(id, userId);
  } catch (error) {
    console.error('Failed to mark announcement as read:', error);
    throw new Error('공지사항 읽음 처리에 실패했습니다.');
  }
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
