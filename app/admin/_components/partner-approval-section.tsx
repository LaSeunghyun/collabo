import { PartnerType, type PartnerTypeType } from '@/types/auth';

import { getPartnersAwaitingApproval } from '@/lib/server/partners';

const partnerTypeLabels: Record<PartnerTypeType, string> = {
  [PartnerType.STUDIO]: '?�튜?�오',
  [PartnerType.VENUE]: '공연??,
  [PartnerType.PRODUCTION]: '?�작??,
  [PartnerType.MERCHANDISE]: '굿즈',
  [PartnerType.OTHER]: '기�?'
};

const dateFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' });

export async function PartnerApprovalSection() {
  try {
    const partners = await getPartnersAwaitingApproval();

    return (
      <section
        id="partner-approvals"
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
      >
        <header>
          <p className="text-xs uppercase tracking-wider text-primary/60">?�트???�인</p>
          <h2 className="mt-1 text-lg font-semibold text-white">?�인 ?��?중인 ?�트???�로??/h2>
          <p className="mt-2 text-sm text-white/60">
            검증을 기다리는 ?�트?�들??검?�하�??�업 준비�? ???�트?�들???�인?�주?�요.
          </p>
        </header>

        {partners.length > 0 ? (
          <ul className="mt-6 space-y-3">
            {partners.map((partner) => (
              <li
                key={partner.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.05] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{partner.name}</p>
                  <p className="text-xs text-white/50">
                    {partnerTypeLabels[partner.type]} | 가?�일 {dateFormatter.format(partner.createdAt)}
                  </p>
                </div>
                <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                  ?�기중
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
            검???��?중인 ?�트???�청???�습?�다.
          </p>
        )}
      </section>
    );
  } catch (error) {
    console.error('Failed to load partners awaiting approval', error);
    return (
      <section
        id="partner-approvals"
        className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100"
      >
        <h2 className="text-lg font-semibold text-red-100">?�트???�인</h2>
        <p className="mt-2">?�트???�청??불러?????�습?�다. ?�시 ???�시 ?�도?�주?�요.</p>
      </section>
    );
  }
}
