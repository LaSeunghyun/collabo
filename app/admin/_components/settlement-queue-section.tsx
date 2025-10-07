import {
  SettlementPayoutStatus,
  type SettlementPayoutStatusType
} from '@/types/auth';

import { getSettlementsPendingPayout } from '@/lib/server/settlement-queries';

const statusLabels: Record<SettlementPayoutStatusType, string> = {
  [SettlementPayoutStatus.PENDING]: '?�기중',
  [SettlementPayoutStatus.IN_PROGRESS]: '진행�?,
  [SettlementPayoutStatus.PAID]: '?�료'
};

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0
});

const dateFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' });

export async function SettlementQueueSection() {
  try {
    const settlements = await getSettlementsPendingPayout();

    return (
      <section
        id="settlements"
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
      >
        <header>
          <p className="text-xs uppercase tracking-wider text-primary/60">?�산 관�?/p>
          <h2 className="mt-1 text-lg font-semibold text-white">?�정??지�?/h2>
          <p className="mt-2 text-sm text-white/60">
            ?�공???�로?�트??지급을 추적?�고 창작?�들???�정??맞게 ?�금??받을 ???�도�??�주?�요.
          </p>
        </header>

        {settlements.length > 0 ? (
          <ul className="mt-6 space-y-3">
            {settlements.map((settlement) => (
              <li
                key={settlement.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.05] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{settlement.projectTitle}</p>
                  <p className="text-xs text-white/50">
                    �?모금??{currencyFormatter.format(settlement.totalRaised)} | ?�데?�트 {dateFormatter.format(settlement.updatedAt)}
                  </p>
                </div>
                <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                  {statusLabels[settlement.payoutStatus]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
            지�??��?중인 ?�산???�습?�다.
          </p>
        )}
      </section>
    );
  } catch (error) {
    console.error('Failed to load settlement queue', error);
    return (
      <section
        id="settlements"
        className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100"
      >
        <h2 className="text-lg font-semibold text-red-100">?�산 관�?/h2>
        <p className="mt-2">?�산 ?�이?��? 불러?????�습?�다. ?�시 ???�시 ?�도?�주?�요.</p>
      </section>
    );
  }
}
