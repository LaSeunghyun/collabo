import { getProjectStats, getRecentProjects } from '@/lib/server/projects';

export const dynamic = 'force-dynamic';

const statusLabels: Record<string, string> = {
  'DRAFT': 'ì´ˆì•ˆ',
  'PENDING': 'ê²€? ì¤‘',
  'APPROVED': '?¹ì¸??,
  'REJECTED': 'ê±°ë???,
  'ACTIVE': 'ì§„í–‰ì¤?,
  'COMPLETED': '?„ë£Œ',
  'CANCELLED': 'ì·¨ì†Œ??
};

const categoryLabels: Record<string, string> = {
  'MUSIC': '?Œì•…',
  'ART': 'ë¯¸ìˆ ',
  'FILM': '?í™”',
  'DANCE': '?„ìŠ¤',
  'THEATER': '?°ê·¹',
  'LITERATURE': 'ë¬¸í•™',
  'OTHER': 'ê¸°í?'
};

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW'
});

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export default async function AdminProjectsPage() {
  try {
    const [stats, projects] = await Promise.all([
      getProjectStats(),
      getRecentProjects()
    ]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">?„ë¡œ?íŠ¸ ê´€ë¦?/h1>
          <p className="mt-2 text-sm text-white/60">
            ?„ë¡œ?íŠ¸ ?„í™©???•ì¸?˜ê³  ?¹ì¸/ê±°ë?ë¥?ê´€ë¦¬í•˜?¸ìš”
          </p>
        </div>

        {/* ?µê³„ ì¹´ë“œ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-white/60">?„ì²´ ?„ë¡œ?íŠ¸</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-sm text-white/60">ê²€? ì¤‘</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-green-400">{stats.active}</div>
            <div className="text-sm text-white/60">ì§„í–‰ì¤?/div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-blue-400">{stats.completed}</div>
            <div className="text-sm text-white/60">?„ë£Œ</div>
          </div>
        </div>

        {/* ?„ë¡œ?íŠ¸ ëª©ë¡ */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">ìµœê·¼ ?„ë¡œ?íŠ¸</h2>
          <p className="mt-1 text-sm text-white/60">ì²˜ë¦¬ ?€ê¸?ì¤‘ì¸ ?„ë¡œ?íŠ¸</p>

          {projects.length > 0 ? (
            <div className="mt-6 space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span>{categoryLabels[project.category]}</span>
                        <span>??/span>
                        <span>{dateFormatter.format(new Date(project.createdAt))}</span>
                        <span>??/span>
                        <span>?‘ì„±?? {project.authorId}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">
                        {project.title}
                      </h3>
                      <p className="mt-1 text-xs text-white/60 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-white/60">
                        <span>ëª©í‘œê¸ˆì•¡: {currencyFormatter.format(project.targetAmount)}</span>
                        <span>?„ì¬ëª¨ì§‘: {currencyFormatter.format(project.currentAmount || 0)}</span>
                        <span>ì§„í–‰ë¥? {Math.round(((project.currentAmount || 0) / project.targetAmount) * 100)}%</span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                        {statusLabels[project.status]}
                      </span>
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-green-500/10 px-3 py-1 text-xs text-green-300 transition hover:bg-green-500/20">
                          ?¹ì¸
                        </button>
                        <button className="rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/20">
                          ê±°ë?
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 text-center text-white/60">
              ì²˜ë¦¬ ?€ê¸?ì¤‘ì¸ ?„ë¡œ?íŠ¸ê°€ ?†ìŠµ?ˆë‹¤.
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load project data:', error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">?„ë¡œ?íŠ¸ ê´€ë¦?/h1>
          <p className="mt-2 text-sm text-white/60">
            ?„ë¡œ?íŠ¸ ?„í™©???•ì¸?˜ê³  ?¹ì¸/ê±°ë?ë¥?ê´€ë¦¬í•˜?¸ìš”
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-center text-white/60">
            ?„ë¡œ?íŠ¸ ?°ì´?°ë? ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.
          </div>
        </div>
      </div>
    );
  }
}
