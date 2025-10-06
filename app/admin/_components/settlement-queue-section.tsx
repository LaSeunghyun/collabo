import {
  type SettlementPayoutStatusType
} from '@/types/drizzle';

import { getSettlementsPendingPayout } from '@/lib/server/settlement-queries';

const statusLabels: Record<SettlementPayoutStatusType, string> = {
  'PENDING': '?€ê¸°ì¤‘',
  'IN_PROGRESS': 'ì§„í–‰ì¤?,
  'PAID': '?„ë£Œ'
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
          <p className="text-xs uppercase tracking-wider text-primary/60">?•ì‚° ê´€ë¦?/p>
          <h2 className="mt-1 text-lg font-semibold text-white">?ˆì •??ì§€ê¸?/h2>
          <p className="mt-2 text-sm text-white/60">
            ?±ê³µ???„ë¡œ?íŠ¸??ì§€ê¸‰ì„ ì¶”ì ?˜ê³  ì°½ì‘?ë“¤???¼ì •??ë§ê²Œ ?ê¸ˆ??ë°›ì„ ???ˆë„ë¡??´ì£¼?¸ìš”.
          </p>
        </header>

        {settlements.length > 0 ? (
          <ul className="mt-6 space-y-3">
            {settlements.map((settlement: any) => (
              <li
                key={settlement.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.05] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{settlement.projectTitle}</p>
                  <p className="text-xs text-white/50">
                    ì´?ëª¨ê¸ˆ??{currencyFormatter.format(settlement.totalRaised)} | ?…ë°?´íŠ¸ {dateFormatter.format(settlement.updatedAt)}
                  </p>
                </div>
                <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                  {statusLabels[settlement.payoutStatus as SettlementPayoutStatusType]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
            ì§€ê¸??€ê¸?ì¤‘ì¸ ?•ì‚°???†ìŠµ?ˆë‹¤.
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
        <h2 className="text-lg font-semibold text-red-100">?•ì‚° ê´€ë¦?/h2>
        <p className="mt-2">?•ì‚° ?°ì´?°ë? ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤. ? ì‹œ ???¤ì‹œ ?œë„?´ì£¼?¸ìš”.</p>
      </section>
    );
  }
}
