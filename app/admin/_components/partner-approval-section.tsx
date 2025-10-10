
import { getPartnersAwaitingApproval } from '@/lib/server/partners';

const partnerTypeLabels: Record<string, string> = {
  'STUDIO': '?¤íŠœ?”ì˜¤',
  'VENUE': 'ê³µì—°??,
  'PRODUCTION': '?œì‘??,
  'MERCHANDISE': 'êµ¿ì¦ˆ',
  'OTHER': 'ê¸°í?'
};

const dateFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' });

export async function PartnerApprovalSection() {
  try {
    const partners = await getPartnersAwaitingApproval();

    return (
      <section
        id="partners"
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">?ŒíŠ¸???¹ì¸</h3>
            <p className="text-sm text-white/60">?ˆë¡œ???ŒíŠ¸???±ë¡??ê²€? í•˜ê³??¹ì¸?˜ì„¸??/p>
          </div>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
            {partners.length}ê°??€ê¸?
          </span>
        </div>

        {partners.length > 0 ? (
          <div className="mt-6 space-y-3">
            {partners.slice(0, 3).map((partner) => (
              <div
                key={partner.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span>{partnerTypeLabels[partner.type] || partner.type}</span>
                      <span>??/span>
                      <span>{dateFormatter.format(new Date(partner.createdAt))}</span>
                    </div>
                    <h4 className="mt-1 text-sm font-medium text-white">
                      {partner.businessName}
                    </h4>
                    <p className="mt-1 text-xs text-white/60 line-clamp-2">
                      {partner.description}
                    </p>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button className="rounded-lg bg-green-500/10 px-3 py-1 text-xs text-green-300 transition hover:bg-green-500/20">
                      ?¹ì¸
                    </button>
                    <button className="rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/20">
                      ê±°ë?
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 text-center text-white/60">
            ?¹ì¸ ?€ê¸?ì¤‘ì¸ ?ŒíŠ¸?ˆê? ?†ìŠµ?ˆë‹¤.
          </div>
        )}
      </section>
    );
  } catch (error) {
    console.error('Failed to load partners data:', error);
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="text-center text-white/60">
          ?ŒíŠ¸???°ì´?°ë? ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.
        </div>
      </section>
    );
  }
}
