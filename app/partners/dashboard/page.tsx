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
  verified ? '?�인 ?�료' : '검??�?;

export default async function PartnerDashboardPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    throw new Error('?�트???�보�??�인?�려�?로그?�이 ?�요?�니??');
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
      label: '?�로???�태',
      value: hasProfile ? statusLabel(partnerProfile?.verified) : '?�록 ?�요',
      icon: CheckCircle2,
      accent: hasProfile && partnerProfile?.verified ? 'text-emerald-300' : 'text-amber-300'
    },
    {
      label: '?�적 매칭',
      value: hasProfile ? `${partnerProfile?.matchCount ?? 0}�? : '0�?,
      icon: Users2,
      accent: 'text-sky-300'
    },
    {
      label: '최근 ?�데?�트',
      value: hasProfile
        ? dateFormatter.format(partnerProfile?.updatedAt ?? partnerProfile?.createdAt ?? new Date())
        : '미등�?,
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
            <p className="text-xs uppercase tracking-wider text-primary/60">?�트???�황</p>
            <h2 className="mt-1 text-lg font-semibold text-white">?�번 �??�동 ?�약</h2>
            <p className="mt-2 text-sm text-white/60">
              매칭 ?�청�?검???�태�???곳에??관리하?�요. ?�로?�을 최신?�로 ?��??�수�?추천 ?�선?�위가 ?�아집니??
            </p>
          </div>
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
          >
            공개 ?�트??보기
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
            <p className="font-semibold text-amber-200">?�트???�로?�이 ?�직 ?�록?��? ?�았?�요.</p>
            <p className="mt-1 text-amber-100/80">
              검???��?중인 경우 ?�영?�?�서 별도�??�락?�리�??�어?? 바로 ?�록???�작?�려�??�래 ?�내�??�인?�세??
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
            <p className="text-xs uppercase tracking-wider text-primary/60">?�로??관�?/p>
            <h2 className="mt-1 text-lg font-semibold text-white">?�업 준�??�태 ?��?</h2>
            <p className="mt-2 text-sm text-white/60">
              ?�트???�로?�과 ?�락�??�보�?최신?�로 ?��??�면 ?�로?�트 추천�?매칭 ?�률???�아집니??
            </p>
          </div>
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            ?�로???�데?�트?�기
            <ClipboardList className="h-4 w-4" />
          </Link>
        </header>

        {partnerProfile ? (
          <div className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">?�트?�명</p>
                <p className="mt-3 text-lg font-semibold text-white">{partnerProfile.name}</p>
                <p className="mt-1 text-sm text-white/60">
                  {PARTNER_TYPE_LABELS[partnerProfile.type]}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">?�락 채널</p>
                <p className="mt-3 text-lg font-semibold text-white">{partnerProfile.contactInfo}</p>
                {partnerProfile.location ? (
                  <p className="mt-1 text-sm text-white/60">?�동 지??· {partnerProfile.location}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">?�개</p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                {partnerProfile.description ?? '?�개 문구가 ?�직 ?�록?��? ?�았?�요. ?�심 ??���??�업 ?�과�??�력??주세??'}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">?�인 ?�태</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
                  <Clock4 className={`h-4 w-4 ${partnerProfile.verified ? 'text-emerald-300' : 'text-amber-300'}`} />
                  <span>
                    {partnerProfile.verified
                      ? '?�인 ?�료 ???�규 ?�로?�트 매칭 ?�림??받아�????�어??'
                      : '?�영?� 검??중입?�다. ?�인 ???�림?�로 ?�내?�릴게요.'}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">?�트?�리??/p>
                {partnerProfile.portfolioUrl ? (
                  <Link
                    href={partnerProfile.portfolioUrl}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ?�트?�리???�기
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <p className="mt-3 text-sm text-white/60">
                    ?�트?�리??링크가 ?�록?��? ?�았?�니?? ?�???�업물을 ?�결?�면 ?�뢰?��? ?�일 ???�어??
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-sm text-white/60">
            <p className="font-semibold text-white">?�록???�트???�로?�이 ?�습?�다.</p>
            <p className="mt-2">
              간단???�개?� ?�락�? ?�공 가?�한 ?�비?��? ?�력?�면 추천 ?�레?�션???�출?�고 ?�로?�트 매칭 ?�안??받을 ???�습?�다.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-white/50">
              <Sparkles className="h-4 w-4" />
              <span>?�인 ?�료 ?�에??매칭 ?�청�??�산 ?�황???�기?�서 바로 ?�인?????�어??</span>
            </div>
          </div>
        )}
      </section>

      <section
        id="insights"
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
      >
        <header>
          <p className="text-xs uppercase tracking-wider text-primary/60">추천 ?�사?�트</p>
          <h2 className="mt-1 text-lg font-semibold text-white">?�께 보면 좋�? ?�트??/h2>
          <p className="mt-2 text-sm text-white/60">
            비슷??분야???�트?��? ?�인?�고 ?�업 ?�트?�크�??�장??보세?? ?�로?�트 ?�안 ??참고 ?�료�??�용?????�습?�다.
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
                      {PARTNER_TYPE_LABELS[partner.type]} · 매칭 {partner.matchCount}�?
                    </p>
                  </div>
                  <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60">
                    {statusLabel(partner.verified)}
                  </span>
                </div>

                {partner.location ? (
                  <p className="mt-4 text-xs text-white/50">?�동 지??· {partner.location}</p>
                ) : null}

                <Link
                  href={`/partners?highlight=${partner.id}`}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary transition hover:text-primary/80"
                >
                  ?�로???�펴보기
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-sm text-white/60">
            추천???�트?��? ?�직 ?�습?�다. ?�로?�을 보강?�면 관??분야???�트?��? ?�로?�트�?추천???�릴게요.
          </div>
        )}
      </section>
    </div>
  );
}
