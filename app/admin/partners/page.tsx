import { getPartnersAwaitingApproval } from '@/lib/server/partners';
import { type PartnerTypeType } from '@/types/drizzle';

const partnerTypeLabels: Record<PartnerTypeType, string> = {
  'STUDIO': '?¤íŠœ?”ì˜¤',
  'VENUE': 'ê³µì—°??,
  'PRODUCTION': '?œì‘??,
  'MERCHANDISE': 'êµ¿ì¦ˆ',
  'OTHER': 'ê¸°í?'
};

const dateFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' });

export default async function AdminPartnersPage() {
  try {
    const partners = await getPartnersAwaitingApproval();

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">?ŒíŠ¸???¹ì¸</h1>
          <p className="mt-2 text-sm text-white/60">
            ê²€ì¦ì„ ê¸°ë‹¤ë¦¬ëŠ” ?ŒíŠ¸?ˆë“¤??ê²€? í•˜ê³??‘ì—… ì¤€ë¹„ê? ???ŒíŠ¸?ˆë“¤???¹ì¸?´ì£¼?¸ìš”.
          </p>
        </div>

        {partners.length > 0 ? (
          <div className="space-y-4">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="rounded-2xl border border-white/5 bg-white/[0.05] p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white">{partner.name}</h3>
                    <p className="mt-1 text-sm text-white/60">
                      {partnerTypeLabels[partner.type]} | ê°€?…ì¼ {dateFormatter.format(partner.createdAt)}
                    </p>
                    {partner.description && (
                      <p className="mt-3 text-sm text-white/70 line-clamp-3">
                        {partner.description}
                      </p>
                    )}
                    {partner.portfolioUrl && (
                      <p className="mt-2 text-sm text-blue-400">
                        ?¬íŠ¸?´ë¦¬?? <a href={partner.portfolioUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {partner.portfolioUrl}
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                      ?€ê¸°ì¤‘
                    </span>
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                        ?¹ì¸
                      </button>
                      <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                        ê±°ë?
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-8 py-12 text-center">
            <p className="text-sm text-white/60">ê²€???€ê¸?ì¤‘ì¸ ?ŒíŠ¸??? ì²­???†ìŠµ?ˆë‹¤.</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('?ŒíŠ¸??ëª©ë¡ ë¡œë“œ ?¤íŒ¨:', error);
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100">
        <h2 className="text-lg font-semibold text-red-100">?ŒíŠ¸???¹ì¸</h2>
        <p className="mt-2">?ŒíŠ¸??? ì²­??ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤. ? ì‹œ ???¤ì‹œ ?œë„?´ì£¼?¸ìš”.</p>
      </div>
    );
  }
}
