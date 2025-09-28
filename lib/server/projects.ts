import { revalidatePath } from 'next/cache';
import { Prisma, ProjectStatus, UserRole, ProjectSummary } from '@/types/prisma';
import { ZodError } from 'zod';

import type { SessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
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
    super('프로젝트에 대한 권한이 없습니다.');
  }
}

export type ProjectSummaryOptions = {
  ownerId?: string;
  statuses?: ProjectStatus[];
  take?: number;
};

const fetchProjectsFromDb = async (options?: ProjectSummaryOptions) => {
  const where: Prisma.ProjectWhereInput = {};

  if (options?.ownerId) {
    where.ownerId = options.ownerId;
  }

  if (options?.statuses?.length) {
    where.status = { in: options.statuses };
  }

  const take = options?.take && options.take > 0 ? options.take : undefined;

  return prisma.project.findMany({
    where,
    include: {
      _count: { select: { fundings: true } },
      owner: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    ...(take ? { take } : {})
  });
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
    status: project.status as ProjectStatus,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
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
  const projects = await fetchProjectsFromDb(options);
  return projects.map(toProjectSummary);
};

export const getProjectsPendingReview = async (limit = 5) =>
  getProjectSummaries({ statuses: [ProjectStatus.REVIEWING], take: limit });

export const getProjectSummaryById = async (id: string) => {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: { select: { fundings: true } },
      owner: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      }
    }
  });

  if (!project) {
    return null;
  }

  return toProjectSummary(project);
};

const toJsonInput = (
  value: unknown
): Prisma.InputJsonValue | Prisma.JsonNullValueInput => {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
};

const buildProjectCreateData = (
  input: CreateProjectInput,
  ownerId: string
): Prisma.ProjectUncheckedCreateInput => ({
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

const buildProjectUpdateData = (
  input: UpdateProjectInput
): Prisma.ProjectUncheckedUpdateInput => {
  const data: Prisma.ProjectUncheckedUpdateInput = {};

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

  const project = await prisma.project.create({
    data: createData
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      entity: 'Project',
      entityId: project.id,
      action: 'PROJECT_CREATED',
      data: JSON.parse(JSON.stringify(createData)) as Prisma.InputJsonValue
    }
  });

  revalidateProjectPaths(project.id);

  return getProjectSummaryById(project.id);
};

export const updateProject = async (id: string, rawInput: unknown, user: SessionUser) => {
  const input = parseUpdateInput(rawInput);

  const project = await prisma.project.findUnique({
    where: { id },
    select: { ownerId: true }
  });

  if (!project) {
    throw new ProjectNotFoundError();
  }

  assertProjectOwnership(project.ownerId, user);

  const data = buildProjectUpdateData(input);

  if (Object.keys(data).length === 0) {
    return getProjectSummaryById(id);
  }

  await prisma.project.update({
    where: { id },
    data
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      entity: 'Project',
      entityId: id,
      action: 'PROJECT_UPDATED',
      data: JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue
    }
  });

  revalidateProjectPaths(id);

  return getProjectSummaryById(id);
};

export const deleteProject = async (id: string, user: SessionUser) => {
  const project = await prisma.project.findUnique({
    where: { id },
    select: { ownerId: true }
  });

  if (!project) {
    throw new ProjectNotFoundError();
  }

  assertProjectOwnership(project.ownerId, user);

  await prisma.project.delete({
    where: { id }
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      entity: 'Project',
      entityId: id,
      action: 'PROJECT_DELETED'
    }
  });

  revalidateProjectPaths(id);
};
