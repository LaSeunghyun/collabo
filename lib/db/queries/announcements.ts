import { eq, and, or, desc, count, isNull, lte } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { announcements, announcementReads, users } from '@/lib/db/schema';
import type { AnnouncementWithAuthor } from '@/types/database';

export interface AnnouncementListItem {
  id: string;
  title: string;
  content: string;
  category: string;
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

export async function getAnnouncements(params: {
  userId?: string | null;
  category?: string | null;
  includeScheduled?: boolean;
}): Promise<{ announcements: AnnouncementListItem[]; unreadCount: number }> {
  const { userId, category, includeScheduled = false } = params;
  
  try {
    const db = await getDb();
    const now = new Date();

    // 기본 조건 구성
    const conditions = [];
    
    if (!includeScheduled) {
      conditions.push(
        or(
          isNull(announcements.publishedAt),
          lte(announcements.publishedAt, now.toISOString())
        )
      );
    }

    if (category && category !== 'all') {
      conditions.push(eq(announcements.category, category));
    }

    // 공지사항 조회
    const announcementsData = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        category: announcements.category,
        isPinned: announcements.isPinned,
        publishedAt: announcements.publishedAt,
        createdAt: announcements.createdAt,
        author: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl
        },
        reads: announcementReads.userId
      })
      .from(announcements)
      .innerJoin(users, eq(announcements.authorId, users.id))
      .leftJoin(
        announcementReads,
        and(
          eq(announcementReads.announcementId, announcements.id),
          userId ? eq(announcementReads.userId, userId) : undefined
        )
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        desc(announcements.isPinned),
        desc(announcements.publishedAt),
        desc(announcements.createdAt)
      );

    // 읽음 상태 그룹화
    const announcementMap = new Map<string, any>();
    
    announcementsData.forEach((row) => {
      const announcementId = row.id;
      
      if (!announcementMap.has(announcementId)) {
        announcementMap.set(announcementId, {
          id: row.id,
          title: row.title,
          content: row.content,
          category: row.category,
          isPinned: row.isPinned,
          publishedAt: row.publishedAt,
          createdAt: row.createdAt,
          author: row.author,
          reads: []
        });
      }
      
      if (row.reads) {
        announcementMap.get(announcementId)!.reads.push({ userId: row.reads });
      }
    });

    const mapped = Array.from(announcementMap.values()).map((announcement) => 
      mapAnnouncement(announcement, userId, now)
    );

    // 읽지 않은 공지사항 수 계산
    let unreadCount = 0;
    if (userId) {
      const unreadResult = await db
        .select({ count: count() })
        .from(announcements)
        .leftJoin(
          announcementReads,
          and(
            eq(announcementReads.announcementId, announcements.id),
            eq(announcementReads.userId, userId)
          )
        )
        .where(
          and(
            or(
              isNull(announcements.publishedAt),
              lte(announcements.publishedAt, now.toISOString())
            ),
            isNull(announcementReads.id)
          )
        );
      
      unreadCount = unreadResult[0]?.count || 0;
    }

    return {
      announcements: mapped,
      unreadCount
    };
  } catch (error) {
    console.error('Failed to get announcements:', error);
    return {
      announcements: [],
      unreadCount: 0
    };
  }
}

export async function getAnnouncementById(id: string, userId?: string | null): Promise<AnnouncementWithAuthor | null> {
  try {
    const db = await getDb();
    
    const [announcement] = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        category: announcements.category,
        isPinned: announcements.isPinned,
        publishedAt: announcements.publishedAt,
        authorId: announcements.authorId,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          passwordHash: users.passwordHash,
          avatarUrl: users.avatarUrl,
          language: users.language,
          timezone: users.timezone,
          bio: users.bio,
          socialLinks: users.socialLinks,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        }
      })
      .from(announcements)
      .innerJoin(users, eq(announcements.authorId, users.id))
      .where(eq(announcements.id, id))
      .limit(1);

    if (!announcement) {
      return null;
    }

    // 읽음 상태 확인
    let isRead = false;
    if (userId) {
      const [readRecord] = await db
        .select({ id: announcementReads.id })
        .from(announcementReads)
        .where(
          and(
            eq(announcementReads.announcementId, id),
            eq(announcementReads.userId, userId)
          )
        )
        .limit(1);
      
      isRead = !!readRecord;
    }

    return {
      ...announcement,
      isRead
    };
  } catch (error) {
    console.error('Failed to get announcement by id:', error);
    return null;
  }
}

export async function markAnnouncementAsRead(id: string, userId: string): Promise<void> {
  try {
    const db = await getDb();
    const readId = `read-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db
      .insert(announcementReads)
      .values({
        id: readId,
        announcementId: id,
        userId,
        readAt: new Date().toISOString()
      })
      .onConflictDoUpdate({
        target: [announcementReads.announcementId, announcementReads.userId],
        set: {
          readAt: new Date().toISOString()
        }
      });
  } catch (error) {
    console.error('Failed to mark announcement as read:', error);
    throw new Error('공지사항 읽음 처리에 실패했습니다.');
  }
}

// Helper function
function mapAnnouncement(
  announcement: any,
  userId?: string | null,
  referenceDate: Date = new Date()
): AnnouncementListItem {
  const reads = Array.isArray(announcement.reads) ? announcement.reads : [];
  const hasRead = userId ? reads.some((read: any) => read.userId === userId) : false;
  const publishedAtInput = announcement.publishedAt ?? announcement.createdAt;
  const publishedAt = publishedAtInput ? resolvePublishedAt(publishedAtInput) : null;
  const isPublished = !announcement.publishedAt || (publishedAt ? publishedAt <= referenceDate : false);

  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    category: announcement.category,
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
}

function resolvePublishedAt(publishedAt?: string | Date | null): Date {
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
}
