export interface Settlement {
  id: string;
  projectId: string;
  totalRaised: number;
  platformFee: number;
  creatorShare: number;
  partnerShare: number;
  collaboratorShare: number;
  gatewayFees: number;
  netAmount: number;
  payoutStatus: string;
  distributionBreakdown?: any;
  notes?: any;
  createdAt: string;
  updatedAt: string;
  payouts?: any[];
}

export type SettlementRecord = Omit<Settlement, 'distributionBreakdown' | 'notes' | 'payouts' | 'updatedAt'> & {
  distributed: boolean;
  totalAmount: number;
  platformShare: number;
};

export const fetchSettlement = async (projectId: string): Promise<SettlementRecord[]> => {
  const res = await fetch(`/api/settlement?projectId=${projectId}`);
  if (!res.ok) {
    const message = await res.json().catch(() => ({ error: '?•ì‚° ?•ë³´ë¥?ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.' }));
    throw new Error(message.error ?? '?•ì‚° ?•ë³´ë¥?ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
  }

  return res.json();
};
