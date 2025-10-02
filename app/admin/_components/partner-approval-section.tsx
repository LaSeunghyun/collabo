import { PartnerType, type PartnerTypeValue } from '@/types/prisma';

import { getPartnersAwaitingApproval } from '@/lib/server/partners';

const partnerTypeLabels: Record<PartnerTypeValue, string> = {
  [PartnerType.STUDIO]: 'Studio',
  [PartnerType.VENUE]: 'Venue',
  [PartnerType.PRODUCTION]: 'Production',
  [PartnerType.MERCHANDISE]: 'Merchandise',
  [PartnerType.OTHER]: 'Other'
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
          <p className="text-xs uppercase tracking-wider text-primary/60">Partner Approval</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Pending Partner Profiles</h2>
          <p className="mt-2 text-sm text-white/60">
            Review partners that are waiting for verification and approve the ones ready to collaborate.
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
                    {partnerTypeLabels[partner.type]} | Joined {dateFormatter.format(partner.createdAt)}
                  </p>
                </div>
                <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                  Pending
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
            There are no partner applications waiting for review.
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
        <h2 className="text-lg font-semibold text-red-100">Partner Approval</h2>
        <p className="mt-2">We could not load partner applications. Please try again shortly.</p>
      </section>
    );
  }
}
