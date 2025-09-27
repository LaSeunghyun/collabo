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
