import { getModerationStats, getOpenModerationReports } from '@/lib/server/moderation';
import { ReportListSection } from './_components/report-list-section';
import { ReportStatsSection } from './_components/report-stats-section';

// 동적 렌더링 강제 - 빌드 시 데이터베이스 접근 방지
export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const [stats, reports] = await Promise.all([
    getModerationStats(),
    getOpenModerationReports(50) // 더 많은 신고를 가져옴
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">신고 관리</h1>
        <p className="mt-2 text-sm text-white/60">
          커뮤니티 신고를 검토하고 적절한 조치를 취하세요.
        </p>
      </div>
      
      <ReportStatsSection stats={stats} />
      <ReportListSection reports={reports} />
    </div>
  );
}
