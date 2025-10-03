import {
  ModerationStatus,
  ModerationTargetType,
  type ModerationStatusValue,
  type ModerationTargetTypeValue
} from '@/types/prisma';
import { getHandledModerationReportsByPost, getOpenModerationReports } from '@/lib/server/moderation';

const statusLabels: Record<ModerationStatusValue, string> = {
  [ModerationStatus.PENDING]: '대기중',
  [ModerationStatus.REVIEWING]: '검토중',
  [ModerationStatus.ACTION_TAKEN]: '조치완료',
  [ModerationStatus.DISMISSED]: '기각됨'
};

const targetLabels: Record<ModerationTargetTypeValue, string> = {
  [ModerationTargetType.POST]: '게시글',
  [ModerationTargetType.COMMENT]: '댓글'
} as const satisfies Record<ModerationTargetTypeValue, string>;

const getTargetLabel = (type: ModerationTargetTypeValue) => targetLabels[type];

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
        <p className="text-xs uppercase tracking-wider text-primary/60">신고 대응</p>
        <h2 className="mt-1 text-lg font-semibold text-white">조치가 필요한 신고</h2>
        <p className="mt-2 text-sm text-white/60">
          새로 제출된 신고를 검토하고 빠르게 대응하여 커뮤니티를 건강하게 유지해주세요.
        </p>
      </header>

      {reports.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="flex items-start justify-between rounded-2xl border border-white/5 bg-white/[0.05] px-4 py-3"
            >
              <div className="pr-4 flex-1">
                <p className="text-sm font-medium text-white">
                  {getTargetLabel(report.targetType)} #{report.targetId}
                </p>
                <p className="mt-1 text-xs text-white/60">
                  제출일 {dateFormatter.format(report.createdAt)}
                  {report.reporter ? (
                    <span className="whitespace-nowrap">
                      {' | 신고자 '}
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
          검토 대기 중인 신고가 없습니다.
        </p>
      )}


      <div className="mt-8 border-t border-white/5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">해결된 사건</h3>
            <p className="mt-1 text-xs text-white/60">
              완료된 조치가 있는 게시물들입니다.
            </p>
          </div>
        </div>
        
        {handledReports.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {handledReports.map((report, index) => (
              <li
                key={index}
                className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
              >
                <p className="text-xs text-white/70">
                  게시글 #{report.postId} - {statusLabels[report.latestStatus as ModerationStatusValue]}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
            아직 해결된 신고가 없습니다.
          </p>
        )}
      </div>
    </section>
  );
  } catch (error) {
    console.error('신고 목록 로드 실패:', error);
    return (
      <section
        id="moderation"
        className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100"
      >
        <h2 className="text-lg font-semibold text-red-100">신고 대응</h2>
        <p className="mt-2">신고 목록을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
      </section>
    );
  }
}