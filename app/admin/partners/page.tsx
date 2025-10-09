import { getPartnerStats, getRecentPartners } from '@/lib/server/partners';

export const dynamic = 'force-dynamic';

const statusLabels: Record<string, string> = {
  'PENDING': '대기중',
  'APPROVED': '승인됨',
  'REJECTED': '거부됨',
  'SUSPENDED': '정지됨'
};

const typeLabels: Record<string, string> = {
  'STUDIO': '스튜디오',
  'VENUE': '공연장',
  'PRODUCTION': '제작 스튜디오',
  'MERCHANDISE': '머천다이즈',
  'OTHER': '기타'
};

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export default async function AdminPartnersPage() {
  try {
    const [stats, partners] = await Promise.all([
      getPartnerStats(),
      getRecentPartners()
    ]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">파트너 관리</h1>
          <p className="mt-2 text-sm text-white/60">
            파트너 등록 현황을 확인하고 승인/거부를 관리하세요
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-white/60">전체 파트너</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-sm text-white/60">대기중</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
            <div className="text-sm text-white/60">승인됨</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
            <div className="text-sm text-white/60">거부됨</div>
          </div>
        </div>

        {/* 파트너 목록 */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">최근 파트너 등록</h2>
          <p className="mt-1 text-sm text-white/60">처리 대기 중인 파트너 등록 신청</p>

          {partners.length > 0 ? (
            <div className="mt-6 space-y-4">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span>{typeLabels[partner.type]}</span>
                        <span>•</span>
                        <span>{dateFormatter.format(new Date(partner.createdAt))}</span>
                        <span>•</span>
                        <span>등록자: {partner.user.id}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">
                        {partner.name}
                      </h3>
                      <p className="mt-1 text-xs text-white/60 line-clamp-2">
                        {partner.description}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-white/60">
                        <span>연락처: {partner.contactInfo}</span>
                        <span>위치: {partner.location}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                        {partner.verified ? '승인됨' : '대기중'}
                      </span>
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-green-500/10 px-3 py-1 text-xs text-green-300 transition hover:bg-green-500/20">
                          승인
                        </button>
                        <button className="rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/20">
                          거부
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 text-center text-white/60">
              처리 대기 중인 파트너 등록이 없습니다.
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load partner data:', error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">파트너 관리</h1>
          <p className="mt-2 text-sm text-white/60">
            파트너 등록 현황을 확인하고 승인/거부를 관리하세요
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-center text-white/60">
            파트너 데이터를 불러올 수 없습니다.
          </div>
        </div>
      </div>
    );
  }
}