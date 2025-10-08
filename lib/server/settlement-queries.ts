import { eq, inArray, desc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { projects, settlements } from '@/lib/db/schema';

export interface SettlementSummary {
  id: string;
  projectId: string;
  projectTitle: string;
  totalRaised: number;
  netAmount: number;
  payoutStatus: string;
  createdAt: string;
  updatedAt: string;
}

const toSummary = (settlement: {
  id: string;
  projectId: string;
  totalRaised: number;
  netAmount: number;
  payoutStatus: string;
  createdAt: string;
  updatedAt: string;
  project: { id: string; title: string };
}): SettlementSummary => ({
  id: settlement.id,
  projectId: settlement.projectId,
  projectTitle: settlement.project.title,
  totalRaised: settlement.totalRaised,
  netAmount: settlement.netAmount,
  payoutStatus: settlement.payoutStatus,
  createdAt: settlement.createdAt,
  updatedAt: settlement.updatedAt
});

export const getSettlementsPendingPayout = async (limit = 5) => {
  const db = await getDb();
  const settlementsData = await db
    .select({
      id: settlements.id,
      projectId: settlements.projectId,
      totalRaised: settlements.totalRaised,
      netAmount: settlements.netAmount,
      payoutStatus: settlements.payoutStatus,
      createdAt: settlements.createdAt,
      updatedAt: settlements.updatedAt,
      project: {
        id: projects.id,
        title: projects.title
      }
    })
    .from(settlements)
    .innerJoin(projects, eq(settlements.projectId, projects.id))
    .where(inArray(settlements.payoutStatus, ['PENDING', 'IN_PROGRESS']))
    .orderBy(desc(settlements.updatedAt))
    .limit(limit);

  return settlementsData.map(toSummary);
};
