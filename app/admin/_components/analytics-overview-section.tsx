'use client';

import { useTranslation } from 'react-i18next';

import { getAnalyticsOverview, VISIT_LOOKBACK_DAYS } from '@/lib/server/analytics';

const numberFormatter = new Intl.NumberFormat('en-US');

const formatDateLabel = (iso: string) => {
  if (typeof window === 'undefined') return iso;
  try {
    const date = new Date(iso);
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  } catch {
    return iso;
  }
};

interface AnalyticsOverviewSectionProps {
  overview: Awaited<ReturnType<typeof getAnalyticsOverview>>;
}

export function AnalyticsOverviewSection({ overview }: AnalyticsOverviewSectionProps) {
  const { t } = useTranslation();
  const recentDaily = overview.dailyVisits.slice(-7);
  const recentSignups = overview.signupTrend.slice(-7);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary/60">Analytics</p>
          <h2 className="mt-1 text-lg font-semibold text-white">{t('admin.analytics.title')}</h2>
          <p className="mt-1 text-sm text-white/60">
            {t('admin.analytics.description')}
          </p>
        </div>
        <span className="text-xs text-white/40">
          {t('admin.analytics.updated', {
            time: (() => {
              try {
                if (typeof window === 'undefined') return overview.timestamp;
                return new Date(overview.timestamp).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' });
              } catch {
                return overview.timestamp;
              }
            })()
          })}
        </span>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t('admin.analytics.metrics.totalVisits')}</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {numberFormatter.format(overview.totalVisits)}
          </p>
          <p className="mt-1 text-xs text-white/50">{t('admin.analytics.metrics.recentDays', { days: VISIT_LOOKBACK_DAYS })}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t('admin.analytics.metrics.uniqueSessions')}</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {numberFormatter.format(overview.uniqueSessions)}
          </p>
          <p className="mt-1 text-xs text-white/50">{t('admin.analytics.metrics.sessionBased')}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t('admin.analytics.metrics.uniqueUsers')}</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {numberFormatter.format(overview.uniqueUsers)}
          </p>
          <p className="mt-1 text-xs text-white/50">{t('admin.analytics.metrics.accountBased')}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t('admin.analytics.metrics.activeUsers')}</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {numberFormatter.format(overview.activeUsers)}
          </p>
          <p className="mt-1 text-xs text-white/50">{t('admin.analytics.metrics.last7Days')}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{t('admin.analytics.charts.dailyVisits')}</h3>
            <span className="text-xs text-white/40">{t('admin.analytics.charts.recent7Days')}</span>
          </header>
          <ul className="mt-4 space-y-2 text-xs text-white/70">
            {recentDaily.length === 0 ? (
              <li className="rounded-xl border border-white/10 bg-white/10 p-3 text-center text-white/50">
                {t('admin.analytics.empty.visits')}
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
            <h3 className="text-sm font-semibold text-white">{t('admin.analytics.charts.signupTrend')}</h3>
            <span className="text-xs text-white/40">{t('admin.analytics.charts.recent7Days')}</span>
          </header>
          <ul className="mt-4 space-y-2 text-xs text-white/70">
            {recentSignups.length === 0 ? (
              <li className="rounded-xl border border-white/10 bg-white/10 p-3 text-center text-white/50">
                {t('admin.analytics.empty.signups')}
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
