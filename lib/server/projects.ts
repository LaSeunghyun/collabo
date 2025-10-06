import { revalidatePath } from 'next/cache';
import { ProjectStatus, UserRole, ProjectSummary, type ProjectStatusType } from '@/types/drizzle';
import { ZodError } from 'zod';
import { eq, and, inArray, desc, sql } from 'drizzle-orm';

import type { SessionUser } from '@/lib/auth/session';
import { db } from '@/lib/prisma';
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
    super('?꾨줈?앺듃 ?낅젰 媛믪씠 ?щ컮瑜댁? ?딆뒿?덈떎.');
    this.issues = error.issues.map((issue) => issue.message);
  }
}

export class ProjectNotFoundError extends Error {
  constructor() {
    super('?꾨줈?앺듃瑜?李얠쓣 ???놁뒿?덈떎.');
  }
}

export class ProjectAccessDeniedError extends Error {
  constructor() {
    super('?꾨줈?앺듃?????沅뚰븳???놁뒿?덈떎.');
  }
}

export type ProjectSummaryOptions = {
  ownerId?: string;
  statuses?: ProjectStatusType[];
  take?: number;
};

const fetchProjectsFromDb = async (options?: ProjectSummaryOptions) => {
  let query = db
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
      },
      fundingCount: sql<number>`count(${fundings.id})`.as('fundingCount')
    })
    .from(projects)
    .leftJoin(users, eq(projects.ownerId, users.id))
    .leftJoin(fundings, eq(projects.id, fundings.projectId))
    .groupBy(projects.id, users.id)
    .orderBy(desc(projects.createdAt));

  if (options?.ownerId) {
    query = query.where(eq(projects.ownerId, options.ownerId));
  }

  if (options?.statuses?.length) {
    query = query.where(inArray(projects.status, options.statuses));
  }

  if (options?.take && options.take > 0) {
    query = query.limit(options.take);
  }

  return query;
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
    participants: project.fundingCount,
    remainingDays,
    targetAmount: project.targetAmount,
    currentAmount: project.currentAmount,
    status: project.status as ProjectStatusType,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    owner: {
      id: project.owner.id,
      name: project.owner.name,
      avatarUrl: project.owner.avatarUrl
    },
    _count: {
      fundings: project.fundingCount
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
  const projects = await fetchProjectsFromDb(options);
  return projects.map(toProjectSummary);
};

export const getProjectsPendingReview = async (limit = 5) =>
  getProjectSummaries({ statuses: [ProjectStatus.DRAFT], take: limit });

export const getProjectSummaryById = async (id: string) => {
  const result = await db
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
      },
      fundingCount: sql<number>`count(${fundings.id})`.as('fundingCount')
    })
    .from(projects)
    .leftJoin(users, eq(projects.ownerId, users.id))
    .leftJoin(fundings, eq(projects.id, fundings.projectId))
    .where(eq(projects.id, id))
    .groupBy(projects.id, users.id)
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return toProjectSummary(result[0]);
};

const toJsonInput = (value: unknown): any => {
  if (value === undefined || value === null) {
    return {};
  }

  return value;
};

const buildProjectCreateData = (
  input: CreateProjectInput,
  ownerId: string
) => ({
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
  status: ProjectStatus.DRAFT,
  ownerId,
  currentAmount: 0
});

const buildProjectUpdateData = (input: UpdateProjectInput) => {
  const data: any = {};

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
  if (user.role === UserRole.ADMIN) {
    return;
  }

  if (projectOwnerId !== user.id) {
    throw new ProjectAccessDeniedError();
  }
};

export const createProject = async (rawInput: unknown, user: SessionUser) => {
  const input = parseCreateInput(rawInput);
  const ownerId = user.role === UserRole.ADMIN && input.ownerId ? input.ownerId : user.id;

  const createData = buildProjectCreateData(input, ownerId);

  const project = await db.insert(projects).values(createData).returning();

  await db.insert(auditLogs).values({
    userId: user.id,
    entity: 'Project',
    entityId: project[0].id,
    action: 'PROJECT_CREATED',
    data: JSON.parse(JSON.stringify(createData))
  });

  revalidateProjectPaths(project[0].id);

  return getProjectSummaryById(project[0].id);
};

export const updateProject = async (id: string, rawInput: unknown, user: SessionUser) => {
  const input = parseUpdateInput(rawInput);

  const project = await db
    .select({ ownerId: projects.ownerId })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (project.length === 0) {
    throw new ProjectNotFoundError();
  }

  assertProjectOwnership(project[0].ownerId, user);

  const data = buildProjectUpdateData(input);

  if (Object.keys(data).length === 0) {
    return getProjectSummaryById(id);
  }

  await db.update(projects).set(data).where(eq(projects.id, id));

  await db.insert(auditLogs).values({
    userId: user.id,
    entity: 'Project',
    entityId: id,
    action: 'PROJECT_UPDATED',
    data: JSON.parse(JSON.stringify(data))
  });

  revalidateProjectPaths(id);

  return getProjectSummaryById(id);
};

export const deleteProject = async (id: string, user: SessionUser) => {
  const project = await db
    .select({ ownerId: projects.ownerId })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (project.length === 0) {
    throw new ProjectNotFoundError();
  }

  assertProjectOwnership(project[0].ownerId, user);

  await db.delete(projects).where(eq(projects.id, id));

  await db.insert(auditLogs).values({
    userId: user.id,
    entity: 'Project',
    entityId: id,
    action: 'PROJECT_DELETED'
  });

  revalidateProjectPaths(id);
};

