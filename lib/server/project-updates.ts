import { MilestoneStatus, PostType, Prisma, UserRole } from '@prisma/client';


import type { SessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export class ProjectUpdateNotFoundError extends Error {
  constructor(message = '프로젝트 업데이트를 찾을 수 없습니다.') {
    super(message);
    this.name = 'ProjectUpdateNotFoundError';
  }
}

export class ProjectUpdateAccessDeniedError extends Error {
  constructor(message = '프로젝트 업데이트에 대한 권한이 없습니다.') {
    super(message);
    this.name = 'ProjectUpdateAccessDeniedError';
  }
}

export class ProjectUpdateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectUpdateValidationError';
  }
}

export type ProjectUpdateAttachment = {
  url: string;
  label?: string;
  type?: string;
};

export type ProjectUpdateRecord = {
  id: string;
  projectId: string;
  title: string;
  content: string;
  attachments: ProjectUpdateAttachment[];
  milestone: {
    id: string;
    title: string;
    status: MilestoneStatus;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  comments: number;
  liked: boolean;
  author: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  canEdit: boolean;
};

export interface CreateProjectUpdateInput {
  title: string;
  content: string;
  attachments?: ProjectUpdateAttachment[];
  milestoneId?: string | null;
}

export interface UpdateProjectUpdateInput {
  title?: string;
  content?: string;
  attachments?: ProjectUpdateAttachment[];
  milestoneId?: string | null;
}

type ProjectInfo = {
  id: string;
  ownerId: string;
};

const toJsonInput = (
  value: ProjectUpdateAttachment[] | undefined
): Prisma.InputJsonValue | Prisma.JsonNullValueInput => {
  if (!value || value.length === 0) {
    return Prisma.JsonNull;
  }

  return value as unknown as Prisma.InputJsonValue;
};

const normalizeAttachments = (value: Prisma.JsonValue | null): ProjectUpdateAttachment[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          const record = item as Record<string, unknown>;
          const url = typeof record.url === 'string' ? record.url : null;
          if (!url) {
            return null;
          }

          return {
            url,
            label: typeof record.label === 'string' ? record.label : undefined,
            type: typeof record.type === 'string' ? record.type : undefined
          } satisfies ProjectUpdateAttachment;
        }

        if (typeof item === 'string') {
          return { url: item } satisfies ProjectUpdateAttachment;
        }

        return null;
      })
      .filter((item): item is ProjectUpdateAttachment => item !== null);
  }

  if (typeof value === 'string') {
    return [{ url: value }];
  }

  return [];
};

const buildPostInclude = () => ({
  author: { select: { id: true, name: true, avatarUrl: true } },
  milestone: { select: { id: true, title: true, status: true } },
  _count: { select: { likes: true, comments: true } }
});

type PostWithRelations = Prisma.PostGetPayload<{
  include: ReturnType<typeof buildPostInclude>;
}>;

const getLikedPostIds = async (
  viewer: SessionUser | null | undefined,
  postIds: string[]
): Promise<Set<string> | undefined> => {
  if (!viewer || postIds.length === 0) {
    return undefined;
  }

  const likes = await prisma.postLike.findMany({
    where: { userId: viewer.id, postId: { in: postIds } },
    select: { postId: true }
  });

  return new Set(likes.map((like) => like.postId));
};

const toProjectUpdateRecord = (
  post: PostWithRelations,
  viewer: SessionUser | null | undefined,
  project: ProjectInfo,
  likedPostIds?: Set<string>
): ProjectUpdateRecord => ({
  id: post.id,
  projectId: post.projectId ?? project.id,
  title: post.title,
  content: post.content,
  attachments: normalizeAttachments(post.attachments ?? null),
  milestone: post.milestone
    ? {
        id: post.milestone.id,
        title: post.milestone.title,
        status: post.milestone.status
      }
    : null,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  likes: post._count.likes,
  comments: post._count.comments,
  liked: Boolean(viewer && likedPostIds?.has(post.id)),
  author: {
    id: post.author.id,
    name: post.author.name,
    avatarUrl: post.author.avatarUrl
  },
  canEdit: Boolean(
    viewer && (viewer.role === UserRole.ADMIN || viewer.id === project.ownerId)
  )
});

const ensureMilestoneBelongsToProject = async (projectId: string, milestoneId: string) => {
  const exists = await prisma.projectMilestone.findFirst({
    where: { id: milestoneId, projectId },
    select: { id: true }
  });

  if (!exists) {
    throw new ProjectUpdateValidationError('마일스톤을 찾을 수 없습니다.');
  }
};

export const assertProjectOwner = async (
  projectId: string,
  user: SessionUser
): Promise<ProjectInfo> => {
  if (user.role !== UserRole.CREATOR && user.role !== UserRole.ADMIN) {
    throw new ProjectUpdateAccessDeniedError();
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true }
  });

  if (!project) {
    throw new ProjectUpdateNotFoundError('프로젝트를 찾을 수 없습니다.');
  }

  if (user.role !== UserRole.ADMIN && project.ownerId !== user.id) {
    throw new ProjectUpdateAccessDeniedError();
  }

  return project;
};


export const listProjectUpdates = async (
  projectId: string,
  viewer?: SessionUser | null
): Promise<ProjectUpdateRecord[]> => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true }
  });

  if (!project) {
    throw new ProjectUpdateNotFoundError('프로젝트를 찾을 수 없습니다.');
  }

  const posts = await prisma.post.findMany({
    where: {
      projectId,
      type: PostType.UPDATE,
    },
    orderBy: { createdAt: 'desc' },
    include: buildPostInclude()
  });

  const likedPostIds = await getLikedPostIds(
    viewer,
    posts.map((post) => post.id)
  );

  return posts.map((post) => toProjectUpdateRecord(post, viewer, project, likedPostIds));
};

export const createProjectUpdate = async (
  projectId: string,
  input: CreateProjectUpdateInput,
  user: SessionUser
): Promise<ProjectUpdateRecord> => {
  const project = await assertProjectOwner(projectId, user);

  if (input.milestoneId) {
    await ensureMilestoneBelongsToProject(projectId, input.milestoneId);
  }

  const post = await prisma.post.create({
    data: {
      projectId,
      authorId: user.id,
      title: input.title,
      content: input.content,
      type: PostType.UPDATE,
      attachments: toJsonInput(input.attachments),
      milestoneId: input.milestoneId ?? null
    },
    include: buildPostInclude()
  });

  const likedPostIds = await getLikedPostIds(user, [post.id]);

  return toProjectUpdateRecord(post, user, project, likedPostIds);
};

export const updateProjectUpdate = async (
  projectId: string,
  updateId: string,
  input: UpdateProjectUpdateInput,
  user: SessionUser
): Promise<ProjectUpdateRecord> => {
  const project = await assertProjectOwner(projectId, user);

  const existing = await prisma.post.findFirst({
    where: { id: updateId, projectId, type: PostType.UPDATE },
    select: { id: true }
  });

  if (!existing) {
    throw new ProjectUpdateNotFoundError();
  }

  if (input.milestoneId) {
    await ensureMilestoneBelongsToProject(projectId, input.milestoneId);
  }

  const data: Prisma.PostUpdateInput = {};

  if (input.title !== undefined) {
    data.title = input.title;
  }

  if (input.content !== undefined) {
    data.content = input.content;
  }


  if (input.attachments !== undefined) {
    data.attachments = toJsonInput(input.attachments);
  }

  if (input.milestoneId !== undefined) {
    data.milestone = input.milestoneId
      ? {
          connect: { id: input.milestoneId }
        }
      : {
          disconnect: true
        };
  }

  const post = await prisma.post.update({
    where: { id: existing.id },
    data,
    include: buildPostInclude()
  });

  const likedPostIds = await getLikedPostIds(user, [post.id]);

  return toProjectUpdateRecord(post, user, project, likedPostIds);
};

export const deleteProjectUpdate = async (
  projectId: string,
  updateId: string,
  user: SessionUser
): Promise<void> => {
  await assertProjectOwner(projectId, user);

  const existing = await prisma.post.findFirst({
    where: { id: updateId, projectId, type: PostType.UPDATE },
    select: { id: true }
  });

  if (!existing) {
    throw new ProjectUpdateNotFoundError();
  }

  await prisma.post.delete({ where: { id: existing.id } });
};
