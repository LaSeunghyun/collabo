import { UserRole } from '@/types/prisma';

import { requireUser } from '@/lib/auth/guards';
import { ROLE_LABELS } from '@/lib/auth/permissions';
import { listPartners } from '@/lib/server/partners';
import { PARTNER_TYPE_LABELS } from '@/lib/validators/partners';
import { PartnerRegistrationPanel } from './partner-registration-panel';

const statusBadge = (verified: boolean) =>
  verified ? '승인' : '검수 중';

export default async function PartnersPage() {
  const { user } = await requireUser({
    roles: [UserRole.PARTNER, UserRole.ADMIN],
    redirectTo: '/partners'
  });

  const recommended = await listPartners({
    verified: true,
    limit: 6,
    excludeOwnerId: user.id
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">파트너 매칭</h1>
        <p className="mt-2 text-sm text-white/60">
          {user.name ? `${user.name} 파트너님, ` : ''}
          스튜디오, 공연장, 제작사와 연결되어 프로젝트를 성공적으로 운영하세요. 등록 요청이 접수되면 운영팀 검수를 거쳐 승인 결과를 알림으로 안내합니다.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">추천 파트너</h2>
          {recommended.items.length ? (
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
          )}
        </div>
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
      </section>
    </div>
  );
}
