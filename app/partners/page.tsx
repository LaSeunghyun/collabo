import Link from 'next/link';

import { UserRole } from '@/types/shared';

import { getServerAuthSession } from '@/lib/auth/session';
import { ROLE_LABELS } from '@/lib/auth/permissions';
import { listPartners } from '@/lib/server/partners';
import { PARTNER_TYPE_LABELS } from '@/lib/validators/partners';
import { PartnerRegistrationPanel } from './partner-registration-panel';

const statusBadge = (verified: boolean) =>
  verified ? '?¹ì¸' : 'ê²€??ì¤?;

export default async function PartnersPage() {
  const session = await getServerAuthSession();
  const user = session?.user;

  // ê³µê°œ ?ŒíŠ¸??ëª©ë¡ ì¡°íšŒ (?¹ì¸???ŒíŠ¸?ˆë§Œ)
  const publicPartners = await listPartners({
    verified: true,
    limit: 12
  });

  // ë¡œê·¸?¸ëœ ?¬ìš©?ì˜ ê²½ìš° ì¶”ì²œ ?ŒíŠ¸??ì¡°íšŒ
  const recommended = user ? await listPartners({
    verified: true,
    limit: 6,
    excludeOwnerId: user.id
  }) : null;

  // ?¬ìš©??ê¶Œí•œ ?•ì¸
  const isPartner = user?.role === UserRole.PARTNER || user?.role === UserRole.ADMIN;
  const isLoggedIn = !!user;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">?ŒíŠ¸??ë§¤ì¹­</h1>
        <p className="mt-2 text-sm text-white/60">
          {isLoggedIn && user.name ? `${user.name}?? ` : ''}
          ?¤íŠœ?”ì˜¤, ê³µì—°?? ?œì‘?¬ì? ?°ê²°?˜ì–´ ?„ë¡œ?íŠ¸ë¥??±ê³µ?ìœ¼ë¡??´ì˜?˜ì„¸??
          {isPartner ? '?ŒíŠ¸???±ë¡ ?”ì²­???‘ìˆ˜?˜ë©´ ?´ì˜?€ ê²€?˜ë? ê±°ì³ ?¹ì¸ ê²°ê³¼ë¥??Œë¦¼?¼ë¡œ ?ˆë‚´?©ë‹ˆ??' : 'ë¡œê·¸?¸í•˜?œë©´ ë§ì¶¤???ŒíŠ¸??ì¶”ì²œ??ë°›ì•„ë³´ì‹¤ ???ˆìŠµ?ˆë‹¤.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {isPartner ? (
            <Link
              href="/partners/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              ?ŒíŠ¸???ˆë¸Œ ë°”ë¡œê°€ê¸?
            </Link>
          ) : null}

          <Link
            href="/help"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
          >
            ?ŒíŠ¸???´ì˜ ê°€?´ë“œ
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            {isLoggedIn ? 'ì¶”ì²œ ?ŒíŠ¸?? : '?ŒíŠ¸??ëª©ë¡'}
          </h2>
          {isLoggedIn && recommended ? (
            recommended.items.length ? (
              <ul className="space-y-3">
                {recommended.items.map((partner) => (
                  <li
                    key={partner.id}
                    className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{partner.name}</p>
                      <p className="text-xs text-white/60">
                        {PARTNER_TYPE_LABELS[partner.type]} Â· ë§¤ì¹­ {partner.matchCount}ê±?
                      </p>
                      {partner.location ? (
                        <p className="mt-1 text-xs text-white/40">{partner.location}</p>
                      ) : null}
                    </div>
                    <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60">
                      {statusBadge(partner.verified)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/60">
                ?„ì§ ì¶”ì²œ ?ŒíŠ¸?ˆê? ?†ìŠµ?ˆë‹¤. ?„ë¡œ?„ì„ ì¶©ì‹¤?˜ê²Œ ?‘ì„±?˜ë©´ ?ë ˆ?´ì…˜???°ì„  ë°˜ì˜?©ë‹ˆ??
              </div>
            )
          ) : (
            // ë¹„ë¡œê·¸ì¸ ?¬ìš©?ì—ê²ŒëŠ” ê³µê°œ ?ŒíŠ¸??ëª©ë¡ ?œì‹œ
            publicPartners.items.length ? (
              <ul className="space-y-3">
                {publicPartners.items.map((partner) => (
                  <li
                    key={partner.id}
                    className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{partner.name}</p>
                      <p className="text-xs text-white/60">
                        {PARTNER_TYPE_LABELS[partner.type]} Â· ë§¤ì¹­ {partner.matchCount}ê±?
                      </p>
                      {partner.location ? (
                        <p className="mt-1 text-xs text-white/40">{partner.location}</p>
                      ) : null}
                    </div>
                    <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60">
                      {statusBadge(partner.verified)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/60">
                ?±ë¡???ŒíŠ¸?ˆê? ?†ìŠµ?ˆë‹¤.
              </div>
            )
          )}
        </div>
        
        {isPartner ? (
          // ?ŒíŠ¸??ê¶Œí•œ???ˆëŠ” ?¬ìš©?ë§Œ ?±ë¡ ?¨ë„ ?œì‹œ
          <div>
            <h2 className="text-xl font-semibold text-white">?ŒíŠ¸???±ë¡</h2>
            <p className="mt-2 text-sm text-white/60">
              ?‘ì—… ê°€?¥í•œ ??Ÿ‰???…ë ¥?˜ë©´ ?„ë¡œ?íŠ¸???í•©???ŒíŠ¸?ˆë¡œ ì¶”ì²œ?©ë‹ˆ?? ?”ì²­ ?„ë£Œ ?„ì—??ê²€???€ê¸??íƒœê°€ ?œì‹œ?©ë‹ˆ??
            </p>
            <div className="mt-4 space-y-4">
              <PartnerRegistrationPanel />
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                <p className="font-medium text-emerald-200">ê¶Œí•œ ?•ì¸</p>
                <p className="mt-1 text-emerald-100/80">
                  ?„ì¬ ??• :{' '}
                  <span className="font-semibold">
                    {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                  </span>
                  . ?¹ì¸ ?„ë£Œ ???ŒíŠ¸???€?œë³´?œì—???‘ì—… ?œì•ˆê³?ë§¤ì¹­ ?Œë¦¼??ë°”ë¡œ ë°›ì•„ë³????ˆì–´??
                </p>
              </div>
            </div>
          </div>
        ) : (
          // ?ŒíŠ¸??ê¶Œí•œ???†ëŠ” ?¬ìš©?ì—ê²ŒëŠ” ë¡œê·¸??? ë„
          <div>
            <h2 className="text-xl font-semibold text-white">?ŒíŠ¸?ˆê? ?˜ê³  ?¶ìœ¼? ê???</h2>
            <p className="mt-2 text-sm text-white/60">
              ?ŒíŠ¸?ˆë¡œ ?±ë¡?˜ì‹œë©??„ë¡œ?íŠ¸ ?‘ì—… ?œì•ˆ??ë°›ì•„ë³´ì‹¤ ???ˆìŠµ?ˆë‹¤. 
              {!isLoggedIn ? 'ë¨¼ì? ë¡œê·¸?¸í•´ì£¼ì„¸??' : '?ŒíŠ¸??ê¶Œí•œ???„ìš”?©ë‹ˆ??'}
            </p>
            <div className="mt-4 space-y-4">
              {!isLoggedIn ? (
                <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 p-4 text-sm text-blue-100">
                  <p className="font-medium text-blue-200">ë¡œê·¸???„ìš”</p>
                  <p className="mt-1 text-blue-100/80">
                    ?ŒíŠ¸???±ë¡???„í•´?œëŠ” ë¨¼ì? ë¡œê·¸?¸í•´ì£¼ì„¸??
                  </p>
                  <a
                    href="/api/auth/signin"
                    className="mt-3 inline-block rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    ë¡œê·¸?¸í•˜ê¸?
                  </a>
                </div>
              ) : (
                <div className="rounded-2xl border border-orange-500/40 bg-orange-500/10 p-4 text-sm text-orange-100">
                  <p className="font-medium text-orange-200">?ŒíŠ¸??ê¶Œí•œ ?„ìš”</p>
                  <p className="mt-1 text-orange-100/80">
                    ?ŒíŠ¸???±ë¡???„í•´?œëŠ” ?ŒíŠ¸??ê¶Œí•œ???„ìš”?©ë‹ˆ?? ê´€ë¦¬ì?ê²Œ ë¬¸ì˜?´ì£¼?¸ìš”.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
