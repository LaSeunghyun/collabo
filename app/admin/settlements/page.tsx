import { getSettlementsPendingPayout } from '@/lib/server/settlement-queries';
import {
  SettlementPayoutStatus,
  type SettlementPayoutStatusType
} from '@/types/auth';

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

export default async function AdminSettlementsPage() {
  try {
    const settlements = await getSettlementsPendingPayout();

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">?�산 관�?/h1>
          <p className="mt-2 text-sm text-white/60">
            ?�공???�로?�트??지급을 추적?�고 창작?�들???�정??맞게 ?�금??받을 ???�도�??�주?�요.
          </p>
        </div>

        {settlements.length > 0 ? (
          <div className="space-y-4">
            {settlements.map((settlement) => (
              <div
                key={settlement.id}
                className="rounded-2xl border border-white/5 bg-white/[0.05] p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white">{settlement.projectTitle}</h3>
                    <p className="mt-1 text-sm text-white/60">
                      �?모금??{currencyFormatter.format(settlement.totalRaised)} | ?�데?�트 {dateFormatter.format(settlement.updatedAt)}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-white/60">�?모금??/p>
                        <p className="font-medium text-white">{currencyFormatter.format(settlement.totalRaised)}</p>
                      </div>
                      <div>
                        <p className="text-white/60">?�산 금액</p>
                        <p className="font-medium text-white">{currencyFormatter.format(settlement.netAmount)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                      {statusLabels[settlement.payoutStatus]}
                    </span>
                    {settlement.payoutStatus === SettlementPayoutStatus.PENDING && (
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                          지�??�작
                        </button>
                        <button className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
                          보류
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-8 py-12 text-center">
            <p className="text-sm text-white/60">지�??��?중인 ?�산???�습?�다.</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('?�산 목록 로드 ?�패:', error);
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100">
        <h2 className="text-lg font-semibold text-red-100">?�산 관�?/h2>
        <p className="mt-2">?�산 ?�이?��? 불러?????�습?�다. ?�시 ???�시 ?�도?�주?�요.</p>
      </div>
    );
  }
}
