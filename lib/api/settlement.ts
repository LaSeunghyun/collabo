import { Settlement } from '@/types/auth';

export type SettlementRecord = Omit<Settlement, 'distributionBreakdown' | 'notes' | 'payouts' | 'updatedAt'> & {
  distributed: boolean;
  totalAmount: number;
  platformShare: number;
};

export const fetchSettlement = async (projectId: string): Promise<SettlementRecord[]> => {
  const res = await fetch(`/api/settlement?projectId=${projectId}`);
  if (!res.ok) {
    const message = await res.json().catch(() => ({ error: '?•ì‚° ?•ë³´ë¥?ë¶ˆëŸ¬?¤ì? ëª»í–ˆ?µë‹ˆ??' }));
    throw new Error(message.error ?? '?•ì‚° ?•ë³´ë¥?ë¶ˆëŸ¬?¤ì? ëª»í–ˆ?µë‹ˆ??');
  }

  return res.json();
};
