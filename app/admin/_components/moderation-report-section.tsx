// import { moderationStatusEnum, moderationTargetTypeEnum } from '@/lib/db/schema'; // TODO: Drizzle로 전환 필요
import { getModerationStats, getOpenModerationReports } from '@/lib/server/moderation';
import Link from 'next/link';

const statusLabels: Record<string, string> = {
  'PENDING': '대기중',
  'REVIEWING': '검토중',
  'ACTION_TAKEN': '조치완료',
  'DISMISSED': '기각됨'
};

const targetLabels: Record<string, string> = {
  'POST': '게시글',
  'COMMENT': '댓글'
};

const getTargetLabel = (type: string) => targetLabels[type];

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export async function ModerationReportSection() {
  try {
    const [stats, reports] = await Promise.all([
      getModerationStats(),
      getOpenModerationReports()
    ]);

    return (
      <section
        id="moderation"
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">신고 관리</h3>
            <p className="text-sm text-white/60">커뮤니티 신고 현황을 확인하고 조치하세요</p>
          </div>
          <Link
            href="/admin/moderation"
            className="rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            전체 보기
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-white/60">전체 신고</div>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-sm text-white/60">대기중</div>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
            <div className="text-sm text-white/60">처리완료</div>
          </div>
        </div>

        {reports.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium text-white/80">최근 신고</h4>
            {reports.slice(0, 3).map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span>{getTargetLabel(report.targetType)}</span>
                      <span>•</span>
                      <span>{dateFormatter.format(new Date(report.createdAt))}</span>
                    </div>
                    <p className="mt-1 text-sm text-white line-clamp-2">
                      {report.reason}
                    </p>
                  </div>
                  <span className="ml-4 rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                    {statusLabels[report.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  } catch (error) {
    console.error('Failed to load moderation data:', error);
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="text-center text-white/60">
          신고 데이터를 불러올 수 없습니다.
        </div>
      </section>
    );
  }
}