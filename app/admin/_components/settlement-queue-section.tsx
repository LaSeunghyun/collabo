import { settlementPayoutStatus } from '@/drizzle/schema';

type SettlementPayoutStatusType = typeof settlementPayoutStatus.enumValues[number];

import { getSettlementsPendingPayout } from '@/lib/server/settlement-queries';

const statusLabels: Record<SettlementPayoutStatusType, string> = {
  'PENDING': '대기중',
  'IN_PROGRESS': '진행중',
  'PAID': '완료'
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
          <p className="text-xs uppercase tracking-wider text-primary/60">정산 관리</p>
          <h2 className="mt-1 text-lg font-semibold text-white">예정된 지급</h2>
          <p className="mt-2 text-sm text-white/60">
            성공한 프로젝트의 지급을 추적하고 창작자들이 일정에 맞게 자금을 받을 수 있도록 해주세요.
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
                    총 모금액 {currencyFormatter.format(settlement.totalRaised)} | 업데이트 {dateFormatter.format(settlement.updatedAt)}
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
            지급 대기 중인 정산이 없습니다.
          </p>
        )}
      </section>
    );
  } catch (error) {
    // Failed to load settlement queue - removed console.error for production
    return (
      <section
        id="settlements"
        className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100"
      >
        <h2 className="text-lg font-semibold text-red-100">정산 관리</h2>
        <p className="mt-2">정산 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
      </section>
    );
  }
}
