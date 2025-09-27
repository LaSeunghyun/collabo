import { PartnerType } from '@/types/prisma';

import { getPartnersAwaitingApproval } from '@/lib/server/partners';

const partnerTypeLabels: Record<PartnerType, string> = {
  [PartnerType.STUDIO]: '스튜디오',
  [PartnerType.VENUE]: '공연장',
  [PartnerType.PRODUCTION]: '프로덕션',
  [PartnerType.MERCHANDISE]: '머천다이즈',
  [PartnerType.OTHER]: '기타'
};

const dateFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' });

export async function PartnerApprovalSection() {
  const partners = await getPartnersAwaitingApproval();

  return (
    <section
      id="partner-approvals"
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
    >
      <header>
        <p className="text-xs uppercase tracking-wider text-primary/60">파트너 승인</p>
        <h2 className="mt-1 text-lg font-semibold text-white">검토 대기 파트너</h2>
        <p className="mt-2 text-sm text-white/60">
          인증되지 않은 파트너 프로필을 빠르게 확인하고 승인 상태를 업데이트하세요.
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
                  {partnerTypeLabels[partner.type]} · 등록일 {dateFormatter.format(partner.createdAt)}
                </p>
              </div>
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                미승인
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
          승인 대기 중인 파트너가 없습니다.
        </p>
      )}
    </section>
  );
}
