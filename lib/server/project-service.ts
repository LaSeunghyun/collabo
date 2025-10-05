import { ProjectStatus, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { responses } from './api-utils';

export interface ProjectCreateData {
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  thumbnail?: string;
  metadata?: any;
  ownerId: string;
}

export interface ProjectUpdateData {
  title?: string;
  description?: string;
  category?: string;
  targetAmount?: number;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  thumbnail?: string;
  metadata?: any;
  status?: ProjectStatus;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  category?: string;
  ownerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * 프로젝트 생성
 */
export async function createProject(data: ProjectCreateData) {
  try {
    const project = await prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        targetAmount: data.targetAmount,
        currency: data.currency || 'KRW',
        startDate: data.startDate,
        endDate: data.endDate,
        thumbnail: data.thumbnail,
        metadata: data.metadata,
        ownerId: data.ownerId,
        status: ProjectStatus.DRAFT
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        _count: {
          select: {
            fundings: true,
            orders: true
          }
        }
      }
    });

    return responses.success(project, '프로젝트가 생성되었습니다.');
  } catch (error) {
    console.error('프로젝트 생성 실패:', error);
    return responses.error('프로젝트 생성에 실패했습니다.');
  }
}

/**
 * 프로젝트 수정
 */
export async function updateProject(projectId: string, data: ProjectUpdateData, userId: string, userRole: UserRole) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return responses.notFound('프로젝트');
    }

    // 소유자 또는 관리자만 수정 가능
    if (project.ownerId !== userId && userRole !== UserRole.ADMIN) {
      return responses.forbidden();
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        _count: {
          select: {
            fundings: true,
            orders: true
          }
        }
      }
    });

    return responses.success(updatedProject, '프로젝트가 수정되었습니다.');
  } catch (error) {
    console.error('프로젝트 수정 실패:', error);
    return responses.error('프로젝트 수정에 실패했습니다.');
  }
}

/**
 * 프로젝트 목록 조회
 */
export async function getProjects(filters: ProjectFilters) {
  try {
    const { status, category, ownerId, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (status) where.status = status;
    if (category) where.category = category;
    if (ownerId) where.ownerId = ownerId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          },
          _count: {
            select: {
              fundings: true,
              orders: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.project.count({ where })
    ]);

    return responses.success({
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('프로젝트 목록 조회 실패:', error);
    return responses.error('프로젝트 목록을 불러올 수 없습니다.');
  }
}

/**
 * 프로젝트 상세 조회
 */
export async function getProject(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        fundings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        orders: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            fundings: true,
            orders: true,
            posts: true
          }
        }
      }
    });

    if (!project) {
      return responses.notFound('프로젝트');
    }

    return responses.success(project);
  } catch (error) {
    console.error('프로젝트 조회 실패:', error);
    return responses.error('프로젝트 정보를 불러올 수 없습니다.');
  }
}

/**
 * 프로젝트 상태 변경
 */
export async function updateProjectStatus(
  projectId: string, 
  status: ProjectStatus, 
  userId: string, 
  userRole: UserRole
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return responses.notFound('프로젝트');
    }

    // 소유자 또는 관리자만 상태 변경 가능
    if (project.ownerId !== userId && userRole !== UserRole.ADMIN) {
      return responses.forbidden();
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { status },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    return responses.success(updatedProject, '프로젝트 상태가 변경되었습니다.');
  } catch (error) {
    console.error('프로젝트 상태 변경 실패:', error);
    return responses.error('프로젝트 상태 변경에 실패했습니다.');
  }
}

/**
 * 프로젝트 통계 조회
 */
export async function getProjectStats(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return responses.notFound('프로젝트');
    }

    const [fundingStats, orderStats] = await Promise.all([
      prisma.funding.aggregate({
        where: { projectId },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.order.aggregate({
        where: { projectId },
        _sum: { totalPrice: true },
        _count: { id: true }
      })
    ]);

    const stats = {
      totalFunding: fundingStats._sum.amount || 0,
      fundingCount: fundingStats._count.id,
      totalOrders: orderStats._sum.totalPrice || 0,
      orderCount: orderStats._count.id,
      fundingProgress: project.targetAmount > 0 
        ? Math.min(((fundingStats._sum.amount || 0) / project.targetAmount) * 100, 100)
        : 0
    };

    return responses.success(stats);
  } catch (error) {
    console.error('프로젝트 통계 조회 실패:', error);
    return responses.error('프로젝트 통계를 불러올 수 없습니다.');
  }
}
