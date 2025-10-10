// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth/options';
import { PartnerRegistrationPanel } from './partner-registration-panel';

const statusBadge = (verified: boolean) =>
  verified ? '?¸ì¦' : 'ê²€? ì¤‘';

export default async function PartnersPage() {
  // const session = await getServerSession(authOptions);
  // const user = session?.user;

  try {
    // ?„ì‹œë¡?ë¹??ŒíŠ¸???°ì´???¬ìš©
    const partners = [];

    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20">
        <header className="pt-6">
          <h1 className="text-3xl font-semibold text-white">?ŒíŠ¸??ë§¤ì¹­</h1>
          <p className="mt-2 text-sm text-white/60">
            ?„í‹°?¤íŠ¸?€ ?ŒíŠ¸?ˆë? ?°ê²°?˜ëŠ” ?Œë«?¼ì…?ˆë‹¤. ?¤ì–‘???ŒíŠ¸?ˆì? ?‘ì—…?˜ì—¬ ???˜ì? ?„ë¡œ?íŠ¸ë¥?ë§Œë“¤?´ë³´?¸ìš”.
          </p>
        </header>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">?ŒíŠ¸??ëª©ë¡</h2>
            <div className="text-sm text-white/60">
              ì´?{partners.length}ê°œì˜ ?ŒíŠ¸??
            </div>
          </div>

          {partners.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        {partner.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        partner.verified 
                          ? 'bg-green-500/10 text-green-300' 
                          : 'bg-yellow-500/10 text-yellow-300'
                      }`}>
                        {statusBadge(partner.verified)}
                      </span>
                    </div>

                    <p className="text-sm text-white/70 line-clamp-3">
                      {partner.description}
                    </p>

                    <div className="space-y-2 text-xs text-white/60">
                      <div className="flex items-center gap-2">
                        <span>?„ì¹˜:</span>
                        <span>{partner.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>?€??</span>
                        <span>{partner.type}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                        ?°ë½?˜ê¸°
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
              <p className="text-white/60">?±ë¡???ŒíŠ¸?ˆê? ?†ìŠµ?ˆë‹¤.</p>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white">?ŒíŠ¸???±ë¡</h2>
          <PartnerRegistrationPanel />
        </section>
      </div>
    );
  } catch (error) {
    console.error('Failed to load partners data:', error);
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20">
        <header className="pt-6">
          <h1 className="text-3xl font-semibold text-white">?ŒíŠ¸??ë§¤ì¹­</h1>
          <p className="mt-2 text-sm text-white/60">
            ?„í‹°?¤íŠ¸?€ ?ŒíŠ¸?ˆë? ?°ê²°?˜ëŠ” ?Œë«?¼ì…?ˆë‹¤.
          </p>
        </header>
        <div className="text-center py-12">
          <p className="text-white/60">?°ì´?°ë? ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.</p>
        </div>
      </div>
    );
  }
}
