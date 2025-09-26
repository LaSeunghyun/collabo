import { Settlement } from '@/types/prisma';

export type SettlementRecord = Omit<Settlement, 'distributionBreakdown' | 'notes' | 'payouts' | 'updatedAt'> & {
  distributed: boolean;
  totalAmount: number;
  platformShare: number;
};

export const fetchSettlement = async (projectId: string): Promise<SettlementRecord[]> => {
  const res = await fetch(`/api/settlement?projectId=${projectId}`);
  if (!res.ok) {
    const message = await res.json().catch(() => ({ error: '정산 정보를 불러오지 못했습니다.' }));
    throw new Error(message.error ?? '정산 정보를 불러오지 못했습니다.');
  }

  return res.json();
};
