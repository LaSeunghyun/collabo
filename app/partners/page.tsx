import Link from 'next/link';

import { UserRole } from '@/types/prisma';

import { getServerAuthSession } from '@/lib/auth/session';
import { ROLE_LABELS } from '@/lib/auth/permissions';
import { listPartners } from '@/lib/server/partners';
import { PARTNER_TYPE_LABELS } from '@/lib/validators/partners';
import { PartnerRegistrationPanel } from './partner-registration-panel';

const statusBadge = (verified: boolean) =>
  verified ? '승인' : '검수 중';

export default async function PartnersPage() {
  const session = await getServerAuthSession();
  const user = session?.user;

  // 공개 파트너 목록 조회 (승인된 파트너만)
  const publicPartners = await listPartners({
    verified: true,
    limit: 12
  });

  // 로그인된 사용자의 경우 추천 파트너 조회
  const recommended = user ? await listPartners({
    verified: true,
    limit: 6,
    excludeOwnerId: user.id
  }) : null;

  // 사용자 권한 확인
  const isPartner = user?.role === UserRole.PARTNER || user?.role === UserRole.ADMIN;
  const isLoggedIn = !!user;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">파트너 매칭</h1>
        <p className="mt-2 text-sm text-white/60">
          {isLoggedIn && user.name ? `${user.name}님, ` : ''}
          스튜디오, 공연장, 제작사와 연결되어 프로젝트를 성공적으로 운영하세요.
          {isPartner ? '파트너 등록 요청이 접수되면 운영팀 검수를 거쳐 승인 결과를 알림으로 안내합니다.' : '로그인하시면 맞춤형 파트너 추천을 받아보실 수 있습니다.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {isPartner ? (
            <Link
              href="/partners/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              파트너 허브 바로가기
            </Link>
          ) : null}

          <Link
            href="/help"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
          >
            파트너 운영 가이드
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            {isLoggedIn ? '추천 파트너' : '파트너 목록'}
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
                        {PARTNER_TYPE_LABELS[partner.type]} · 매칭 {partner.matchCount}건
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
                아직 추천 파트너가 없습니다. 프로필을 충실하게 작성하면 큐레이션에 우선 반영됩니다.
              </div>
            )
          ) : (
            // 비로그인 사용자에게는 공개 파트너 목록 표시
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
                        {PARTNER_TYPE_LABELS[partner.type]} · 매칭 {partner.matchCount}건
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
                등록된 파트너가 없습니다.
              </div>
            )
          )}
        </div>
        
        {isPartner ? (
          // 파트너 권한이 있는 사용자만 등록 패널 표시
          <div>
            <h2 className="text-xl font-semibold text-white">파트너 등록</h2>
            <p className="mt-2 text-sm text-white/60">
              협업 가능한 역량을 입력하면 프로젝트에 적합한 파트너로 추천됩니다. 요청 완료 후에는 검수 대기 상태가 표시됩니다.
            </p>
            <div className="mt-4 space-y-4">
              <PartnerRegistrationPanel />
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                <p className="font-medium text-emerald-200">권한 확인</p>
                <p className="mt-1 text-emerald-100/80">
                  현재 역할:{' '}
                  <span className="font-semibold">
                    {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                  </span>
                  . 승인 완료 시 파트너 대시보드에서 협업 제안과 매칭 알림을 바로 받아볼 수 있어요.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // 파트너 권한이 없는 사용자에게는 로그인 유도
          <div>
            <h2 className="text-xl font-semibold text-white">파트너가 되고 싶으신가요?</h2>
            <p className="mt-2 text-sm text-white/60">
              파트너로 등록하시면 프로젝트 협업 제안을 받아보실 수 있습니다. 
              {!isLoggedIn ? '먼저 로그인해주세요.' : '파트너 권한이 필요합니다.'}
            </p>
            <div className="mt-4 space-y-4">
              {!isLoggedIn ? (
                <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 p-4 text-sm text-blue-100">
                  <p className="font-medium text-blue-200">로그인 필요</p>
                  <p className="mt-1 text-blue-100/80">
                    파트너 등록을 위해서는 먼저 로그인해주세요.
                  </p>
                  <a
                    href="/api/auth/signin"
                    className="mt-3 inline-block rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    로그인하기
                  </a>
                </div>
              ) : (
                <div className="rounded-2xl border border-orange-500/40 bg-orange-500/10 p-4 text-sm text-orange-100">
                  <p className="font-medium text-orange-200">파트너 권한 필요</p>
                  <p className="mt-1 text-orange-100/80">
                    파트너 등록을 위해서는 파트너 권한이 필요합니다. 관리자에게 문의해주세요.
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
