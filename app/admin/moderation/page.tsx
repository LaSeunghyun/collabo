import { ModerationReportSection } from '../_components/moderation-report-section';

export default async function AdminModerationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">? ê³  ?€??/h1>
        <p className="mt-2 text-sm text-white/60">
          ?ˆë¡œ ?œì¶œ??? ê³ ë¥?ê²€? í•˜ê³?ë¹ ë¥´ê²??€?‘í•˜??ì»¤ë??ˆí‹°ë¥?ê±´ê°•?˜ê²Œ ? ì??´ì£¼?¸ìš”.
        </p>
      </div>

      <ModerationReportSection />
    </div>
  );
}
