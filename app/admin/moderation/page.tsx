import { ModerationReportSection } from '../_components/moderation-report-section';

export default async function AdminModerationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">신고 대응</h1>
        <p className="mt-2 text-sm text-white/60">
          새로 제출된 신고를 검토하고 빠르게 대응하여 커뮤니티를 건강하게 유지해주세요.
        </p>
      </div>

      <ModerationReportSection />
    </div>
  );
}
