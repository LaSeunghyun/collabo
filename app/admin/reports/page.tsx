import { getModerationStats, getOpenModerationReports } from '@/lib/server/moderation';
import { ReportListSection } from './_components/report-list-section';
import { ReportStatsSection } from './_components/report-stats-section';

// ?™ì  ?Œë”ë§?ê°•ì œ - ë¹Œë“œ ???°ì´?°ë² ?´ìŠ¤ ?‘ê·¼ ë°©ì?
export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const [stats, reports] = await Promise.all([
    getModerationStats(),
    getOpenModerationReports(50) // ??ë§ì? ? ê³ ë¥?ê°€?¸ì˜´
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">? ê³  ê´€ë¦?/h1>
        <p className="mt-2 text-sm text-white/60">
          ì»¤ë??ˆí‹° ? ê³ ë¥?ê²€? í•˜ê³??ì ˆ??ì¡°ì¹˜ë¥?ì·¨í•˜?¸ìš”.
        </p>
      </div>
      
      <ReportStatsSection stats={stats} />
      <ReportListSection reports={reports} />
    </div>
  );
}
