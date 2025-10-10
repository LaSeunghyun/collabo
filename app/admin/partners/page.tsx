import { getPartnerStats, getRecentPartners } from '@/lib/server/partners';

export const dynamic = 'force-dynamic';

const statusLabels: Record<string, string> = {
  'PENDING': '?€ê¸°ì¤‘',
  'APPROVED': '?¹ì¸??,
  'REJECTED': 'ê±°ë???,
  'SUSPENDED': '?•ì???
};

const typeLabels: Record<string, string> = {
  'STUDIO': '?¤íŠœ?”ì˜¤',
  'VENUE': 'ê³µì—°??,
  'PRODUCTION': '?œì‘ ?¤íŠœ?”ì˜¤',
  'MERCHANDISE': 'ë¨¸ì²œ?¤ì´ì¦?,
  'OTHER': 'ê¸°í?'
};

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export default async function AdminPartnersPage() {
  try {
    const [stats, partners] = await Promise.all([
      getPartnerStats(),
      getRecentPartners()
    ]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">?ŒíŠ¸??ê´€ë¦?/h1>
          <p className="mt-2 text-sm text-white/60">
            ?ŒíŠ¸???±ë¡ ?„í™©???•ì¸?˜ê³  ?¹ì¸/ê±°ë?ë¥?ê´€ë¦¬í•˜?¸ìš”
          </p>
        </div>

        {/* ?µê³„ ì¹´ë“œ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-white/60">?„ì²´ ?ŒíŠ¸??/div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-sm text-white/60">?€ê¸°ì¤‘</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
            <div className="text-sm text-white/60">?¹ì¸??/div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
            <div className="text-sm text-white/60">ê±°ë???/div>
          </div>
        </div>

        {/* ?ŒíŠ¸??ëª©ë¡ */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">ìµœê·¼ ?ŒíŠ¸???±ë¡</h2>
          <p className="mt-1 text-sm text-white/60">ì²˜ë¦¬ ?€ê¸?ì¤‘ì¸ ?ŒíŠ¸???±ë¡ ? ì²­</p>

          {partners.length > 0 ? (
            <div className="mt-6 space-y-4">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span>{typeLabels[partner.type]}</span>
                        <span>??/span>
                        <span>{dateFormatter.format(new Date(partner.createdAt))}</span>
                        <span>??/span>
                        <span>?±ë¡?? {partner.user.id}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">
                        {partner.name}
                      </h3>
                      <p className="mt-1 text-xs text-white/60 line-clamp-2">
                        {partner.description}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-white/60">
                        <span>?°ë½ì²? {partner.contactInfo}</span>
                        <span>?„ì¹˜: {partner.location}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                        {partner.verified ? '?¹ì¸?? : '?€ê¸°ì¤‘'}
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
              ì²˜ë¦¬ ?€ê¸?ì¤‘ì¸ ?ŒíŠ¸???±ë¡???†ìŠµ?ˆë‹¤.
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load partner data:', error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">?ŒíŠ¸??ê´€ë¦?/h1>
          <p className="mt-2 text-sm text-white/60">
            ?ŒíŠ¸???±ë¡ ?„í™©???•ì¸?˜ê³  ?¹ì¸/ê±°ë?ë¥?ê´€ë¦¬í•˜?¸ìš”
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-center text-white/60">
            ?ŒíŠ¸???°ì´?°ë? ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.
          </div>
        </div>
      </div>
    );
  }
}
