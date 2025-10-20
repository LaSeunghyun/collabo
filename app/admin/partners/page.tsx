import { getPartnersAwaitingApproval } from '@/lib/server/partners';
import { partnerType } from '@/drizzle/schema';

type PartnerTypeType = typeof partnerType.enumValues[number];

// 동적 렌더링 강제 - 빌드 시 데이터베이스 접근 방지
export const dynamic = 'force-dynamic';

const partnerTypeLabels: Record<PartnerTypeType, string> = {
  'STUDIO': '스튜디오',
  'VENUE': '공연장',
  'PRODUCTION': '제작사',
  'MERCHANDISE': '굿즈',
  'OTHER': '기타'
};

const dateFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' });

export default async function AdminPartnersPage() {
  try {
    const partners = await getPartnersAwaitingApproval();

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">파트너 승인</h1>
          <p className="mt-2 text-sm text-white/60">
            검증을 기다리는 파트너들을 검토하고 협업 준비가 된 파트너들을 승인해주세요.
          </p>
        </div>

        {partners.length > 0 ? (
          <div className="space-y-4">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="rounded-2xl border border-white/5 bg-white/[0.05] p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white">{partner.name}</h3>
                    <p className="mt-1 text-sm text-white/60">
                      {partnerTypeLabels[partner.type]} | 가입일 {dateFormatter.format(partner.createdAt)}
                    </p>
                    {partner.description && (
                      <p className="mt-3 text-sm text-white/70 line-clamp-3">
                        {partner.description}
                      </p>
                    )}
                    {partner.portfolioUrl && (
                      <p className="mt-2 text-sm text-blue-400">
                        포트폴리오: <a href={partner.portfolioUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {partner.portfolioUrl}
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                      대기중
                    </span>
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                        승인
                      </button>
                      <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                        거부
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-8 py-12 text-center">
            <p className="text-sm text-white/60">검토 대기 중인 파트너 신청이 없습니다.</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('파트너 목록 로드 실패:', error);
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100">
        <h2 className="text-lg font-semibold text-red-100">파트너 승인</h2>
        <p className="mt-2">파트너 신청을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }
}
