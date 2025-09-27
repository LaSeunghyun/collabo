import { SettlementPayoutStatus } from '@/types/prisma';

import { getSettlementsPendingPayout } from '@/lib/server/settlement-queries';

const statusLabels: Record<SettlementPayoutStatus, string> = {
  [SettlementPayoutStatus.PENDING]: '정산 준비',
  [SettlementPayoutStatus.IN_PROGRESS]: '정산 진행 중',
  [SettlementPayoutStatus.PAID]: '정산 완료'
};

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0
});

const dateFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' });

export async function SettlementQueueSection() {
  const settlements = await getSettlementsPendingPayout();

  return (
    <section
      id="settlements"
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
    >
      <header>
        <p className="text-xs uppercase tracking-wider text-primary/60">정산 관리</p>
        <h2 className="mt-1 text-lg font-semibold text-white">정산 대기 목록</h2>
        <p className="mt-2 text-sm text-white/60">
          펀딩 성공 이후 정산 상태를 모니터링하고 지급 일정을 조율하세요.
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
                  총 모금액 {currencyFormatter.format(settlement.totalRaised)} · 업데이트{' '}
                  {dateFormatter.format(settlement.updatedAt)}
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
          진행 중인 정산 건이 없습니다.
        </p>
      )}
    </section>
  );
}
