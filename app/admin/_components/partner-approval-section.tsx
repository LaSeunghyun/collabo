import { type PartnerTypeType } from '@/types/drizzle';

import { getPartnersAwaitingApproval } from '@/lib/server/partners';

const partnerTypeLabels: Record<PartnerTypeType, string> = {
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
        id="partner-approvals"
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
      >
        <header>
          <p className="text-xs uppercase tracking-wider text-primary/60">?ŒíŠ¸???¹ì¸</p>
          <h2 className="mt-1 text-lg font-semibold text-white">?¹ì¸ ?€ê¸?ì¤‘ì¸ ?ŒíŠ¸???„ë¡œ??/h2>
          <p className="mt-2 text-sm text-white/60">
            ê²€ì¦ì„ ê¸°ë‹¤ë¦¬ëŠ” ?ŒíŠ¸?ˆë“¤??ê²€? í•˜ê³??‘ì—… ì¤€ë¹„ê? ???ŒíŠ¸?ˆë“¤???¹ì¸?´ì£¼?¸ìš”.
          </p>
        </header>

        {partners.length > 0 ? (
          <ul className="mt-6 space-y-3">
            {partners.map((partner) => (
              <li
                key={partner.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.05] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{partner.name}</p>
                  <p className="text-xs text-white/50">
                    {partnerTypeLabels[partner.type]} | ê°€?…ì¼ {dateFormatter.format(partner.createdAt)}
                  </p>
                </div>
                <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                  ?€ê¸°ì¤‘
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
            ê²€???€ê¸?ì¤‘ì¸ ?ŒíŠ¸??? ì²­???†ìŠµ?ˆë‹¤.
          </p>
        )}
      </section>
    );
  } catch (error) {
    console.error('Failed to load partners awaiting approval', error);
    return (
      <section
        id="partner-approvals"
        className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100"
      >
        <h2 className="text-lg font-semibold text-red-100">?ŒíŠ¸???¹ì¸</h2>
        <p className="mt-2">?ŒíŠ¸??? ì²­??ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤. ? ì‹œ ???¤ì‹œ ?œë„?´ì£¼?¸ìš”.</p>
      </section>
    );
  }
}
