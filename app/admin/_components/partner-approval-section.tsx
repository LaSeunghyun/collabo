import { partnerType } from '@/drizzle/schema';

type PartnerTypeType = typeof partnerType.enumValues[number];

import { getPartnersAwaitingApproval } from '@/lib/server/partners';

const partnerTypeLabels: Record<PartnerTypeType, string> = {
  'STUDIO': '스튜디오',
  'VENUE': '공연장',
  'PRODUCTION': '제작사',
  'MERCHANDISE': '굿즈',
  'OTHER': '기타'
};

const dateFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' });

export async function PartnerApprovalSection() {
  try {
    const partners = await getPartnersAwaitingApproval();

    return (
      <section
        id="partner-approvals"
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
      >
        <header>
          <p className="text-xs uppercase tracking-wider text-primary/60">파트너 승인</p>
          <h2 className="mt-1 text-lg font-semibold text-white">승인 대기 중인 파트너 프로필</h2>
          <p className="mt-2 text-sm text-white/60">
            검증을 기다리는 파트너들을 검토하고 협업 준비가 된 파트너들을 승인해주세요.
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
                    {partnerTypeLabels[partner.type]} | 가입일 {dateFormatter.format(partner.createdAt)}
                  </p>
                </div>
                <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                  대기중
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
            검토 대기 중인 파트너 신청이 없습니다.
          </p>
        )}
      </section>
    );
  } catch (error) {
    // Failed to load partners awaiting approval - removed console.error for production
    return (
      <section
        id="partner-approvals"
        className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100"
      >
        <h2 className="text-lg font-semibold text-red-100">파트너 승인</h2>
        <p className="mt-2">파트너 신청을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
      </section>
    );
  }
}
