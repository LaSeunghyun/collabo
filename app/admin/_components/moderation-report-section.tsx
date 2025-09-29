import { ModerationStatus, ModerationTargetType } from '@/types/prisma';

import { getOpenModerationReports } from '@/lib/server/moderation';

const statusLabels: Record<ModerationStatus, string> = {
  [ModerationStatus.PENDING]: 'Pending',
  [ModerationStatus.REVIEWING]: 'Reviewing',
  [ModerationStatus.ACTION_TAKEN]: 'Action Taken',
  [ModerationStatus.DISMISSED]: 'Dismissed'
};

const targetLabels: Record<ModerationTargetType, string> = {
  [ModerationTargetType.POST]: 'Post',
  [ModerationTargetType.COMMENT]: 'Comment'
};

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export async function ModerationReportSection() {
  try {
    const reports = await getOpenModerationReports();

    return (
      <section
        id="moderation"
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
      >
        <header>
          <p className="text-xs uppercase tracking-wider text-primary/60">Moderation</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Reports Requiring Action</h2>
          <p className="mt-2 text-sm text-white/60">
            Review newly submitted reports and keep the community healthy by responding quickly.
          </p>
        </header>

        {reports.length > 0 ? (
          <ul className="mt-6 space-y-3">
            {reports.map((report) => (
              <li
                key={report.id}
                className="flex items-start justify-between rounded-2xl border border-white/5 bg-white/[0.05] px-4 py-3"
              >
                <div className="pr-4">
                  <p className="text-sm font-medium text-white">
                    {targetLabels[report.targetType]} #{report.targetId}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    Submitted {dateFormatter.format(report.createdAt)}
                    {report.reporter ? (
                      <span className="whitespace-nowrap">
                        {' | Reported by '}
                        {report.reporter.name ?? report.reporter.id}
                      </span>
                    ) : null}
                  </p>
                  {report.reason ? (
                    <p className="mt-2 line-clamp-2 text-xs text-white/70">{report.reason}</p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                  {statusLabels[report.status]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
            There are no moderation reports waiting for review.
          </p>
        )}
      </section>
    );
  } catch (error) {
    console.error('Failed to load moderation reports', error);
    return (
      <section
        id="moderation"
        className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100"
      >
        <h2 className="text-lg font-semibold text-red-100">Moderation Reports</h2>
        <p className="mt-2">We could not load the moderation reports. Please try again in a moment.</p>
      </section>
    );
  }
}
