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
  verified ? '?¸ì¦ ?„ë£Œ' : 'ê²€??ì¤?;

export default async function PartnerDashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??</p>
      </div>
    );
  }

  try {
    // ?„ì‹œë¡?ë¹??µê³„ ?°ì´???¬ìš©
    const stats = {
      totalMatches: 0,
      successfulProjects: 0,
      totalRevenue: 0,
      averageRating: 0,
      verified: false,
      createdAt: new Date().toISOString(),
      location: 'ë¯¸ì„¤??,
      contactEmail: 'ë¯¸ì„¤??
    };

    const overviewItems = [
      {
        label: 'ì´?ë§¤ì¹­ ??,
        value: stats.totalMatches.toString(),
        icon: Users,
        accent: 'text-blue-400'
      },
      {
        label: '?±ê³µ???„ë¡œ?íŠ¸',
        value: stats.successfulProjects.toString(),
        icon: Star,
        accent: 'text-yellow-400'
      },
      {
        label: 'ì´??˜ìµ',
        value: currencyFormatter.format(stats.totalRevenue),
        icon: TrendingUp,
        accent: 'text-green-400'
      },
      {
        label: '?‰ê·  ?‰ì ',
        value: stats.averageRating.toFixed(1),
        icon: Building2,
        accent: 'text-purple-400'
      }
    ];

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-white">?ŒíŠ¸???€?œë³´??/h1>
          <p className="mt-2 text-sm text-white/60">
            ?ŒíŠ¸???œë™ ?„í™©ê³??µê³„ë¥??•ì¸?˜ì„¸??
          </p>
        </div>

        <section id="overview" className="space-y-6">
          <h2 className="text-xl font-semibold text-white">?„í™© ?”ì•½</h2>
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
          <h2 className="text-xl font-semibold text-white">?„ë¡œ??ê´€ë¦?/h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">?¸ì¦ ?íƒœ</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  stats.verified ? 'bg-green-500/10 text-green-300' : 'bg-yellow-500/10 text-yellow-300'
                }`}>
                  {statusLabel(stats.verified)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">?±ë¡??/span>
                <span className="text-sm text-white">{dateFormatter.format(new Date(stats.createdAt))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">?„ì¹˜</span>
                <span className="text-sm text-white">{stats.location || 'ë¯¸ì„¤??}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">?°ë½ì²?/span>
                <span className="text-sm text-white">{stats.contactEmail || 'ë¯¸ì„¤??}</span>
              </div>
            </div>
          </div>
        </section>

        <section id="insights" className="space-y-6">
          <h2 className="text-xl font-semibold text-white">ì¶”ì²œ ?„í‹°?¤íŠ¸</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/60">
              ì¶”ì²œ ?„í‹°?¤íŠ¸ ê¸°ëŠ¥?€ ê³?ì¶œì‹œ???ˆì •?…ë‹ˆ??
            </p>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    console.error('Failed to load partner dashboard data:', error);
    return (
      <div className="text-center py-12">
        <p className="text-white/60">?°ì´?°ë? ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.</p>
      </div>
    );
  }
}
