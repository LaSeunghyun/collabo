import { revalidatePath } from 'next/cache';
import { eq, and, inArray, desc, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { withCache, CACHE_KEYS, CACHE_TTL, invalidateCache } from '@/lib/utils/cache';

export interface ProjectSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  _count: {
    fundings: number;
  };
  participants: number;
  remainingDays: number;
}
import { ZodError } from 'zod';

import type { SessionUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { projects, users, fundings, auditLogs } from '@/lib/db/schema';
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput
} from '@/lib/validators/projects';

const CAMPAIGN_DURATION_DAYS = 30;
const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980';

export class ProjectValidationError extends Error {
  issues: string[];

  constructor(error: ZodError) {
    super('프로젝트 입력 값이 올바르지 않습니다.');
    this.issues = error.issues.map((issue) => issue.message);
  }
}

export class ProjectNotFoundError extends Error {
  constructor() {
    super('프로젝트를 찾을 수 없습니다.');
  }
}

export class ProjectAccessDeniedError extends Error {
  constructor() {
    super('프로젝트에 접근할 권한이 없습니다.');
  }
}

export type ProjectSummaryOptions = {
  ownerId?: string;
  statuses?: string[];
  take?: number;
};

const fetchProjectsFromDb = async (options?: ProjectSummaryOptions) => {
  // Apply filters
  const conditions = [];

  if (options?.ownerId) {
    conditions.push(eq(projects.ownerId, options.ownerId));
  }

  if (options?.statuses?.length) {
    conditions.push(inArray(projects.status, options.statuses as any));
  }

  const limit = options?.take && options.take > 0 ? options.take : 10;

  const db = await getDb();
  const query = db
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      category: projects.category,
      thumbnail: projects.thumbnail,
      targetAmount: projects.targetAmount,
      currentAmount: projects.currentAmount,
      status: projects.status,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      ownerId: projects.ownerId,
      owner: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl
      }
    })
    .from(projects)
    .innerJoin(users, eq(projects.ownerId, users.id))
    .orderBy(desc(projects.createdAt))
    .limit(limit);

  const finalQuery = query.where(conditions.length > 0 ? and(...conditions) : undefined as any);

  const projectsData = await finalQuery;

  // Get funding counts for each project
  const projectIds = projectsData.map(p => p.id);
  const fundingCounts = projectIds.length > 0
    ? await db
      .select({
        projectId: fundings.projectId,
        count: count()
      })
      .from(fundings)
      .where(inArray(fundings.projectId, projectIds))
      .groupBy(fundings.projectId)
    : [];

  const fundingCountMap = new Map(
    fundingCounts.map(fc => [fc.projectId, fc.count])
  );

  return projectsData.map(project => ({
    ...project,
    _count: {
      fundings: fundingCountMap.get(project.id) || 0
    }
  }));
};

type ProjectWithCounts = Awaited<ReturnType<typeof fetchProjectsFromDb>>[number];

const toProjectSummary = (project: ProjectWithCounts): ProjectSummary => {
  const endDate = new Date(project.createdAt);
  endDate.setDate(endDate.getDate() + CAMPAIGN_DURATION_DAYS);
  const remainingMs = endDate.getTime() - Date.now();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    category: project.category,
    thumbnail: project.thumbnail ?? DEFAULT_THUMBNAIL,
    participants: project._count.fundings,
    remainingDays,
    targetAmount: project.targetAmount,
    currentAmount: project.currentAmount,
    status: project.status,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
    owner: {
      id: project.owner.id,
      name: project.owner.name,
      avatarUrl: project.owner.avatarUrl
    },
    _count: {
      fundings: project._count.fundings
    }
  };
};

const revalidateProjectPaths = (projectId?: string) => {
  revalidatePath('/');
  revalidatePath('/projects');

  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
};

export const getProjectSummaries = async (options?: ProjectSummaryOptions) => {
  const cacheKey = CACHE_KEYS.PROJECTS(
    options ? JSON.stringify(options) : 'default'
  );

  return withCache(
    cacheKey,
    async () => {
      const projects = await fetchProjectsFromDb(options);
      return projects.map(toProjectSummary);
    },
    CACHE_TTL.MEDIUM
  );
};

export const getProjectsPendingReview = async (limit = 5) =>
  getProjectSummaries({ statuses: ['REVIEWING'], take: limit });

export const getProjectSummaryById = async (id: string) => {
  const cacheKey = CACHE_KEYS.PROJECT(id);

  return withCache(
    cacheKey,
    async () => {
      const projectData = await db
        .select({
          id: projects.id,
          title: projects.title,
          description: projects.description,
          category: projects.category,
          thumbnail: projects.thumbnail,
          targetAmount: projects.targetAmount,
          currentAmount: projects.currentAmount,
          status: projects.status,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
          ownerId: projects.ownerId,
          owner: {
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl
          }
        })
        .from(projects)
        .innerJoin(users, eq(projects.ownerId, users.id))
        .where(eq(projects.id, id))
        .limit(1);

      if (projectData.length === 0) {
        return null;
      }

      const project = projectData[0];

      // Get funding count
      const fundingCountResult = await db
        .select({ count: count() })
        .from(fundings)
        .where(eq(fundings.projectId, id));

      const projectWithCount = {
        ...project,
        _count: {
          fundings: fundingCountResult[0]?.count || 0
        }
      };

      return toProjectSummary(projectWithCount);
    },
    CACHE_TTL.MEDIUM
  );
};

const toJsonInput = (
  value: unknown
): unknown => {
  if (value === undefined || value === null) {
    return null;
  }

  return value;
};

interface ProjectCreateData {
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  rewardTiers: unknown;
  milestones: unknown;
  thumbnail: string | null;
  status: 'DRAFT';
  ownerId: string;
  currentAmount: number;
}

const buildProjectCreateData = (
  input: CreateProjectInput,
  ownerId: string
): ProjectCreateData => ({
  title: input.title,
  description: input.description,
  category: input.category,
  targetAmount: input.targetAmount,
  currency: input.currency,
  startDate: input.startDate ?? null,
  endDate: input.endDate ?? null,
  rewardTiers: toJsonInput(input.rewardTiers),
  milestones: toJsonInput(input.milestones),
  thumbnail: input.thumbnail ? input.thumbnail : null,
  status: 'DRAFT',
  ownerId,
  currentAmount: 0
});

interface ProjectUpdateData {
  title?: string;
  description?: string;
  category?: string;
  targetAmount?: number;
  currency?: string;
  startDate?: string | null;
  endDate?: string | null;
  rewardTiers?: unknown;
  milestones?: unknown;
  thumbnail?: string | null;
  status?: string;
  updatedAt: string;
}

const buildProjectUpdateData = (
  input: UpdateProjectInput
): Partial<ProjectUpdateData> => {
  const data: Partial<ProjectUpdateData> = {};

  if (input.title !== undefined) {
    data.title = input.title;
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  if (input.category !== undefined) {
    data.category = input.category;
  }

  if (input.targetAmount !== undefined) {
    data.targetAmount = input.targetAmount;
  }

  if (input.currency !== undefined) {
    data.currency = input.currency;
  }

  if (input.startDate !== undefined) {
    data.startDate = input.startDate ?? null;
  }

  if (input.endDate !== undefined) {
    data.endDate = input.endDate ?? null;
  }

  if (input.rewardTiers !== undefined) {
    data.rewardTiers = toJsonInput(input.rewardTiers);
  }

  if (input.milestones !== undefined) {
    data.milestones = toJsonInput(input.milestones);
  }

  if (input.thumbnail !== undefined) {
    data.thumbnail = input.thumbnail ? input.thumbnail : null;
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  return data;
};

const parseCreateInput = (rawInput: unknown) => {
  try {
    return createProjectSchema.parse(rawInput);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ProjectValidationError(error);
    }

    throw error;
  }
};

const parseUpdateInput = (rawInput: unknown) => {
  try {
    return updateProjectSchema.parse(rawInput);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ProjectValidationError(error);
    }

    throw error;
  }
};

const assertProjectOwnership = (projectOwnerId: string, user: SessionUser) => {
  if (user.role === 'ADMIN') {
    return;
  }

  if (projectOwnerId !== user.id) {
    throw new ProjectAccessDeniedError();
  }
};

export const createProject = async (rawInput: unknown, user: SessionUser) => {
  const input = parseCreateInput(rawInput);
  const ownerId = user.role === 'ADMIN' && input.ownerId ? input.ownerId : user.id;

  const createData = buildProjectCreateData(input, ownerId);
  const projectId = randomUUID();

  const db = await getDb();
  await db.transaction(async (tx) => {
    // Create project
    await tx.insert(projects).values({
      id: projectId,
      ...createData
    });

    // Create audit log
    await tx.insert(auditLogs).values({
      id: randomUUID(),
      userId: user.id,
      entity: 'Project',
      entityId: projectId,
      action: 'PROJECT_CREATED',
      data: JSON.parse(JSON.stringify(createData)),
      createdAt: new Date().toISOString()
    });
  });

  revalidateProjectPaths(projectId);

  // 캐시 무효화
  invalidateCache('^projects:');
  invalidateCache(`^project:${projectId}$`);

  return getProjectSummaryById(projectId);
};

export const updateProject = async (id: string, rawInput: unknown, user: SessionUser) => {
  const input = parseUpdateInput(rawInput);

  const projectData = await db
    .select({ ownerId: projects.ownerId })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (projectData.length === 0) {
    throw new ProjectNotFoundError();
  }

  const project = projectData[0];
  assertProjectOwnership(project.ownerId, user);

  const data = buildProjectUpdateData(input);

  if (Object.keys(data).length === 0) {
    return getProjectSummaryById(id);
  }

  const db = await getDb();
  await db.transaction(async (tx) => {
    // Update project
    await tx.update(projects)
      .set({
        ...data,
        updatedAt: new Date().toISOString()
      })
      .where(eq(projects.id, id));

    // Create audit log
    await tx.insert(auditLogs).values({
      id: randomUUID(),
      userId: user.id,
      entity: 'Project',
      entityId: id,
      action: 'PROJECT_UPDATED',
      data: JSON.parse(JSON.stringify(data)),
      createdAt: new Date().toISOString()
    });
  });

  revalidateProjectPaths(id);

  // 캐시 무효화
  invalidateCache('^projects:');
  invalidateCache(`^project:${id}$`);

  return getProjectSummaryById(id);
};

export const deleteProject = async (id: string, user: SessionUser) => {
  const projectData = await db
    .select({ ownerId: projects.ownerId })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (projectData.length === 0) {
    throw new ProjectNotFoundError();
  }

  const project = projectData[0];
  assertProjectOwnership(project.ownerId, user);

  const db = await getDb();
  await db.transaction(async (tx) => {
    // Delete project
    await tx.delete(projects).where(eq(projects.id, id));

    // Create audit log
    await tx.insert(auditLogs).values({
      id: randomUUID(),
      userId: user.id,
      entity: 'Project',
      entityId: id,
      action: 'PROJECT_DELETED',
      data: null,
      createdAt: new Date().toISOString()
    });
  });

  revalidateProjectPaths(id);

  // 캐시 무효화
  invalidateCache('^projects:');
  invalidateCache(`^project:${id}$`);
};

