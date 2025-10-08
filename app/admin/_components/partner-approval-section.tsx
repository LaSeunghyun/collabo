// import { PartnerType, type PartnerTypeType } from '@/types/shared'; // TODO: Drizzle로 전환 필요

import { getPartnersAwaitingApproval } from '@/lib/server/partners';

const partnerTypeLabels: Record<string, string> = {
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
        id="partners"
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">파트너 승인</h3>
            <p className="text-sm text-white/60">새로운 파트너 등록을 검토하고 승인하세요</p>
          </div>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
            {partners.length}개 대기
          </span>
        </div>

        {partners.length > 0 ? (
          <div className="mt-6 space-y-3">
            {partners.slice(0, 3).map((partner) => (
              <div
                key={partner.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span>{partnerTypeLabels[partner.type] || partner.type}</span>
                      <span>•</span>
                      <span>{dateFormatter.format(new Date(partner.createdAt))}</span>
                    </div>
                    <h4 className="mt-1 text-sm font-medium text-white">
                      {partner.businessName}
                    </h4>
                    <p className="mt-1 text-xs text-white/60 line-clamp-2">
                      {partner.description}
                    </p>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button className="rounded-lg bg-green-500/10 px-3 py-1 text-xs text-green-300 transition hover:bg-green-500/20">
                      승인
                    </button>
                    <button className="rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/20">
                      거부
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 text-center text-white/60">
            승인 대기 중인 파트너가 없습니다.
          </div>
        )}
      </section>
    );
  } catch (error) {
    console.error('Failed to load partners data:', error);
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="text-center text-white/60">
          파트너 데이터를 불러올 수 없습니다.
        </div>
      </section>
    );
  }
}