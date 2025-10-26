import { getAnalyticsOverview } from '@/lib/server/analytics';

import { AnalyticsOverviewSection } from './_components/analytics-overview-section';
import { ModerationReportSection } from './_components/moderation-report-section';
import { PartnerApprovalSection } from './_components/partner-approval-section';
import { ProjectReviewSection } from './_components/project-review-section';
import { SettlementQueueSection } from './_components/settlement-queue-section';

// 동적 렌더링 강제 - 빌드 시 데이터베이스 접근 방지
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  let overview;

  try {
    overview = await getAnalyticsOverview();
  } catch (error) {
    // 데이터베이스 연결 실패 시 빈 데이터로 fallback
    console.error('Failed to load analytics overview:', error);
    overview = {
      timestamp: new Date().toISOString(),
      totalVisits: 0,
      uniqueSessions: 0,
      uniqueUsers: 0,
      activeUsers: 0,
      dailyVisits: [],
      signupTrend: []
    };
  }

  return (
    <div className="space-y-10">
      <AnalyticsOverviewSection overview={overview} />
      <ProjectReviewSection />
      <PartnerApprovalSection />
      <ModerationReportSection />
      <SettlementQueueSection />
    </div>
  );
}
