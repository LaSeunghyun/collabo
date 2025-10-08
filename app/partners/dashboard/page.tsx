import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Star
} from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0
});

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium'
});

const statusLabel = (verified: boolean | null | undefined) =>
  verified ? '인증 완료' : '검토 중';

export default async function PartnerDashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">로그인이 필요합니다.</p>
      </div>
    );
  }

  try {
    // 임시로 빈 통계 데이터 사용
    const stats = {
      totalMatches: 0,
      successfulProjects: 0,
      totalRevenue: 0,
      averageRating: 0,
      verified: false,
      createdAt: new Date().toISOString(),
      location: '미설정',
      contactEmail: '미설정'
    };

    const overviewItems = [
      {
        label: '총 매칭 수',
        value: stats.totalMatches.toString(),
        icon: Users,
        accent: 'text-blue-400'
      },
      {
        label: '성공한 프로젝트',
        value: stats.successfulProjects.toString(),
        icon: Star,
        accent: 'text-yellow-400'
      },
      {
        label: '총 수익',
        value: currencyFormatter.format(stats.totalRevenue),
        icon: TrendingUp,
        accent: 'text-green-400'
      },
      {
        label: '평균 평점',
        value: stats.averageRating.toFixed(1),
        icon: Building2,
        accent: 'text-purple-400'
      }
    ];

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-white">파트너 대시보드</h1>
          <p className="mt-2 text-sm text-white/60">
            파트너 활동 현황과 통계를 확인하세요
          </p>
        </div>

        <section id="overview" className="space-y-6">
          <h2 className="text-xl font-semibold text-white">현황 요약</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overviewItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
                  <span>{item.label}</span>
                  <item.icon className={`h-4 w-4 ${item.accent}`} />
                </div>
                <p className="mt-4 text-xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="profile" className="space-y-6">
          <h2 className="text-xl font-semibold text-white">프로필 관리</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">인증 상태</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  stats.verified ? 'bg-green-500/10 text-green-300' : 'bg-yellow-500/10 text-yellow-300'
                }`}>
                  {statusLabel(stats.verified)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">등록일</span>
                <span className="text-sm text-white">{dateFormatter.format(new Date(stats.createdAt))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">위치</span>
                <span className="text-sm text-white">{stats.location || '미설정'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">연락처</span>
                <span className="text-sm text-white">{stats.contactEmail || '미설정'}</span>
              </div>
            </div>
          </div>
        </section>

        <section id="insights" className="space-y-6">
          <h2 className="text-xl font-semibold text-white">추천 아티스트</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/60">
              추천 아티스트 기능은 곧 출시될 예정입니다.
            </p>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    console.error('Failed to load partner dashboard data:', error);
    return (
      <div className="text-center py-12">
        <p className="text-white/60">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }
}