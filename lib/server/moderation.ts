import {
  ModerationStatus,
  ModerationTargetType,
  type ModerationReport
} from '@/types/prisma';

import { prisma } from '@/lib/prisma';

export interface ModerationReportSummary {
  id: string;
  targetType: ModerationTargetType;
  targetId: string;
  status: ModerationStatus;
  reason: string | null;
  createdAt: Date;
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
  lastResolvedAt: Date | null;
  latestStatus: ModerationStatus;
}

const ACTIVE_REVIEW_STATUSES: ModerationStatus[] = [
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
  const reports = await prisma.moderationReport.findMany({
    where: { status: { in: ACTIVE_REVIEW_STATUSES } },
    include: {
      reporter: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  return reports.map(toSummary);
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

  const [posts, latestReports] = await Promise.all([
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
      distinct: ['targetId'],
      orderBy: [
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
  const latestLookup = new Map(latestReports.map((report) => [report.targetId, report]));

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
