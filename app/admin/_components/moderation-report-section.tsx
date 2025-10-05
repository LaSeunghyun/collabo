import {
  ModerationStatus,
  ModerationTargetType,
  type ModerationStatusValue,
  type ModerationTargetTypeValue
} from '@/types/prisma';
import { getHandledModerationReportsByPost, getModerationStats, getOpenModerationReports } from '@/lib/server/moderation';
import Link from 'next/link';

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
    const [stats, reports] = await Promise.all([
      getModerationStats(),
      getOpenModerationReports(5) // 최근 5개만 표시
    ]);

  return (
    <section
      id="moderation"
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
    >
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary/60">신고 대응</p>
          <h2 className="mt-1 text-lg font-semibold text-white">신고 현황</h2>
          <p className="mt-2 text-sm text-white/60">
            커뮤니티 신고 현황을 한눈에 확인하고 관리하세요.
          </p>
        </div>
        <Link
          href="/admin/reports"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/80 transition-colors"
        >
          전체 보기
        </Link>
      </header>

      {/* 신고 통계 카드 */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/5 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">전체 신고</p>
              <p className="mt-1 text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="rounded-full bg-blue-500/10 p-2">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">처리 대기중</p>
              <p className="mt-1 text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </div>
            <div className="rounded-full bg-yellow-500/10 p-2">
              <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">처리 완료</p>
              <p className="mt-1 text-2xl font-bold text-green-400">{stats.completed}</p>
            </div>
            <div className="rounded-full bg-green-500/10 p-2">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 신고 목록 */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-white mb-4">최근 신고</h3>
        {reports.length > 0 ? (
          <ul className="space-y-3">
            {reports.map((report) => (
              <li
                key={report.id}
                className="flex items-start justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
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
                    <p className="mt-2 line-clamp-1 text-xs text-white/70">{report.reason}</p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                  {statusLabels[report.status]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
            최근 신고가 없습니다.
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