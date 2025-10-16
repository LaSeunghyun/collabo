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
  verified ? '승인 완료' : '검수 중';

export default async function PartnerDashboardPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    throw new Error('파트너 정보를 확인하려면 로그인이 필요합니다.');
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
      label: '프로필 상태',
      value: hasProfile ? statusLabel(partnerProfile?.verified) : '등록 필요',
      icon: CheckCircle2,
      accent: hasProfile && partnerProfile?.verified ? 'text-emerald-300' : 'text-amber-300'
    },
    {
      label: '누적 매칭',
      value: hasProfile ? `${partnerProfile?.matchCount ?? 0}건` : '0건',
      icon: Users2,
      accent: 'text-sky-300'
    },
    {
      label: '최근 업데이트',
      value: hasProfile
        ? dateFormatter.format(partnerProfile?.updatedAt ?? partnerProfile?.createdAt ?? new Date())
        : '미등록',
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
            <p className="text-xs uppercase tracking-wider text-primary/60">파트너 현황</p>
            <h2 className="mt-1 text-lg font-semibold text-white">이번 주 활동 요약</h2>
            <p className="mt-2 text-sm text-white/60">
              매칭 요청과 검수 상태를 한 곳에서 관리하세요. 프로필을 최신으로 유지할수록 추천 우선순위가 높아집니다.
            </p>
          </div>
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
          >
            공개 파트너 보기
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
            <p className="font-semibold text-amber-200">파트너 프로필이 아직 등록되지 않았어요.</p>
            <p className="mt-1 text-amber-100/80">
              검수 대기 중인 경우 운영팀에서 별도로 연락드리고 있어요. 바로 등록을 시작하려면 아래 안내를 확인하세요.
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
            <p className="text-xs uppercase tracking-wider text-primary/60">프로필 관리</p>
            <h2 className="mt-1 text-lg font-semibold text-white">협업 준비 상태 점검</h2>
            <p className="mt-2 text-sm text-white/60">
              파트너 프로필과 연락처 정보를 최신으로 유지하면 프로젝트 추천과 매칭 확률이 높아집니다.
            </p>
          </div>
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            프로필 업데이트하기
            <ClipboardList className="h-4 w-4" />
          </Link>
        </header>

        {partnerProfile ? (
          <div className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">파트너명</p>
                <p className="mt-3 text-lg font-semibold text-white">{partnerProfile.name}</p>
                <p className="mt-1 text-sm text-white/60">
                  {PARTNER_TYPE_LABELS[partnerProfile.type]}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">연락 채널</p>
                <p className="mt-3 text-lg font-semibold text-white">{partnerProfile.contactInfo}</p>
                {partnerProfile.location ? (
                  <p className="mt-1 text-sm text-white/60">활동 지역 · {partnerProfile.location}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">소개</p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                {partnerProfile.description ?? '소개 문구가 아직 등록되지 않았어요. 핵심 역량과 협업 성과를 입력해 주세요.'}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">승인 상태</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
                  <Clock4 className={`h-4 w-4 ${partnerProfile.verified ? 'text-emerald-300' : 'text-amber-300'}`} />
                  <span>
                    {partnerProfile.verified
                      ? '승인 완료 – 신규 프로젝트 매칭 알림을 받아볼 수 있어요.'
                      : '운영팀 검수 중입니다. 승인 시 알림으로 안내드릴게요.'}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">포트폴리오</p>
                {partnerProfile.portfolioUrl ? (
                  <Link
                    href={partnerProfile.portfolioUrl}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
                    target="_blank"
                    rel="noreferrer"
                  >
                    포트폴리오 열기
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <p className="mt-3 text-sm text-white/60">
                    포트폴리오 링크가 등록되지 않았습니다. 대표 작업물을 연결하면 신뢰도를 높일 수 있어요.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-sm text-white/60">
            <p className="font-semibold text-white">등록된 파트너 프로필이 없습니다.</p>
            <p className="mt-2">
              간단한 소개와 연락처, 제공 가능한 서비스를 입력하면 추천 큐레이션에 노출되고 프로젝트 매칭 제안을 받을 수 있습니다.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-white/50">
              <Sparkles className="h-4 w-4" />
              <span>승인 완료 후에는 매칭 요청과 정산 현황을 여기에서 바로 확인할 수 있어요.</span>
            </div>
          </div>
        )}
      </section>

      <section
        id="insights"
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
      >
        <header>
          <p className="text-xs uppercase tracking-wider text-primary/60">추천 인사이트</p>
          <h2 className="mt-1 text-lg font-semibold text-white">함께 보면 좋은 파트너</h2>
          <p className="mt-2 text-sm text-white/60">
            비슷한 분야의 파트너를 확인하고 협업 네트워크를 확장해 보세요. 프로젝트 제안 시 참고 자료로 활용할 수 있습니다.
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
                      {PARTNER_TYPE_LABELS[partner.type]} · 매칭 {partner.matchCount}건
                    </p>
                  </div>
                  <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60">
                    {statusLabel(partner.verified)}
                  </span>
                </div>

                {partner.location ? (
                  <p className="mt-4 text-xs text-white/50">활동 지역 · {partner.location}</p>
                ) : null}

                <Link
                  href={`/partners?highlight=${partner.id}`}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary transition hover:text-primary/80"
                >
                  프로필 살펴보기
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-sm text-white/60">
            추천할 파트너가 아직 없습니다. 프로필을 보강하면 관련 분야의 파트너와 프로젝트를 추천해 드릴게요.
          </div>
        )}
      </section>
    </div>
  );
}
