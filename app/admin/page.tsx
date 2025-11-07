import dynamic from 'next/dynamic';
import { getAnalyticsOverview } from '@/lib/server/analytics';
import { Logger } from '@/lib/utils/logger';

// 관리자 섹션 컴포넌트들을 동적 import로 코드 스플리팅
const AnalyticsOverviewSection = dynamic(
  () => import('./_components/analytics-overview-section').then(mod => ({ default: mod.AnalyticsOverviewSection })),
  { ssr: true }
);

const ModerationReportSection = dynamic(
  () => import('./_components/moderation-report-section').then(mod => ({ default: mod.ModerationReportSection })),
  { ssr: true }
);

const PartnerApprovalSection = dynamic(
  () => import('./_components/partner-approval-section').then(mod => ({ default: mod.PartnerApprovalSection })),
  { ssr: true }
);

const ProjectReviewSection = dynamic(
  () => import('./_components/project-review-section').then(mod => ({ default: mod.ProjectReviewSection })),
  { ssr: true }
);

const SettlementQueueSection = dynamic(
  () => import('./_components/settlement-queue-section').then(mod => ({ default: mod.SettlementQueueSection })),
  { ssr: true }
);

// 동적 렌더링 강제 - 빌드 시 데이터베이스 접근 방지
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  let overview;

  try {
    overview = await getAnalyticsOverview();
  } catch (error) {
    // 데이터베이스 연결 실패 시 빈 데이터로 fallback
    Logger.errorOccurred(
      error instanceof Error ? error : new Error('Failed to load analytics overview'),
      'AdminDashboardPage',
      { operation: 'load_analytics_overview' }
    );
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
