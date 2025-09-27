import { ModerationReportSection } from './_components/moderation-report-section';
import { PartnerApprovalSection } from './_components/partner-approval-section';
import { ProjectReviewSection } from './_components/project-review-section';
import { SettlementQueueSection } from './_components/settlement-queue-section';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-10">
      <ProjectReviewSection />
      <PartnerApprovalSection />
      <ModerationReportSection />
      <SettlementQueueSection />
    </div>
  );
}
