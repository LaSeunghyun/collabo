import { getHandledModerationReportsByPost, getOpenModerationReports } from '@/lib/server/moderation';
import { ModerationReportSection } from '../_components/moderation-report-section';

export default async function AdminModerationPage() {
  try {
    const [reports, handledReports] = await Promise.all([
      getOpenModerationReports(),
      getHandledModerationReportsByPost()
    ]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">신고 대응</h1>
          <p className="mt-2 text-sm text-white/60">
            새로 제출된 신고를 검토하고 빠르게 대응하여 커뮤니티를 건강하게 유지해주세요.
          </p>
        </div>

        <ModerationReportSection reports={reports} handledReports={handledReports} />
      </div>
    );
  } catch (error) {
    console.error('신고 목록 로드 실패:', error);
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100">
        <h2 className="text-lg font-semibold text-red-100">신고 대응</h2>
        <p className="mt-2">신고 목록을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }
}
