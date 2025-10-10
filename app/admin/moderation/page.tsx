import { getModerationStats, getOpenModerationReports } from '@/lib/server/moderation';
import {
  MODERATION_STATUS_LABELS,
  MODERATION_TARGET_TYPE_LABELS,
  ModerationStatusValue,
  ModerationTargetTypeValue,
} from '@/lib/constants/enums';

export const dynamic = 'force-dynamic';

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export default async function AdminModerationPage() {
  try {
    const [stats, reports] = await Promise.all([
      getModerationStats(),
      getOpenModerationReports()
    ]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">신고 관리</h1>
          <p className="mt-2 text-sm text-white/60">
            커뮤니티 신고 현황을 확인하고 적절한 조치를 취하세요
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-white/60">전체 신고</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-sm text-white/60">대기중</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-blue-400">{stats.pending}</div>
            <div className="text-sm text-white/60">검토중</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-sm text-white/60">처리완료</div>
          </div>
        </div>

        {/* 신고 목록 */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">최근 신고</h2>
          <p className="mt-1 text-sm text-white/60">처리 대기중인 신고 목록</p>

          {reports.length > 0 ? (
            <div className="mt-6 space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span>{MODERATION_TARGET_TYPE_LABELS[report.targetType as ModerationTargetTypeValue]}</span>
                        <span>•</span>
                        <span>{dateFormatter.format(new Date(report.createdAt))}</span>
                        <span>•</span>
                        <span>신고자: {report.reporter?.name || report.reporter?.id || '미상'}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">
                        신고 사유: {report.reason}
                      </h3>
                      <p className="mt-1 text-xs text-white/60 line-clamp-2">
                        {report.reason || '신고 사유 없음'}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                        {MODERATION_STATUS_LABELS[report.status as ModerationStatusValue]}
                      </span>
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-green-500/10 px-3 py-1 text-xs text-green-300 transition hover:bg-green-500/20">
                          조치
                        </button>
                        <button className="rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/20">
                          기각
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 text-center text-white/60">
              처리 대기중인 신고가 없습니다.
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load moderation data:', error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">신고 관리</h1>
          <p className="mt-2 text-sm text-white/60">
            커뮤니티 신고 현황을 확인하고 적절한 조치를 취하세요
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-center text-white/60">
            신고 데이터를 불러오는데 실패했습니다.
          </div>
        </div>
      </div>
    );
  }
}