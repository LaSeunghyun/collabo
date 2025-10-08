import { getModerationStats, getOpenModerationReports } from '@/lib/server/moderation';
import { ReportListSection } from './_components/report-list-section';
import { ReportStatsSection } from './_components/report-stats-section';

// ?�적 ?�더�?강제 - 빌드 ???�이?�베?�스 ?�근 방�?
export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const [stats, reports] = await Promise.all([
    getModerationStats(),
    getOpenModerationReports(50) // ??많�? ?�고�?가?�옴
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">?�고 관�?/h1>
        <p className="mt-2 text-sm text-white/60">
          커�??�티 ?�고�?검?�하�??�절??조치�?취하?�요.
        </p>
      </div>
      
      <ReportStatsSection stats={stats} />
      <ReportListSection reports={reports} />
    </div>
  );
}
