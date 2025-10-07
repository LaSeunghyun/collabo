import { eq, and, inArray, desc, count } from 'drizzle-orm';
import {
  ModerationStatus,
  ModerationTargetType,
  type ModerationReport
} from '@/types/prisma';

import { db } from '@/lib/db/client';
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

const ACTIVE_REVIEW_STATUSES: string[] = [
  ModerationStatus.PENDING,
  ModerationStatus.REVIEWING
];

type ReportWithRelations = ModerationReport & {
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
};

export const getModerationStats = async () => {
  const [totalReportsResult, pendingReportsResult, completedReportsResult] = await Promise.all([
    db.select({ count: count() }).from(moderationReports),
    db.select({ count: count() }).from(moderationReports).where(inArray(moderationReports.status, ACTIVE_REVIEW_STATUSES)),
    db.select({ count: count() }).from(moderationReports).where(and(
      eq(moderationReports.status, ModerationStatus.RESOLVED)
    ))
  ]);

  return {
    total: totalReportsResult[0]?.count || 0,
    pending: pendingReportsResult[0]?.count || 0,
    completed: completedReportsResult[0]?.count || 0
  };
};

export const getReportedPostDetails = async (postId: string) => {
  const [post, reports] = await Promise.all([
    prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } }
      }
    }),
    prisma.moderationReport.findMany({
      where: { 
        targetType: ModerationTargetType.POST,
        targetId: postId 
      },
      include: {
        reporter: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  if (!post) {
    throw new Error('Post not found');
  }

  return {
    post,
    reports
  };
};

export const updateModerationStatus = async (
  reportId: string, 
  status: ModerationStatusType, 
  adminId: string,
  actionNote?: string
) => {
  return await prisma.moderationReport.update({
    where: { id: reportId },
    data: {
      status,
      resolvedAt: new Date(),
      notes: actionNote ? { note: actionNote, adminId } : undefined
    }
  });
};

export const getHandledModerationReportsByPost = async (limit = 8) => {
  const grouped = await prisma.moderationReport.groupBy({
    by: ['targetId'],
    where: {
      targetType: ModerationTargetType.POST,
      status: { notIn: ACTIVE_REVIEW_STATUSES }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit
  });

  if (grouped.length === 0) {
    return [] as ModerationHandledPostSummary[];
  }

  const targetIds = grouped.map((group) => group.targetId);

  const [posts, orderedReports] = await Promise.all([
    prisma.post.findMany({
      where: { id: { in: targetIds } },
      select: {
        id: true,
        title: true,
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }),
    prisma.moderationReport.findMany({
      where: {
        targetType: ModerationTargetType.POST,
        status: { notIn: ACTIVE_REVIEW_STATUSES },
        targetId: { in: targetIds }
      },
      orderBy: [
        { targetId: 'asc' },
        { resolvedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        targetId: true,
        status: true,
        resolvedAt: true,
        createdAt: true
      }
    })
  ]);

  const postLookup = new Map(posts.map((post) => [post.id, post]));
  const latestLookup = new Map<string, (typeof orderedReports)[number]>();

  for (const report of orderedReports) {
    if (!latestLookup.has(report.targetId)) {
      latestLookup.set(report.targetId, report);
    }
  }

  return grouped.map((group) => {
    const post = postLookup.get(group.targetId);
    const latest = latestLookup.get(group.targetId);

    return {
      postId: group.targetId,
      postTitle: post?.title ?? null,
      postAuthor: post?.author
        ? {
            id: post.author.id,
            name: post.author.name ?? null
          }
        : null,
      totalReports: group._count.id,
      lastResolvedAt: latest?.resolvedAt ?? latest?.createdAt ?? null,
      latestStatus: latest?.status ?? ModerationStatus.ACTION_TAKEN
    } satisfies ModerationHandledPostSummary;
  });
};
