import Link from 'next/link';

import { UserRole } from '@/types/shared';

import { getServerAuthSession } from '@/lib/auth/session';
import { ROLE_LABELS } from '@/lib/auth/permissions';
import { listPartners } from '@/lib/server/partners';
import { PARTNER_TYPE_LABELS } from '@/lib/validators/partners';
import { PartnerRegistrationPanel } from './partner-registration-panel';

const statusBadge = (verified: boolean) =>
  verified ? '?�인' : '검??�?;

export default async function PartnersPage() {
  const session = await getServerAuthSession();
  const user = session?.user;

  // 공개 ?�트??목록 조회 (?�인???�트?�만)
  const publicPartners = await listPartners({
    verified: true,
    limit: 12
  });

  // 로그?�된 ?�용?�의 경우 추천 ?�트??조회
  const recommended = user ? await listPartners({
    verified: true,
    limit: 6,
    excludeOwnerId: user.id
  }) : null;

  // ?�용??권한 ?�인
  const isPartner = user?.role === UserRole.PARTNER || user?.role === UserRole.ADMIN;
  const isLoggedIn = !!user;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">?�트??매칭</h1>
        <p className="mt-2 text-sm text-white/60">
          {isLoggedIn && user.name ? `${user.name}?? ` : ''}
          ?�튜?�오, 공연?? ?�작?��? ?�결?�어 ?�로?�트�??�공?�으�??�영?�세??
          {isPartner ? '?�트???�록 ?�청???�수?�면 ?�영?� 검?��? 거쳐 ?�인 결과�??�림?�로 ?�내?�니??' : '로그?�하?�면 맞춤???�트??추천??받아보실 ???�습?�다.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {isPartner ? (
            <Link
              href="/partners/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              ?�트???�브 바로가�?
            </Link>
          ) : null}

          <Link
            href="/help"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
          >
            ?�트???�영 가?�드
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            {isLoggedIn ? '추천 ?�트?? : '?�트??목록'}
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
                        {PARTNER_TYPE_LABELS[partner.type]} · 매칭 {partner.matchCount}�?
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
                ?�직 추천 ?�트?��? ?�습?�다. ?�로?�을 충실?�게 ?�성?�면 ?�레?�션???�선 반영?�니??
              </div>
            )
          ) : (
            // 비로그인 ?�용?�에게는 공개 ?�트??목록 ?�시
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
                        {PARTNER_TYPE_LABELS[partner.type]} · 매칭 {partner.matchCount}�?
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
                ?�록???�트?��? ?�습?�다.
              </div>
            )
          )}
        </div>
        
        {isPartner ? (
          // ?�트??권한???�는 ?�용?�만 ?�록 ?�널 ?�시
          <div>
            <h2 className="text-xl font-semibold text-white">?�트???�록</h2>
            <p className="mt-2 text-sm text-white/60">
              ?�업 가?�한 ??��???�력?�면 ?�로?�트???�합???�트?�로 추천?�니?? ?�청 ?�료 ?�에??검???��??�태가 ?�시?�니??
            </p>
            <div className="mt-4 space-y-4">
              <PartnerRegistrationPanel />
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                <p className="font-medium text-emerald-200">권한 ?�인</p>
                <p className="mt-1 text-emerald-100/80">
                  ?�재 ??��:{' '}
                  <span className="font-semibold">
                    {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                  </span>
                  . ?�인 ?�료 ???�트???�?�보?�에???�업 ?�안�?매칭 ?�림??바로 받아�????�어??
                </p>
              </div>
            </div>
          </div>
        ) : (
          // ?�트??권한???�는 ?�용?�에게는 로그???�도
          <div>
            <h2 className="text-xl font-semibold text-white">?�트?��? ?�고 ?�으?��???</h2>
            <p className="mt-2 text-sm text-white/60">
              ?�트?�로 ?�록?�시�??�로?�트 ?�업 ?�안??받아보실 ???�습?�다. 
              {!isLoggedIn ? '먼�? 로그?�해주세??' : '?�트??권한???�요?�니??'}
            </p>
            <div className="mt-4 space-y-4">
              {!isLoggedIn ? (
                <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 p-4 text-sm text-blue-100">
                  <p className="font-medium text-blue-200">로그???�요</p>
                  <p className="mt-1 text-blue-100/80">
                    ?�트???�록???�해?�는 먼�? 로그?�해주세??
                  </p>
                  <a
                    href="/api/auth/signin"
                    className="mt-3 inline-block rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    로그?�하�?
                  </a>
                </div>
              ) : (
                <div className="rounded-2xl border border-orange-500/40 bg-orange-500/10 p-4 text-sm text-orange-100">
                  <p className="font-medium text-orange-200">?�트??권한 ?�요</p>
                  <p className="mt-1 text-orange-100/80">
                    ?�트???�록???�해?�는 ?�트??권한???�요?�니?? 관리자?�게 문의?�주?�요.
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
