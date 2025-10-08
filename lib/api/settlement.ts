import { Settlement } from '@/types/shared';

export type SettlementRecord = Omit<Settlement, 'distributionBreakdown' | 'notes' | 'payouts' | 'updatedAt'> & {
  distributed: boolean;
  totalAmount: number;
  platformShare: number;
};

export const fetchSettlement = async (projectId: string): Promise<SettlementRecord[]> => {
  const res = await fetch(`/api/settlement?projectId=${projectId}`);
  if (!res.ok) {
    const message = await res.json().catch(() => ({ error: '?�산 ?�보�?불러?��? 못했?�니??' }));
    throw new Error(message.error ?? '?�산 ?�보�?불러?��? 못했?�니??');
  }

  return res.json();
};
