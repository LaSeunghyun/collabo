import { SettlementPayoutStatus, type SettlementPayoutStatusType } from '@/types/prisma';

import { prisma } from '@/lib/prisma';

export interface SettlementSummary {
  id: string;
  projectId: string;
  projectTitle: string;
  totalRaised: number;
  netAmount: number;
  payoutStatus: SettlementPayoutStatusType;
  createdAt: Date;
  updatedAt: Date;
}

const toSummary = (settlement: {
  id: string;
  projectId: string;
  netAmount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  project: { id: string; title: string };
}): SettlementSummary => ({
  id: settlement.id,
  projectId: settlement.projectId,
  projectTitle: settlement.project.title,
  totalRaised: settlement.netAmount,
  netAmount: settlement.netAmount,
  payoutStatus: settlement.status as any,
  createdAt: settlement.createdAt,
  updatedAt: settlement.updatedAt
});

export const getSettlementsPendingPayout = async (limit = 5) => {
  const settlements = await prisma.settlement.findMany({
    where: {
      payouts: {
        some: {
          status: { in: [SettlementPayoutStatus.PENDING, SettlementPayoutStatus.IN_PROGRESS] }
        }
      }
    },
    include: {
      project: { select: { id: true, title: true } }
    },
    orderBy: { updatedAt: 'desc' },
    take: limit
  });

  return settlements.map(toSummary);
};
