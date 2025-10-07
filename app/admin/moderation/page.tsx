import { ModerationReportSection } from '../_components/moderation-report-section';

export default async function AdminModerationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">?�고 ?�??/h1>
        <p className="mt-2 text-sm text-white/60">
          ?�로 ?�출???�고�?검?�하�?빠르�??�?�하??커�??�티�?건강?�게 ?��??�주?�요.
        </p>
      </div>

      <ModerationReportSection />
    </div>
  );
}
