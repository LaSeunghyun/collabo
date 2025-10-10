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
  verified ? '?�증 ?�료' : '검??�?;

export default async function PartnerDashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">로그?�이 ?�요?�니??</p>
      </div>
    );
  }

  try {
    // ?�시�?�??�계 ?�이???�용
    const stats = {
      totalMatches: 0,
      successfulProjects: 0,
      totalRevenue: 0,
      averageRating: 0,
      verified: false,
      createdAt: new Date().toISOString(),
      location: '미설??,
      contactEmail: '미설??
    };

    const overviewItems = [
      {
        label: '�?매칭 ??,
        value: stats.totalMatches.toString(),
        icon: Users,
        accent: 'text-blue-400'
      },
      {
        label: '?�공???�로?�트',
        value: stats.successfulProjects.toString(),
        icon: Star,
        accent: 'text-yellow-400'
      },
      {
        label: '�??�익',
        value: currencyFormatter.format(stats.totalRevenue),
        icon: TrendingUp,
        accent: 'text-green-400'
      },
      {
        label: '?�균 ?�점',
        value: stats.averageRating.toFixed(1),
        icon: Building2,
        accent: 'text-purple-400'
      }
    ];

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-white">?�트???�?�보??/h1>
          <p className="mt-2 text-sm text-white/60">
            ?�트???�동 ?�황�??�계�??�인?�세??
          </p>
        </div>

        <section id="overview" className="space-y-6">
          <h2 className="text-xl font-semibold text-white">?�황 ?�약</h2>
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
          <h2 className="text-xl font-semibold text-white">?�로??관�?/h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">?�증 ?�태</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  stats.verified ? 'bg-green-500/10 text-green-300' : 'bg-yellow-500/10 text-yellow-300'
                }`}>
                  {statusLabel(stats.verified)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">?�록??/span>
                <span className="text-sm text-white">{dateFormatter.format(new Date(stats.createdAt))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">?�치</span>
                <span className="text-sm text-white">{stats.location || '미설??}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">?�락�?/span>
                <span className="text-sm text-white">{stats.contactEmail || '미설??}</span>
              </div>
            </div>
          </div>
        </section>

        <section id="insights" className="space-y-6">
          <h2 className="text-xl font-semibold text-white">추천 ?�티?�트</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/60">
              추천 ?�티?�트 기능?� �?출시???�정?�니??
            </p>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    console.error('Failed to load partner dashboard data:', error);
    return (
      <div className="text-center py-12">
        <p className="text-white/60">?�이?��? 불러?????�습?�다.</p>
      </div>
    );
  }
}
