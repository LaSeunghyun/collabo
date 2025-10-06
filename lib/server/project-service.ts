import { type ProjectStatusType, type UserRoleType } from '@/types/drizzle';
import { db } from '@/lib/drizzle';
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
  status?: ProjectStatusType;
}

export interface ProjectFilters {
  status?: ProjectStatusType;
  category?: string;
  ownerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * ?�로?�트 ?�성
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
      status: 'DRAFT' as ProjectStatusType
    }).returning();

    // ?�로?�트?� 관???�이?��? 조회
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

    return responses.success(projectWithDetails[0], '?�로?�트가 ?�성?�었?�니??');
  } catch (error) {
    console.error('?�로?�트 ?�성 ?�패:', error);
    return responses.error('?�로?�트 ?�성???�패?�습?�다.');
  }
}

/**
 * ?�로?�트 ?�정
 */
export async function updateProject(projectId: string, data: ProjectUpdateData, userId: string, userRole: UserRoleType) {
  try {
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return responses.notFound('?�로?�트');
    }

    // ?�유???�는 관리자�??�정 가??
    if (project[0].ownerId !== userId && userRole !== 'ADMIN') {
      return responses.forbidden();
    }

    await db.update(projects).set(data).where(eq(projects.id, projectId));

    // ?�데?�트???�로?�트?� 관???�이?��? 조회
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

    return responses.success(updatedProject[0], '?�로?�트가 ?�정?�었?�니??');
  } catch (error) {
    console.error('?�로?�트 ?�정 ?�패:', error);
    return responses.error('?�로?�트 ?�정???�패?�습?�다.');
  }
}

/**
 * ?�로?�트 목록 조회
 */
export async function getProjects(filters: ProjectFilters) {
  try {
    const { status, category, ownerId, search, page = 1, limit = 20 } = filters;

    // ?�터 조건 구성
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

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const projectsResult = await db
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
      .where(whereCondition)
      .groupBy(projects.id, users.id)
      .orderBy(desc(projects.createdAt))
      .offset((page - 1) * limit)
      .limit(limit);

    // �?개수 조회�??�한 별도 쿼리
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(whereCondition);

    return responses.success({
      projects: projectsResult,
      pagination: {
        page,
        limit,
        total: countResult[0]?.count || 0,
        pages: Math.ceil((countResult[0]?.count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('?�로?�트 목록 조회 ?�패:', error);
    return responses.error('?�로?�트 목록??불러?????�습?�다.');
  }
}

/**
 * ?�로?�트 ?�세 조회
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
      return responses.notFound('?�로?�트');
    }

    return responses.success(project[0]);
  } catch (error) {
    console.error('?�로?�트 조회 ?�패:', error);
    return responses.error('?�로?�트 ?�보�?불러?????�습?�다.');
  }
}

/**
 * ?�로?�트 ?�태 변�?
 */
export async function updateProjectStatus(
  projectId: string, 
  status: ProjectStatusType, 
  userId: string, 
  userRole: UserRoleType
) {
  try {
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return responses.notFound('?�로?�트');
    }

    // ?�유???�는 관리자�??�태 변�?가??
    if (project[0].ownerId !== userId && userRole !== 'ADMIN') {
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

    return responses.success(updatedProject[0], '?�로?�트 ?�태가 변경되?�습?�다.');
  } catch (error) {
    console.error('?�로?�트 ?�태 변�??�패:', error);
    return responses.error('?�로?�트 ?�태 변경에 ?�패?�습?�다.');
  }
}

/**
 * ?�로?�트 ?�계 조회
 */
export async function getProjectStats(projectId: string) {
  try {
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return responses.notFound('?�로?�트');
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
    console.error('?�로?�트 ?�계 조회 ?�패:', error);
    return responses.error('?�로?�트 ?�계�?불러?????�습?�다.');
  }
}
