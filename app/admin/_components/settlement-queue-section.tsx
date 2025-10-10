import { getSettlementQueue } from '@/lib/server/settlement-queries';
import Link from 'next/link';

const statusLabels: Record<string, string> = {
  'PENDING': '?�기중',
  'IN_PROGRESS': '진행�?,
  'PAID': '?�료'
};

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW'
});

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export async function SettlementQueueSection() {
  try {
    const settlements = await getSettlementQueue();

    return (
      <section
        id="settlements"
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">?�산 ?�기열</h3>
            <p className="text-sm text-white/60">처리 ?��?중인 ?�산???�인?�고 관리하?�요</p>
          </div>
          <Link
            href="/admin/settlements"
            className="rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            ?�체 보기
          </Link>
        </div>

        {settlements.length > 0 ? (
          <div className="mt-6 space-y-3">
            {settlements.slice(0, 3).map((settlement) => (
              <div
                key={settlement.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span>?�로?�트 ID: {settlement.projectId.slice(0, 8)}...</span>
                      <span>??/span>
                      <span>{dateFormatter.format(new Date(settlement.createdAt))}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-4">
                      <div className="text-sm font-medium text-white">
                        �?모집금액: {currencyFormatter.format(settlement.totalRaised)}
                      </div>
                      <div className="text-sm text-white/60">
                        ?�수?? {currencyFormatter.format(settlement.netAmount)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-white/60">
                      <span>?�랫???�수�? {currencyFormatter.format(settlement.platformFee)}</span>
                      <span>게이?�웨???�수�? {currencyFormatter.format(settlement.gatewayFees)}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                      {statusLabels[settlement.payoutStatus]}
                    </span>
                    <button className="rounded-lg bg-blue-500/10 px-3 py-1 text-xs text-blue-300 transition hover:bg-blue-500/20">
                      처리?�기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 text-center text-white/60">
            처리 ?��?중인 ?�산???�습?�다.
          </div>
        )}
      </section>
    );
  } catch (error) {
    console.error('Failed to load settlement data:', error);
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="text-center text-white/60">
          ?�산 ?�이?��? 불러?????�습?�다.
        </div>
      </section>
    );
  }
}
