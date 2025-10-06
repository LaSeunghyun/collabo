import { ProjectStatus, UserRole } from '@/types/drizzle';
import { db } from '@/lib/prisma';
import { projects, users, fundings, orders } from '@/lib/db/schema';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import { responses } from './api-responses';

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
    const project = await db.insert(projects).values({
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
    }).returning();

    // 프로젝트와 관련 데이터를 조회
    const projectWithDetails = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        category: projects.category,
        targetAmount: projects.targetAmount,
        currentAmount: projects.currentAmount,
        currency: projects.currency,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        thumbnail: projects.thumbnail,
        metadata: projects.metadata,
        ownerId: projects.ownerId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        owner: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl
        },
        fundingCount: sql<number>`count(${fundings.id})`.as('fundingCount')
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .leftJoin(fundings, eq(projects.id, fundings.projectId))
      .where(eq(projects.id, project[0].id))
      .groupBy(projects.id, users.id)
      .limit(1);

    return responses.success(projectWithDetails[0], '프로젝트가 생성되었습니다.');
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
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return responses.notFound('프로젝트');
    }

    // 소유자 또는 관리자만 수정 가능
    if (project[0].ownerId !== userId && userRole !== UserRole.ADMIN) {
      return responses.forbidden();
    }

    await db.update(projects).set(data).where(eq(projects.id, projectId));

    // 업데이트된 프로젝트와 관련 데이터를 조회
    const updatedProject = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        category: projects.category,
        targetAmount: projects.targetAmount,
        currentAmount: projects.currentAmount,
        currency: projects.currency,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        thumbnail: projects.thumbnail,
        metadata: projects.metadata,
        ownerId: projects.ownerId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        owner: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl
        },
        fundingCount: sql<number>`count(${fundings.id})`.as('fundingCount')
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .leftJoin(fundings, eq(projects.id, fundings.projectId))
      .where(eq(projects.id, projectId))
      .groupBy(projects.id, users.id)
      .limit(1);

    return responses.success(updatedProject[0], '프로젝트가 수정되었습니다.');
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

    let query = db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        category: projects.category,
        targetAmount: projects.targetAmount,
        currentAmount: projects.currentAmount,
        currency: projects.currency,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        thumbnail: projects.thumbnail,
        metadata: projects.metadata,
        ownerId: projects.ownerId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        owner: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl
        },
        fundingCount: sql<number>`count(${fundings.id})`.as('fundingCount')
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .leftJoin(fundings, eq(projects.id, fundings.projectId))
      .groupBy(projects.id, users.id)
      .orderBy(desc(projects.createdAt));

    // 필터 적용
    const conditions = [];
    if (status) conditions.push(eq(projects.status, status));
    if (category) conditions.push(eq(projects.category, category));
    if (ownerId) conditions.push(eq(projects.ownerId, ownerId));
    if (search) {
      conditions.push(
        or(
          like(projects.title, `%${search}%`),
          like(projects.description, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

      // 총 개수 조회를 위한 별도 쿼리
      db.select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    return responses.success({
      projects: projectsResult,
      pagination: {
        page,
        limit,
        total: totalResult[0]?.count || 0,
        pages: Math.ceil((totalResult[0]?.count || 0) / limit)
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
    const project = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        category: projects.category,
        targetAmount: projects.targetAmount,
        currentAmount: projects.currentAmount,
        currency: projects.currency,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        thumbnail: projects.thumbnail,
        metadata: projects.metadata,
        ownerId: projects.ownerId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        owner: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl
        },
        fundingCount: sql<number>`count(${fundings.id})`.as('fundingCount')
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .leftJoin(fundings, eq(projects.id, fundings.projectId))
      .where(eq(projects.id, projectId))
      .groupBy(projects.id, users.id)
      .limit(1);

    if (project.length === 0) {
      return responses.notFound('프로젝트');
    }

    return responses.success(project[0]);
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
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return responses.notFound('프로젝트');
    }

    // 소유자 또는 관리자만 상태 변경 가능
    if (project[0].ownerId !== userId && userRole !== UserRole.ADMIN) {
      return responses.forbidden();
    }

    await db.update(projects).set({ status }).where(eq(projects.id, projectId));

    const updatedProject = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        category: projects.category,
        targetAmount: projects.targetAmount,
        currentAmount: projects.currentAmount,
        currency: projects.currency,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        thumbnail: projects.thumbnail,
        metadata: projects.metadata,
        ownerId: projects.ownerId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        owner: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl
        }
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .where(eq(projects.id, projectId))
      .limit(1);

    return responses.success(updatedProject[0], '프로젝트 상태가 변경되었습니다.');
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
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return responses.notFound('프로젝트');
    }

    const [fundingStats, orderStats] = await Promise.all([
      db
        .select({
          totalAmount: sql<number>`sum(${fundings.amount})`,
          count: sql<number>`count(${fundings.id})`
        })
        .from(fundings)
        .where(eq(fundings.projectId, projectId)),
      db
        .select({
          totalAmount: sql<number>`sum(${orders.totalPrice})`,
          count: sql<number>`count(${orders.id})`
        })
        .from(orders)
        .where(eq(orders.projectId, projectId))
    ]);

    const stats = {
      totalFunding: fundingStats[0]?.totalAmount || 0,
      fundingCount: fundingStats[0]?.count || 0,
      totalOrders: orderStats[0]?.totalAmount || 0,
      orderCount: orderStats[0]?.count || 0,
      fundingProgress: project[0].targetAmount > 0 
        ? Math.min(((fundingStats[0]?.totalAmount || 0) / project[0].targetAmount) * 100, 100)
        : 0
    };

    return responses.success(stats);
  } catch (error) {
    console.error('프로젝트 통계 조회 실패:', error);
    return responses.error('프로젝트 통계를 불러올 수 없습니다.');
  }
}
