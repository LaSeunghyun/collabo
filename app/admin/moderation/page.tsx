import { getModerationStats, getOpenModerationReports } from '@/lib/server/moderation';

export const dynamic = 'force-dynamic';

const statusLabels: Record<string, string> = {
  'PENDING': '?€ê¸°ì¤‘',
  'REVIEWING': 'ê²€? ì¤‘',
  'ACTION_TAKEN': 'ì¡°ì¹˜?„ë£Œ',
  'DISMISSED': 'ê¸°ê°??
};

const targetLabels: Record<string, string> = {
  'POST': 'ê²Œì‹œê¸€',
  'COMMENT': '?“ê?'
};

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
          <h1 className="text-2xl font-semibold text-white">? ê³  ê´€ë¦?/h1>
          <p className="mt-2 text-sm text-white/60">
            ì»¤ë??ˆí‹° ? ê³  ?„í™©???•ì¸?˜ê³  ?ì ˆ??ì¡°ì¹˜ë¥?ì·¨í•˜?¸ìš”
          </p>
        </div>

        {/* ?µê³„ ì¹´ë“œ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-white/60">?„ì²´ ? ê³ </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-sm text-white/60">?€ê¸°ì¤‘</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-blue-400">{stats.pending}</div>
            <div className="text-sm text-white/60">ê²€? ì¤‘</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-sm text-white/60">ì²˜ë¦¬?„ë£Œ</div>
          </div>
        </div>

        {/* ? ê³  ëª©ë¡ */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">ìµœê·¼ ? ê³ </h2>
          <p className="mt-1 text-sm text-white/60">ì²˜ë¦¬ ?€ê¸?ì¤‘ì¸ ? ê³  ëª©ë¡</p>

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
                        <span>{targetLabels[report.targetType]}</span>
                        <span>??/span>
                        <span>{dateFormatter.format(new Date(report.createdAt))}</span>
                        <span>??/span>
                        <span>? ê³ ?? {report.reporter?.name || report.reporter?.id || 'ë¯¸ì???}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">
                        ? ê³  ?¬ìœ : {report.reason}
                      </h3>
                      <p className="mt-1 text-xs text-white/60 line-clamp-2">
                        {report.reason || '? ê³  ?¬ìœ  ?†ìŒ'}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                        {statusLabels[report.status]}
                      </span>
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-green-500/10 px-3 py-1 text-xs text-green-300 transition hover:bg-green-500/20">
                          ì¡°ì¹˜
                        </button>
                        <button className="rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/20">
                          ê¸°ê°
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 text-center text-white/60">
              ì²˜ë¦¬ ?€ê¸?ì¤‘ì¸ ? ê³ ê°€ ?†ìŠµ?ˆë‹¤.
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
          <h1 className="text-2xl font-semibold text-white">? ê³  ê´€ë¦?/h1>
          <p className="mt-2 text-sm text-white/60">
            ì»¤ë??ˆí‹° ? ê³  ?„í™©???•ì¸?˜ê³  ?ì ˆ??ì¡°ì¹˜ë¥?ì·¨í•˜?¸ìš”
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-center text-white/60">
            ? ê³  ?°ì´?°ë? ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.
          </div>
        </div>
      </div>
    );
  }
}
