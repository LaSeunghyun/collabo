import { SettlementPayoutStatus, SettlementStakeholderType, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { responses } from './api-responses';

export interface SettlementCreateData {
  projectId: string;
  totalAmount: number;
  platformFee: number;
  netAmount: number;
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
 * 정산 생성
 */
export async function createSettlement(data: SettlementCreateData) {
  try {
    const { projectId, totalAmount, platformFee, netAmount, stakeholders, metadata } = data;

    // 프로젝트 존재 확인
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return responses.notFound('프로젝트');
    }

    // 기존 정산 확인
    const existingSettlement = await prisma.settlement.findFirst({
      where: { projectId }
    });

    if (existingSettlement) {
      return responses.error('이미 정산이 생성된 프로젝트입니다.');
    }

    const settlement = await prisma.$transaction(async (tx) => {
      // 정산 생성
      const newSettlement = await tx.settlement.create({
        data: {
          projectId,
          totalAmount,
          platformFee,
          netAmount,
          metadata
        }
      });

      // 이해관계자 생성
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

    return responses.success(settlement, '정산이 생성되었습니다.');
  } catch (error) {
    console.error('정산 생성 실패:', error);
    return responses.error('정산 생성에 실패했습니다.');
  }
}

/**
 * 정산 목록 조회
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
    console.error('정산 목록 조회 실패:', error);
    return responses.error('정산 목록을 불러올 수 없습니다.');
  }
}

/**
 * 정산 상세 조회
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
      return responses.notFound('정산');
    }

    return responses.success(settlement);
  } catch (error) {
    console.error('정산 조회 실패:', error);
    return responses.error('정산 정보를 불러올 수 없습니다.');
  }
}

/**
 * 정산 상태 변경
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
      return responses.notFound('정산');
    }

    // 프로젝트 소유자 또는 관리자만 상태 변경 가능
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

    return responses.success(updatedSettlement, '정산 상태가 변경되었습니다.');
  } catch (error) {
    console.error('정산 상태 변경 실패:', error);
    return responses.error('정산 상태 변경에 실패했습니다.');
  }
}

/**
 * 정산 지급 처리
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
      return responses.notFound('정산 지급');
    }

    // 프로젝트 소유자 또는 관리자만 지급 처리 가능
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
            totalAmount: true
          }
        }
      }
    });

    return responses.success(updatedPayout, '정산 지급이 처리되었습니다.');
  } catch (error) {
    console.error('정산 지급 처리 실패:', error);
    return responses.error('정산 지급 처리에 실패했습니다.');
  }
}

/**
 * 정산 통계 조회
 */
export async function getSettlementStats(projectId?: string) {
  try {
    const where = projectId ? { projectId } : {};

    const [totalSettlements, pendingSettlements, completedSettlements, totalAmount] = await Promise.all([
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
        _sum: { totalAmount: true }
      })
    ]);

    const stats = {
      totalSettlements,
      pendingSettlements,
      completedSettlements,
      totalAmount: totalAmount._sum.totalAmount || 0
    };

    return responses.success(stats);
  } catch (error) {
    console.error('정산 통계 조회 실패:', error);
    return responses.error('정산 통계를 불러올 수 없습니다.');
  }
}

/**
 * 프로젝트 정산 자동 생성
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
      return responses.notFound('프로젝트');
    }

    // 총 수익 계산
    const totalFunding = project.fundings.reduce((sum, funding) => sum + funding.amount, 0);
    const totalOrders = project.orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalAmount = totalFunding + totalOrders;

    if (totalAmount <= 0) {
      return responses.error('정산할 금액이 없습니다.');
    }

    // 플랫폼 수수료 (5%)
    const platformFee = Math.floor(totalAmount * 0.05);
    const netAmount = totalAmount - platformFee;

    // 이해관계자 구성
    const stakeholders = [
      {
        userId: project.ownerId,
        type: SettlementStakeholderType.CREATOR,
        amount: netAmount,
        percentage: 100,
        description: '프로젝트 창작자'
      }
    ];

    return await createSettlement({
      projectId,
      totalAmount,
      platformFee,
      netAmount,
      stakeholders
    });
  } catch (error) {
    console.error('자동 정산 생성 실패:', error);
    return responses.error('자동 정산 생성에 실패했습니다.');
  }
}
