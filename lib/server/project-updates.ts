import { eq, and, desc, inArray } from 'drizzle-orm';

import type { SessionUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { posts, users, postLikes, projects } from '@/lib/db/schema';

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
  type: 'image' | 'video' | 'document';
};

export type ProjectUpdateRecord = {
  id: string;
  title: string;
  content: string;
  projectId: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  attachments: ProjectUpdateAttachment[];
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  project: {
    id: string;
    title: string;
    status: string;
  } | null;
  likesCount: number;
  isLiked: boolean;
};

export type CreateProjectUpdateInput = {
  title: string;
  content: string;
  visibility?: 'PUBLIC' | 'SUPPORTERS_ONLY';
  attachments?: ProjectUpdateAttachment[];
  milestoneId?: string;
};

export type UpdateProjectUpdateInput = {
  title?: string;
  content?: string;
  visibility?: 'PUBLIC' | 'SUPPORTERS_ONLY';
  attachments?: ProjectUpdateAttachment[];
  milestoneId?: string;
};

export type ProjectUpdateListOptions = {
  filters?: {
    projectId?: string;
    authorId?: string;
    visibility?: 'PUBLIC' | 'SUPPORTERS_ONLY';
    milestoneId?: string;
  };
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'likesCount';
  orderDirection?: 'asc' | 'desc';
};

export type ProjectUpdateListResult = {
  updates: ProjectUpdateRecord[];
  totalCount: number;
  hasMore: boolean;
};

const validateProjectUpdateInput = (input: CreateProjectUpdateInput | UpdateProjectUpdateInput): void => {
  if (input && typeof input === 'object') {
    if ('title' in input && input.title) {
      if (input.title.length < 1) {
        throw new ProjectUpdateValidationError('제목은 1자 이상이어야 합니다.');
      }
      if (input.title.length > 200) {
        throw new ProjectUpdateValidationError('제목은 200자를 초과할 수 없습니다.');
      }
    }

    if ('content' in input && input.content) {
      if (input.content.length < 1) {
        throw new ProjectUpdateValidationError('내용은 1자 이상이어야 합니다.');
      }
      if (input.content.length > 10000) {
        throw new ProjectUpdateValidationError('내용은 10000자를 초과할 수 없습니다.');
      }
    }

    if ('attachments' in input && input.attachments) {
      if (input.attachments.length > 10) {
        throw new ProjectUpdateValidationError('첨부파일은 10개를 초과할 수 없습니다.');
      }
    }
  }
};

const checkProjectUpdateAccess = async (
  projectId: string,
  userId: string,
  userRole: string
): Promise<void> => {
  const db = await getDb();
  
  const project = await db
    .select({ id: projects.id, ownerId: projects.ownerId, status: projects.status })
    .from(projects)
    .where(eq(projects.id, projectId))
      .limit(1);

  if (!project[0]) {
    throw new ProjectUpdateNotFoundError('프로젝트를 찾을 수 없습니다.');
  }

  // 프로젝트 소유자이거나 관리자인 경우만 접근 가능
  if (project[0].ownerId !== userId && userRole !== 'ADMIN') {
    throw new ProjectUpdateAccessDeniedError('프로젝트 업데이트에 대한 권한이 없습니다.');
  }
};

export const assertProjectOwner = async (
  projectId: string,
  user: SessionUser
): Promise<{ id: string; ownerId: string; status: string }> => {
  const db = await getDb();
  
  const projectData = await db
    .select({ id: projects.id, ownerId: projects.ownerId, status: projects.status })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!projectData[0]) {
    throw new ProjectUpdateNotFoundError('프로젝트를 찾을 수 없습니다.');
  }

  const project = projectData[0];
  
  // 프로젝트 소유자이거나 관리자인 경우만 접근 가능
  if (project.ownerId !== user.id && user.role !== 'ADMIN') {
    throw new ProjectUpdateAccessDeniedError('프로젝트 업데이트에 대한 권한이 없습니다.');
  }

  return project;
};

export const createProjectUpdate = async (
  projectId: string,
  input: CreateProjectUpdateInput,
  user: SessionUser
): Promise<ProjectUpdateRecord> => {
  validateProjectUpdateInput(input);
  
  await checkProjectUpdateAccess(projectId, user.id, user.role);

  const db = await getDb();
  
  const [newUpdate] = await db
    .insert(posts)
    .values({
      id: crypto.randomUUID(),
      projectId,
      authorId: user.id,
      title: input.title,
      content: input.content,
      visibility: input.visibility || 'PUBLIC',
      attachments: input.attachments || [],
      milestoneId: input.milestoneId,
      type: 'UPDATE',
      category: 'GENERAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .returning();

  return {
    id: newUpdate.id,
    title: newUpdate.title,
    content: newUpdate.content,
    projectId: newUpdate.projectId,
    authorId: newUpdate.authorId,
    createdAt: new Date(newUpdate.createdAt),
    updatedAt: new Date(newUpdate.updatedAt),
    isPinned: newUpdate.isPinned,
    attachments: (newUpdate.attachments as ProjectUpdateAttachment[]) || [],
    author: {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
    project: null, // Will be populated if needed
    likesCount: 0,
    isLiked: false,
  };
};

export const listProjectUpdates = async (
  projectId: string,
  viewer?: SessionUser,
  options: ProjectUpdateListOptions = {}
): Promise<ProjectUpdateListResult> => {
  const db = await getDb();
  const {
    filters = {},
    limit = 20,
    offset = 0,
    orderBy = 'createdAt',
    orderDirection = 'desc'
  } = options;

  // Check if project exists
  const projectData = await db
    .select({ id: projects.id, ownerId: projects.ownerId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!projectData[0]) {
    throw new ProjectUpdateNotFoundError('프로젝트를 찾을 수 없습니다.');
  }

  const project = projectData[0];
  
  // Check access permissions
  const canViewAll = viewer && (
    viewer.id === project.ownerId || 
    viewer.role === 'ADMIN'
  );

  // Build where conditions
  const whereConditions = [eq(posts.projectId, projectId)];
  
  if (!canViewAll) {
    whereConditions.push(eq(posts.visibility, 'PUBLIC'));
  }

  if (filters.authorId) {
    whereConditions.push(eq(posts.authorId, filters.authorId));
  }

  if (filters.visibility) {
    whereConditions.push(eq(posts.visibility, filters.visibility));
  }

  if (filters.milestoneId) {
    whereConditions.push(eq(posts.milestoneId, filters.milestoneId));
  }

  // Get updates
  const updates = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      projectId: posts.projectId,
      authorId: posts.authorId,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      isPinned: posts.isPinned,
      attachments: posts.attachments,
      visibility: posts.visibility,
      author: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      }
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(...whereConditions))
    .orderBy(
      orderDirection === 'desc' ? desc(posts[orderBy]) : posts[orderBy]
    )
    .limit(limit)
    .offset(offset);

  // Get total count
  const [{ count: totalCount }] = await db
    .select({ count: posts.id })
    .from(posts)
    .where(and(...whereConditions));

  // Get likes count for each update
  const updateIds = updates.map(u => u.id);
  const likesData = updateIds.length > 0 ? await db
    .select({
      postId: postLikes.postId,
      count: postLikes.id
    })
    .from(postLikes)
    .where(inArray(postLikes.postId, updateIds))
    .groupBy(postLikes.postId) : [];

  const likesMap = new Map<string, number>();
  likesData.forEach(like => {
    likesMap.set(like.postId, like.count);
  });

  // Get user likes
  const userLikes = viewer && updateIds.length > 0 ? await db
    .select({ postId: postLikes.postId })
    .from(postLikes)
    .where(
      and(
        inArray(postLikes.postId, updateIds),
        eq(postLikes.userId, viewer.id)
      )
    ) : [];

  const userLikesSet = new Set(userLikes.map(like => like.postId));

  const result: ProjectUpdateRecord[] = updates.map(update => ({
    id: update.id,
    title: update.title,
    content: update.content,
    projectId: update.projectId,
    authorId: update.authorId,
    createdAt: new Date(update.createdAt),
    updatedAt: new Date(update.updatedAt),
    isPinned: update.isPinned,
    attachments: (update.attachments as ProjectUpdateAttachment[]) || [],
    author: update.author,
    project: null, // Will be populated if needed
    likesCount: likesMap.get(update.id) || 0,
    isLiked: userLikesSet.has(update.id),
  }));

  return {
    updates: result,
    totalCount: Number(totalCount),
    hasMore: offset + limit < Number(totalCount),
  };
};

export const updateProjectUpdate = async (
  projectId: string,
  updateId: string,
  input: UpdateProjectUpdateInput,
  user: SessionUser
): Promise<ProjectUpdateRecord> => {
  validateProjectUpdateInput(input);
  
  await checkProjectUpdateAccess(projectId, user.id, user.role);

  const db = await getDb();
  
  // Check if update exists and belongs to project
  const existingUpdate = await db
    .select({ id: posts.id, authorId: posts.authorId })
    .from(posts)
    .where(
      and(
        eq(posts.id, updateId),
        eq(posts.projectId, projectId)
      )
    )
    .limit(1);

  if (!existingUpdate[0]) {
    throw new ProjectUpdateNotFoundError('프로젝트 업데이트를 찾을 수 없습니다.');
  }

  // Check if user is the author or admin
  if (existingUpdate[0].authorId !== user.id && user.role !== 'ADMIN') {
    throw new ProjectUpdateAccessDeniedError('프로젝트 업데이트를 수정할 권한이 없습니다.');
  }

  // Update the post
  const [updatedUpdate] = await db
    .update(posts)
    .set({
      title: input.title,
      content: input.content,
      visibility: input.visibility,
      attachments: input.attachments,
      milestoneId: input.milestoneId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(posts.id, updateId))
    .returning();

  return {
    id: updatedUpdate.id,
    title: updatedUpdate.title,
    content: updatedUpdate.content,
    projectId: updatedUpdate.projectId,
    authorId: updatedUpdate.authorId,
    createdAt: new Date(updatedUpdate.createdAt),
    updatedAt: new Date(updatedUpdate.updatedAt),
    isPinned: updatedUpdate.isPinned,
    attachments: (updatedUpdate.attachments as ProjectUpdateAttachment[]) || [],
    author: {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
    project: null, // Will be populated if needed
    likesCount: 0,
    isLiked: false,
  };
};

export const deleteProjectUpdate = async (
  projectId: string,
  updateId: string,
  user: SessionUser
): Promise<void> => {
  await checkProjectUpdateAccess(projectId, user.id, user.role);

  const db = await getDb();

  // Check if update exists and belongs to project
  const existingUpdate = await db
    .select({ id: posts.id, authorId: posts.authorId })
    .from(posts)
    .where(
      and(
        eq(posts.id, updateId),
        eq(posts.projectId, projectId)
      )
    )
    .limit(1);

  if (!existingUpdate[0]) {
    throw new ProjectUpdateNotFoundError('프로젝트 업데이트를 찾을 수 없습니다.');
  }

  // Check if user is the author or admin
  if (existingUpdate[0].authorId !== user.id && user.role !== 'ADMIN') {
    throw new ProjectUpdateAccessDeniedError('프로젝트 업데이트를 삭제할 권한이 없습니다.');
  }

  // Delete the post
  await db
    .delete(posts)
    .where(eq(posts.id, updateId));
};