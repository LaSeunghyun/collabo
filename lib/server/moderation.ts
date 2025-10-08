import { eq, and, inArray, desc, count, notInArray } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { moderationReports, users, posts } from '@/lib/db/schema';

export interface ModerationReportSummary {
  id: string;
  targetType: string;
  targetId: string;
  status: string;
  reason: string | null;
  createdAt: string;
  reporter: {
    id: string;
    name: string | null;
  } | null;
}

export interface ModerationHandledPostSummary {
  postId: string;
  postTitle: string | null;
  postAuthor:
    | {
        id: string;
        name: string | null;
      }
    | null;
  totalReports: number;
  lastResolvedAt: string | null;
  latestStatus: string;
}

const ACTIVE_REVIEW_STATUSES = ['PENDING', 'REVIEWING'] as ('PENDING' | 'REVIEWING')[];

type ReportWithRelations = {
  id: string;
  targetType: string;
  targetId: string;
  status: string;
  reason: string | null;
  createdAt: string;
  reporter: { id: string; name: string | null } | null;
};

const toSummary = (report: ReportWithRelations): ModerationReportSummary => ({
  id: report.id,
  targetType: report.targetType,
  targetId: report.targetId,
  status: report.status,
  reason: report.reason ?? null,
  createdAt: report.createdAt,
  reporter: report.reporter
    ? {
        id: report.reporter.id,
        name: report.reporter.name ?? null
      }
    : null
});

export const getOpenModerationReports = async (limit = 5) => {
  try {
    const reports = await db
      .select({
        id: moderationReports.id,
        targetType: moderationReports.targetType,
        targetId: moderationReports.targetId,
        status: moderationReports.status,
        reason: moderationReports.reason,
        createdAt: moderationReports.createdAt,
        reporter: {
          id: users.id,
          name: users.name
        }
      })
      .from(moderationReports)
      .leftJoin(users, eq(moderationReports.reporterId, users.id))
      .where(inArray(moderationReports.status, ACTIVE_REVIEW_STATUSES))
      .orderBy(desc(moderationReports.createdAt))
      .limit(limit);

    return reports.map(toSummary);
  } catch (error) {
    console.error('Failed to get open moderation reports:', error);
    return [];
  }
};

export const getModerationStats = async () => {
  try {
    const db = await getDb();
    const [totalReportsResult, pendingReportsResult, completedReportsResult] = await Promise.all([
      db.select({ count: count() }).from(moderationReports),
      db.select({ count: count() }).from(moderationReports).where(inArray(moderationReports.status, ACTIVE_REVIEW_STATUSES)),
      db.select({ count: count() }).from(moderationReports).where(
        eq(moderationReports.status, 'ACTION_TAKEN')
      )
    ]);

    return {
      total: totalReportsResult[0]?.count || 0,
      pending: pendingReportsResult[0]?.count || 0,
      completed: completedReportsResult[0]?.count || 0
    };
  } catch (error) {
    console.error('Failed to get moderation stats:', error);
    return {
      total: 0,
      pending: 0,
      completed: 0
    };
  }
};

export const getReportedPostDetails = async (postId: string) => {
  try {
    const [post, reports] = await Promise.all([
      db
        .select({
          id: posts.id,
          title: posts.title,
          content: posts.content,
          createdAt: posts.createdAt,
          author: {
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl
          }
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(eq(posts.id, postId))
        .limit(1),
      db
        .select({
          id: moderationReports.id,
          targetType: moderationReports.targetType,
          targetId: moderationReports.targetId,
          status: moderationReports.status,
          reason: moderationReports.reason,
          createdAt: moderationReports.createdAt,
          reporter: {
            id: users.id,
            name: users.name
          }
        })
        .from(moderationReports)
        .leftJoin(users, eq(moderationReports.reporterId, users.id))
        .where(and(
          eq(moderationReports.targetType, 'POST'),
          eq(moderationReports.targetId, postId)
        ))
        .orderBy(desc(moderationReports.createdAt))
    ]);

    const postData = post[0];
    if (!postData) {
      throw new Error('Post not found');
    }

    return {
      post: postData,
      reports: reports.map(report => ({
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        status: report.status,
        reason: report.reason,
        createdAt: report.createdAt,
        reporter: report.reporter
      }))
    };
  } catch (error) {
    console.error('Failed to get reported post details:', error);
    throw error;
  }
};

export const updateModerationStatus = async (
  reportId: string, 
  status: 'PENDING' | 'REVIEWING' | 'ACTION_TAKEN' | 'DISMISSED', 
  adminId: string,
  actionNote?: string
) => {
  try {
    const [updatedReport] = await db
      .update(moderationReports)
      .set({
        status,
        resolvedAt: new Date().toISOString(),
        notes: actionNote ? { note: actionNote, adminId } : undefined
      })
      .where(eq(moderationReports.id, reportId))
      .returning();

    return updatedReport;
  } catch (error) {
    console.error('Failed to update moderation status:', error);
    throw error;
  }
};

export const getHandledModerationReportsByPost = async (limit = 8) => {
  try {
    // 간단한 구현으로 변경 - 복잡한 groupBy 대신 기본 쿼리 사용
    const reports = await db
      .select({
        id: moderationReports.id,
        targetId: moderationReports.targetId,
        status: moderationReports.status,
        resolvedAt: moderationReports.resolvedAt,
        createdAt: moderationReports.createdAt,
        postTitle: posts.title,
        authorName: users.name,
        authorId: users.id
      })
      .from(moderationReports)
      .leftJoin(posts, eq(moderationReports.targetId, posts.id))
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(and(
        eq(moderationReports.targetType, 'POST'),
        notInArray(moderationReports.status, ACTIVE_REVIEW_STATUSES)
      ))
      .orderBy(desc(moderationReports.resolvedAt))
      .limit(limit);

    return reports.map(report => ({
      postId: report.targetId,
      postTitle: report.postTitle ?? null,
      postAuthor: report.authorId ? {
        id: report.authorId,
        name: report.authorName ?? null
      } : null,
      totalReports: 1, // 단순화
      lastResolvedAt: report.resolvedAt ?? report.createdAt ?? null,
      latestStatus: report.status ?? 'ACTION_TAKEN'
    } satisfies ModerationHandledPostSummary));
  } catch (error) {
    console.error('Failed to get handled moderation reports by post:', error);
    return [];
  }
};