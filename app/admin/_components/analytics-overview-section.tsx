import { getAnalyticsOverview, VISIT_LOOKBACK_DAYS } from '@/lib/server/analytics';

const numberFormatter = new Intl.NumberFormat('en-US');

const formatDateLabel = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
};

const VISIT_LOOKBACK_DAYS_LABEL = `${VISIT_LOOKBACK_DAYS}일`;

export async function AnalyticsOverviewSection() {
  const overview = await getAnalyticsOverview();
  const recentDaily = overview.dailyVisits.slice(-7);
  const recentSignups = overview.signupTrend.slice(-7);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary/60">Analytics</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Visitor Overview</h2>
          <p className="mt-1 text-sm text-white/60">
            세션 기반 방문 로그와 회원가입 추세를 확인해 커뮤니티 활성도를 파악하세요.
          </p>
        </div>
        <span className="text-xs text-white/40">
          Updated {new Date(overview.timestamp).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">총 방문</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {numberFormatter.format(overview.totalVisits)}
          </p>
          <p className="mt-1 text-xs text-white/50">최근 {VISIT_LOOKBACK_DAYS_LABEL}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">유니크 세션</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {numberFormatter.format(overview.uniqueSessions)}
          </p>
          <p className="mt-1 text-xs text-white/50">세션 ID 기준</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">방문 유저</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {numberFormatter.format(overview.uniqueUsers)}
          </p>
          <p className="mt-1 text-xs text-white/50">계정 기준</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">활성 유저</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {numberFormatter.format(overview.activeUsers)}
          </p>
          <p className="mt-1 text-xs text-white/50">최근 7일</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">일별 방문 통계</h3>
            <span className="text-xs text-white/40">최근 7일</span>
          </header>
          <ul className="mt-4 space-y-2 text-xs text-white/70">
            {recentDaily.length === 0 ? (
              <li className="rounded-xl border border-white/10 bg-white/10 p-3 text-center text-white/50">
                수집된 방문 로그가 없습니다.
              </li>
            ) : (
              recentDaily.map((day) => (
                <li
                  key={day.date}
                  className="grid grid-cols-[80px_1fr] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3"
                >
                  <span className="font-semibold text-white">{formatDateLabel(day.date)}</span>
                  <div className="flex items-center justify-between text-white/70">
                    <span>방문 {numberFormatter.format(day.visits)}</span>
                    <span>세션 {numberFormatter.format(day.uniqueSessions)}</span>
                    <span>유저 {numberFormatter.format(day.uniqueUsers)}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">회원가입 추세</h3>
            <span className="text-xs text-white/40">최근 7일</span>
          </header>
          <ul className="mt-4 space-y-2 text-xs text-white/70">
            {recentSignups.length === 0 ? (
              <li className="rounded-xl border border-white/10 bg-white/10 p-3 text-center text-white/50">
                최근 가입한 사용자가 없습니다.
              </li>
            ) : (
              recentSignups.map((day) => (
                <li
                  key={day.date}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] p-3"
                >
                  <span className="font-semibold text-white">{formatDateLabel(day.date)}</span>
                  <span className="text-white/80">{numberFormatter.format(day.signups)}명</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
