import { SettlementPayoutStatus, SettlementStakeholderType, UserRole } from '@/types/drizzle';
import { prisma } from '@/lib/drizzle';
import { responses } from './api-responses';

export interface SettlementCreateData {
  projectId: string;
  netAmount: number;
  platformFee: number;
  stakeholders: Array<{
    userId: string;
    type: SettlementStakeholderType;
    amount: number;
    percentage: number;
    description?: string;
  }>;
  metadata?: any;
}

export interface SettlementUpdateData {
  status?: string;
  notes?: any;
  metadata?: any;
}

export interface SettlementPayoutCreateData {
  settlementId: string;
  stakeholderId: string;
  amount: number;
  bankInfo?: any;
  metadata?: any;
}

export interface SettlementFilters {
  projectId?: string;
  status?: string;
  stakeholderId?: string;
  page?: number;
  limit?: number;
}

/**
 * ?•ì‚° ?ì„±
 */
export async function createSettlement(data: SettlementCreateData) {
  try {
    const { projectId, netAmount, platformFee, stakeholders, metadata } = data;

    // ?„ë¡œ?íŠ¸ ì¡´ìž¬ ?•ì¸
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return responses.notFound('?„ë¡œ?íŠ¸');
    }

    // ê¸°ì¡´ ?•ì‚° ?•ì¸
    const existingSettlement = await prisma.settlement.findFirst({
      where: { projectId }
    });

    if (existingSettlement) {
      return responses.error('?´ë? ?•ì‚°???ì„±???„ë¡œ?íŠ¸?…ë‹ˆ??');
    }

    const settlement = await prisma.$transaction(async (tx) => {
      // ?•ì‚° ?ì„±
      const newSettlement = await tx.settlement.create({
        data: {
          projectId,
          totalAmount: netAmount,
          netAmount,
          platformFee,
          metadata
        }
      });

      // ?´í•´ê´€ê³„ìž ?ì„±
      const stakeholderPromises = stakeholders.map(stakeholder =>
        tx.settlementPayout.create({
          data: {
            settlementId: newSettlement.id,
            stakeholderId: stakeholder.userId,
            stakeholderType: stakeholder.type,
            amount: stakeholder.amount,
            percentage: stakeholder.percentage,
            description: stakeholder.description,
            status: SettlementPayoutStatus.PENDING
          }
        })
      );

      await Promise.all(stakeholderPromises);

      return newSettlement;
    });

    return responses.success(settlement, '?•ì‚°???ì„±?˜ì—ˆ?µë‹ˆ??');
  } catch (error) {
    console.error('?•ì‚° ?ì„± ?¤íŒ¨:', error);
    return responses.error('?•ì‚° ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ?•ì‚° ëª©ë¡ ì¡°íšŒ
 */
export async function getSettlements(filters: SettlementFilters) {
  try {
    const { projectId, status, stakeholderId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (stakeholderId) {
      where.payouts = {
        some: {
          stakeholderId
        }
      };
    }

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        skip,
        take: limit,
        include: {
          project: {
            select: {
              id: true,
              title: true,
              status: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true
                }
              }
            }
          },
          payouts: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.settlement.count({ where })
    ]);

    return responses.success({
      settlements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('?•ì‚° ëª©ë¡ ì¡°íšŒ ?¤íŒ¨:', error);
    return responses.error('?•ì‚° ëª©ë¡??ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
  }
}

/**
 * ?•ì‚° ?ì„¸ ì¡°íšŒ
 */
export async function getSettlement(settlementId: string) {
  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            targetAmount: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        },
        payouts: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!settlement) {
      return responses.notFound('?•ì‚°');
    }

    return responses.success(settlement);
  } catch (error) {
    console.error('?•ì‚° ì¡°íšŒ ?¤íŒ¨:', error);
    return responses.error('?•ì‚° ?•ë³´ë¥?ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
  }
}

/**
 * ?•ì‚° ?íƒœ ë³€ê²?
 */
export async function updateSettlementStatus(
  settlementId: string, 
  status: string, 
  userId: string, 
  userRole: UserRole
) {
  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { project: true }
    });

    if (!settlement) {
      return responses.notFound('?•ì‚°');
    }

    // ?„ë¡œ?íŠ¸ ?Œìœ ???ëŠ” ê´€ë¦¬ìžë§??íƒœ ë³€ê²?ê°€??
    if (settlement.project.ownerId !== userId && userRole !== UserRole.ADMIN) {
      return responses.forbidden();
    }

    const updatedSettlement = await prisma.settlement.update({
      where: { id: settlementId },
      data: { status },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    return responses.success(updatedSettlement, '?•ì‚° ?íƒœê°€ ë³€ê²½ë˜?ˆìŠµ?ˆë‹¤.');
  } catch (error) {
    console.error('?•ì‚° ?íƒœ ë³€ê²??¤íŒ¨:', error);
    return responses.error('?•ì‚° ?íƒœ ë³€ê²½ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ?•ì‚° ì§€ê¸?ì²˜ë¦¬
 */
export async function processSettlementPayout(
  payoutId: string, 
  status: SettlementPayoutStatus, 
  userId: string, 
  userRole: UserRole,
  notes?: any
) {
  try {
    const payout = await prisma.settlementPayout.findUnique({
      where: { id: payoutId },
      include: {
        settlement: {
          include: {
            project: true
          }
        }
      }
    });

    if (!payout) {
      return responses.notFound('?•ì‚° ì§€ê¸?);
    }

    // ?„ë¡œ?íŠ¸ ?Œìœ ???ëŠ” ê´€ë¦¬ìžë§?ì§€ê¸?ì²˜ë¦¬ ê°€??
    if (payout.settlement.project.ownerId !== userId && userRole !== UserRole.ADMIN) {
      return responses.forbidden();
    }

    const updateData: any = { status };
    
    if (status === SettlementPayoutStatus.PAID) {
      updateData.paidAt = new Date();
    }

    if (notes) {
      updateData.notes = notes;
    }

    const updatedPayout = await prisma.settlementPayout.update({
      where: { id: payoutId },
      data: updateData,
      include: {
        settlement: {
        select: {
          id: true,
          projectId: true,
          netAmount: true
        }
        }
      }
    });

    return responses.success(updatedPayout, '?•ì‚° ì§€ê¸‰ì´ ì²˜ë¦¬?˜ì—ˆ?µë‹ˆ??');
  } catch (error) {
    console.error('?•ì‚° ì§€ê¸?ì²˜ë¦¬ ?¤íŒ¨:', error);
    return responses.error('?•ì‚° ì§€ê¸?ì²˜ë¦¬???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}

/**
 * ?•ì‚° ?µê³„ ì¡°íšŒ
 */
export async function getSettlementStats(projectId?: string) {
  try {
    const where = projectId ? { projectId } : {};

    const [totalSettlements, pendingSettlements, completedSettlements, netAmount] = await Promise.all([
      prisma.settlement.count({ where }),
      prisma.settlement.count({ 
        where: { 
          ...where, 
          status: 'PENDING' 
        } 
      }),
      prisma.settlement.count({ 
        where: { 
          ...where, 
          status: 'COMPLETED' 
        } 
      }),
      prisma.settlement.aggregate({
        where,
        _sum: { netAmount: true }
      })
    ]);

    const stats = {
      totalSettlements,
      pendingSettlements,
      completedSettlements,
      totalAmount: netAmount._sum.netAmount || 0
    };

    return responses.success(stats);
  } catch (error) {
    console.error('?•ì‚° ?µê³„ ì¡°íšŒ ?¤íŒ¨:', error);
    return responses.error('?•ì‚° ?µê³„ë¥?ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
  }
}

/**
 * ?„ë¡œ?íŠ¸ ?•ì‚° ?ë™ ?ì„±
 */
export async function autoCreateSettlement(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        fundings: {
          where: {
            paymentStatus: 'SUCCEEDED'
          }
        },
        orders: {
          where: {
            orderStatus: 'PAID'
          }
        }
      }
    });

    if (!project) {
      return responses.notFound('?„ë¡œ?íŠ¸');
    }

    // ì´??˜ìµ ê³„ì‚°
    const totalFunding = project.fundings.reduce((sum, funding) => sum + funding.amount, 0);
    const totalOrders = project.orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalAmount = totalFunding + totalOrders;

    if (totalAmount <= 0) {
      return responses.error('?•ì‚°??ê¸ˆì•¡???†ìŠµ?ˆë‹¤.');
    }

    // ?Œëž«???˜ìˆ˜ë£?(5%)
    const platformFee = Math.floor(totalAmount * 0.05);
    const netAmount = totalAmount - platformFee;

    // ?´í•´ê´€ê³„ìž êµ¬ì„±
    const stakeholders = [
      {
        userId: project.ownerId,
        type: SettlementStakeholderType.CREATOR,
        amount: netAmount,
        percentage: 100,
        description: '?„ë¡œ?íŠ¸ ì°½ìž‘??
      }
    ];

    return await createSettlement({
      projectId,
      netAmount,
      platformFee,
      stakeholders
    });
  } catch (error) {
    console.error('?ë™ ?•ì‚° ?ì„± ?¤íŒ¨:', error);
    return responses.error('?ë™ ?•ì‚° ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
  }
}
