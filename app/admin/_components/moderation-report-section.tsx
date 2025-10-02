import { ModerationStatus, ModerationTargetType } from '@/types/prisma';
import { getHandledModerationReportsByPost, getOpenModerationReports } from '@/lib/server/moderation';

type ModerationStatusValue = (typeof ModerationStatus)[keyof typeof ModerationStatus];
type ModerationTargetTypeValue =
  (typeof ModerationTargetType)[keyof typeof ModerationTargetType];

const statusLabels: Record<ModerationStatusValue, string> = {
  [ModerationStatus.PENDING]: 'Pending',
  [ModerationStatus.REVIEWING]: 'Reviewing',
  [ModerationStatus.ACTION_TAKEN]: 'Action Taken',
  [ModerationStatus.DISMISSED]: 'Dismissed'
};

const targetLabels: Record<ModerationTargetTypeValue, string> = {
  [ModerationTargetType.POST]: 'Post',
  [ModerationTargetType.COMMENT]: 'Comment'
};

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export async function ModerationReportSection() {
  try {
    const [reports, handledReports] = await Promise.all([
      getOpenModerationReports(),
      getHandledModerationReportsByPost()
    ]);

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

        <div className="mt-8 border-t border-white/5 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Resolved Cases</h3>
              <p className="mt-1 text-xs text-white/60">
                Posts with completed moderation actions, sorted by total reports.
              </p>
            </div>
          </div>

          {handledReports.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {handledReports.map((item) => {
                const displayTitle = item.postTitle ?? `Post #${item.postId}`;
                const authorLabel = item.postAuthor
                  ? item.postAuthor.name ?? item.postAuthor.id
                  : null;
                const resolvedLabel = item.lastResolvedAt
                  ? dateFormatter.format(item.lastResolvedAt)
                  : 'Resolution date unavailable';

                return (
                  <li
                    key={item.postId}
                    className="flex items-start justify-between rounded-2xl border border-white/5 bg-white/[0.05] px-4 py-3"
                  >
                    <div className="pr-4">
                      <p className="text-sm font-semibold text-white">{displayTitle}</p>
                      <p className="mt-1 text-xs text-white/60">Reports: {item.totalReports}</p>
                      {authorLabel ? (
                        <p className="text-xs text-white/50">By {authorLabel}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-white/50">Last resolved {resolvedLabel}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                      {statusLabels[item.latestStatus]}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-4 text-center text-xs text-white/60">
              There are no resolved reports yet.
            </p>
          )}
        </div>
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
