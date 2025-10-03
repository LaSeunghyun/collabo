import { getAnalyticsOverview } from '@/lib/server/analytics';
import { getHandledModerationReportsByPost, getOpenModerationReports } from '@/lib/server/moderation';

import { AnalyticsOverviewSection } from './_components/analytics-overview-section';
import { ModerationReportSection } from './_components/moderation-report-section';
import { PartnerApprovalSection } from './_components/partner-approval-section';
import { ProjectReviewSection } from './_components/project-review-section';
import { SettlementQueueSection } from './_components/settlement-queue-section';

export default async function AdminDashboardPage() {
  const overview = await getAnalyticsOverview();

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
