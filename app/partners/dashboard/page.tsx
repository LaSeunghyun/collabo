import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock4,
  Sparkles,
  Users2
} from 'lucide-react';

import { getServerAuthSession } from '@/lib/auth/session';
import { getPartnerProfileForUser, listPartners } from '@/lib/server/partners';
import { PARTNER_TYPE_LABELS } from '@/lib/validators/partners';

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

const statusLabel = (verified: boolean | null | undefined) =>
  verified ? '?¹ì¸ ?„ë£Œ' : 'ê²€??ì¤?;

export default async function PartnerDashboardPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    throw new Error('?ŒíŠ¸???•ë³´ë¥??•ì¸?˜ë ¤ë©?ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??');
  }

  const partnerProfile = await getPartnerProfileForUser(session.user.id);
  const recommendedPartners = await listPartners({
    verified: true,
    limit: 4,
    excludeOwnerId: session.user.id
  });

  const hasProfile = Boolean(partnerProfile);
  const overviewItems = [
    {
      label: '?„ë¡œ???íƒœ',
      value: hasProfile ? statusLabel(partnerProfile?.verified) : '?±ë¡ ?„ìš”',
      icon: CheckCircle2,
      accent: hasProfile && partnerProfile?.verified ? 'text-emerald-300' : 'text-amber-300'
    },
    {
      label: '?„ì  ë§¤ì¹­',
      value: hasProfile ? `${partnerProfile?.matchCount ?? 0}ê±? : '0ê±?,
      icon: Users2,
      accent: 'text-sky-300'
    },
    {
      label: 'ìµœê·¼ ?…ë°?´íŠ¸',
      value: hasProfile
        ? dateFormatter.format(partnerProfile?.updatedAt ?? partnerProfile?.createdAt ?? new Date())
        : 'ë¯¸ë“±ë¡?,
      icon: CalendarDays,
      accent: 'text-violet-300'
    }
  ];

  return (
    <div className="space-y-10">
      <section
        id="overview"
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
      >
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary/60">?ŒíŠ¸???„í™©</p>
            <h2 className="mt-1 text-lg font-semibold text-white">?´ë²ˆ ì£??œë™ ?”ì•½</h2>
            <p className="mt-2 text-sm text-white/60">
              ë§¤ì¹­ ?”ì²­ê³?ê²€???íƒœë¥???ê³³ì—??ê´€ë¦¬í•˜?¸ìš”. ?„ë¡œ?„ì„ ìµœì‹ ?¼ë¡œ ? ì?? ìˆ˜ë¡?ì¶”ì²œ ?°ì„ ?œìœ„ê°€ ?’ì•„ì§‘ë‹ˆ??
            </p>
          </div>
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
          >
            ê³µê°œ ?ŒíŠ¸??ë³´ê¸°
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </header>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {overviewItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
                <span>{item.label}</span>
                <item.icon className={`h-4 w-4 ${item.accent}`} />
              </div>
              <p className="mt-4 text-xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>

        {!hasProfile ? (
          <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            <p className="font-semibold text-amber-200">?ŒíŠ¸???„ë¡œ?„ì´ ?„ì§ ?±ë¡?˜ì? ?Šì•˜?´ìš”.</p>
            <p className="mt-1 text-amber-100/80">
              ê²€???€ê¸?ì¤‘ì¸ ê²½ìš° ?´ì˜?€?ì„œ ë³„ë„ë¡??°ë½?œë¦¬ê³??ˆì–´?? ë°”ë¡œ ?±ë¡???œì‘?˜ë ¤ë©??„ë˜ ?ˆë‚´ë¥??•ì¸?˜ì„¸??
            </p>
          </div>
        ) : null}
      </section>

      <section
        id="profile"
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
      >
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary/60">?„ë¡œ??ê´€ë¦?/p>
            <h2 className="mt-1 text-lg font-semibold text-white">?‘ì—… ì¤€ë¹??íƒœ ?ê?</h2>
            <p className="mt-2 text-sm text-white/60">
              ?ŒíŠ¸???„ë¡œ?„ê³¼ ?°ë½ì²??•ë³´ë¥?ìµœì‹ ?¼ë¡œ ? ì??˜ë©´ ?„ë¡œ?íŠ¸ ì¶”ì²œê³?ë§¤ì¹­ ?•ë¥ ???’ì•„ì§‘ë‹ˆ??
            </p>
          </div>
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            ?„ë¡œ???…ë°?´íŠ¸?˜ê¸°
            <ClipboardList className="h-4 w-4" />
          </Link>
        </header>

        {partnerProfile ? (
          <div className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">?ŒíŠ¸?ˆëª…</p>
                <p className="mt-3 text-lg font-semibold text-white">{partnerProfile.name}</p>
                <p className="mt-1 text-sm text-white/60">
                  {PARTNER_TYPE_LABELS[partnerProfile.type]}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">?°ë½ ì±„ë„</p>
                <p className="mt-3 text-lg font-semibold text-white">{partnerProfile.contactInfo}</p>
                {partnerProfile.location ? (
                  <p className="mt-1 text-sm text-white/60">?œë™ ì§€??Â· {partnerProfile.location}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">?Œê°œ</p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                {partnerProfile.description ?? '?Œê°œ ë¬¸êµ¬ê°€ ?„ì§ ?±ë¡?˜ì? ?Šì•˜?´ìš”. ?µì‹¬ ??Ÿ‰ê³??‘ì—… ?±ê³¼ë¥??…ë ¥??ì£¼ì„¸??'}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">?¹ì¸ ?íƒœ</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
                  <Clock4 className={`h-4 w-4 ${partnerProfile.verified ? 'text-emerald-300' : 'text-amber-300'}`} />
                  <span>
                    {partnerProfile.verified
                      ? '?¹ì¸ ?„ë£Œ ??? ê·œ ?„ë¡œ?íŠ¸ ë§¤ì¹­ ?Œë¦¼??ë°›ì•„ë³????ˆì–´??'
                      : '?´ì˜?€ ê²€??ì¤‘ì…?ˆë‹¤. ?¹ì¸ ???Œë¦¼?¼ë¡œ ?ˆë‚´?œë¦´ê²Œìš”.'}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">?¬íŠ¸?´ë¦¬??/p>
                {partnerProfile.portfolioUrl ? (
                  <Link
                    href={partnerProfile.portfolioUrl}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ?¬íŠ¸?´ë¦¬???´ê¸°
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <p className="mt-3 text-sm text-white/60">
                    ?¬íŠ¸?´ë¦¬??ë§í¬ê°€ ?±ë¡?˜ì? ?Šì•˜?µë‹ˆ?? ?€???‘ì—…ë¬¼ì„ ?°ê²°?˜ë©´ ? ë¢°?„ë? ?’ì¼ ???ˆì–´??
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-sm text-white/60">
            <p className="font-semibold text-white">?±ë¡???ŒíŠ¸???„ë¡œ?„ì´ ?†ìŠµ?ˆë‹¤.</p>
            <p className="mt-2">
              ê°„ë‹¨???Œê°œ?€ ?°ë½ì²? ?œê³µ ê°€?¥í•œ ?œë¹„?¤ë? ?…ë ¥?˜ë©´ ì¶”ì²œ ?ë ˆ?´ì…˜???¸ì¶œ?˜ê³  ?„ë¡œ?íŠ¸ ë§¤ì¹­ ?œì•ˆ??ë°›ì„ ???ˆìŠµ?ˆë‹¤.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-white/50">
              <Sparkles className="h-4 w-4" />
              <span>?¹ì¸ ?„ë£Œ ?„ì—??ë§¤ì¹­ ?”ì²­ê³??•ì‚° ?„í™©???¬ê¸°?ì„œ ë°”ë¡œ ?•ì¸?????ˆì–´??</span>
            </div>
          </div>
        )}
      </section>

      <section
        id="insights"
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
      >
        <header>
          <p className="text-xs uppercase tracking-wider text-primary/60">ì¶”ì²œ ?¸ì‚¬?´íŠ¸</p>
          <h2 className="mt-1 text-lg font-semibold text-white">?¨ê»˜ ë³´ë©´ ì¢‹ì? ?ŒíŠ¸??/h2>
          <p className="mt-2 text-sm text-white/60">
            ë¹„ìŠ·??ë¶„ì•¼???ŒíŠ¸?ˆë? ?•ì¸?˜ê³  ?‘ì—… ?¤íŠ¸?Œí¬ë¥??•ì¥??ë³´ì„¸?? ?„ë¡œ?íŠ¸ ?œì•ˆ ??ì°¸ê³  ?ë£Œë¡??œìš©?????ˆìŠµ?ˆë‹¤.
          </p>
        </header>

        {recommendedPartners.items.length ? (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {recommendedPartners.items.map((partner) => (
              <li
                key={partner.id}
                className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{partner.name}</p>
                    <p className="mt-1 text-xs text-white/60">
                      {PARTNER_TYPE_LABELS[partner.type]} Â· ë§¤ì¹­ {partner.matchCount}ê±?
                    </p>
                  </div>
                  <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60">
                    {statusLabel(partner.verified)}
                  </span>
                </div>

                {partner.location ? (
                  <p className="mt-4 text-xs text-white/50">?œë™ ì§€??Â· {partner.location}</p>
                ) : null}

                <Link
                  href={`/partners?highlight=${partner.id}`}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary transition hover:text-primary/80"
                >
                  ?„ë¡œ???´í´ë³´ê¸°
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-sm text-white/60">
            ì¶”ì²œ???ŒíŠ¸?ˆê? ?„ì§ ?†ìŠµ?ˆë‹¤. ?„ë¡œ?„ì„ ë³´ê°•?˜ë©´ ê´€??ë¶„ì•¼???ŒíŠ¸?ˆì? ?„ë¡œ?íŠ¸ë¥?ì¶”ì²œ???œë¦´ê²Œìš”.
          </div>
        )}
      </section>
    </div>
  );
}
