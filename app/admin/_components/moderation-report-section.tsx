import { ModerationStatus, ModerationTargetType } from '@/types/prisma';

import { getOpenModerationReports } from '@/lib/server/moderation';

const statusLabels: Record<ModerationStatus, string> = {
  [ModerationStatus.PENDING]: '신고 접수',
  [ModerationStatus.REVIEWING]: '검토 중',
  [ModerationStatus.ACTION_TAKEN]: '조치 완료',
  [ModerationStatus.DISMISSED]: '기각'
};

const targetLabels: Record<ModerationTargetType, string> = {
  [ModerationTargetType.POST]: '게시물',
  [ModerationTargetType.COMMENT]: '댓글'
};

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export async function ModerationReportSection() {
  const reports = await getOpenModerationReports();

  return (
    <section
      id="moderation"
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
    >
      <header>
        <p className="text-xs uppercase tracking-wider text-primary/60">신고 대응</p>
        <h2 className="mt-1 text-lg font-semibold text-white">처리 대기 신고</h2>
        <p className="mt-2 text-sm text-white/60">
          커뮤니티의 신뢰를 유지하기 위해 신고된 콘텐츠를 빠르게 확인하세요.
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
                  접수 {dateFormatter.format(report.createdAt)}
                  {report.reporter ? ` · 신고자 ${report.reporter.name ?? report.reporter.id}` : ''}
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
          대응이 필요한 신고가 없습니다.
        </p>
      )}
    </section>
  );
}
