import { eq, and, desc, inArray } from 'drizzle-orm';

import type { SessionUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { posts, users, projectMilestones, postLikes, projects } from '@/lib/db/schema';

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
    status: string;
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
  } | null;
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
): ProjectUpdateAttachment[] | null => {
  if (!value || value.length === 0) {
    return null;
  }

  return value;
};

const normalizeAttachments = (value: unknown | null): ProjectUpdateAttachment[] => {
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


type PostWithRelations = {
  id: string;
  title: string;
  content: string;
  type: string;
  projectId: string | null;
  authorId: string;
  milestoneId: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: any;
  author: { id: string; name: string | null; avatarUrl: string | null } | null;
  milestone: { id: string; title: string; status: string } | null;
  _count: { likes: number; comments: number };
};

const getLikedPostIds = async (
  viewer: SessionUser | null | undefined,
  postIds: string[]
): Promise<Set<string> | undefined> => {
  if (!viewer || postIds.length === 0) {
    return undefined;
  }

  try {
    const db = await getDb();
    const likes = await db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(and(
        eq(postLikes.userId, viewer.id),
        inArray(postLikes.postId, postIds)
      ));

    return new Set(likes.map((like) => like.postId));
  } catch (error) {
    console.error('Failed to get liked post IDs:', error);
    return undefined;
  }
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
  createdAt: new Date(post.createdAt),
  updatedAt: new Date(post.updatedAt),
  likes: post._count.likes,
  comments: post._count.comments,
  liked: Boolean(viewer && likedPostIds?.has(post.id)),
  author: post.author ? {
    id: post.author.id,
    name: post.author.name,
    avatarUrl: post.author.avatarUrl
  } : null,
  canEdit: Boolean(
    viewer && (viewer.role === 'ADMIN' || viewer.id === project.ownerId)
  )
});

const ensureMilestoneBelongsToProject = async (projectId: string, milestoneId: string) => {
  try {
    const db = await getDb();
    const [exists] = await db
      .select({ id: projectMilestones.id })
      .from(projectMilestones)
      .where(and(
        eq(projectMilestones.id, milestoneId),
        eq(projectMilestones.projectId, projectId)
      ))
      .limit(1);

    if (!exists) {
      throw new ProjectUpdateValidationError('마일스톤을 찾을 수 없습니다.');
    }
  } catch (error) {
    if (error instanceof ProjectUpdateValidationError) {
      throw error;
    }
    console.error('Failed to check milestone:', error);
    throw new ProjectUpdateValidationError('마일스톤을 찾을 수 없습니다.');
  }
};

export const assertProjectOwner = async (
  projectId: string,
  user: SessionUser
): Promise<ProjectInfo> => {
  if (user.role !== 'CREATOR' && user.role !== 'ADMIN') {
    throw new ProjectUpdateAccessDeniedError();
  }

  try {
    const db = await getDb();
    const [project] = await db
      .select({
        id: projects.id,
        ownerId: projects.ownerId
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new ProjectUpdateNotFoundError('프로젝트를 찾을 수 없습니다.');
    }

    if (user.role !== 'ADMIN' && project.ownerId !== user.id) {
      throw new ProjectUpdateAccessDeniedError();
    }

    return project;
  } catch (error) {
    if (error instanceof ProjectUpdateNotFoundError || error instanceof ProjectUpdateAccessDeniedError) {
      throw error;
    }
    console.error('Failed to assert project owner:', error);
    throw new ProjectUpdateNotFoundError('프로젝트를 찾을 수 없습니다.');
  }
};


export const listProjectUpdates = async (
  projectId: string,
  viewer?: SessionUser | null
): Promise<ProjectUpdateRecord[]> => {
  try {
    const db = await getDb();
    const [project] = await db
      .select({
        id: projects.id,
        ownerId: projects.ownerId
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new ProjectUpdateNotFoundError('프로젝트를 찾을 수 없습니다.');
    }

    const postsData = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        type: posts.type,
        projectId: posts.projectId,
        authorId: posts.authorId,
        milestoneId: posts.milestoneId,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        attachments: posts.attachments,
        author: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl
        },
        milestone: {
          id: projectMilestones.id,
          title: projectMilestones.title,
          status: projectMilestones.status
        }
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(projectMilestones, eq(posts.milestoneId, projectMilestones.id))
      .where(and(
        eq(posts.projectId, projectId),
        eq(posts.type, 'UPDATE' as any)
      ))
      .orderBy(desc(posts.createdAt));

    // 간단한 likes와 comments 카운트 (실제로는 별도 쿼리 필요)
    const postsWithCounts = postsData.map(post => ({
      ...post,
      _count: { likes: 0, comments: 0 } // 임시로 0 설정
    }));

    const likedPostIds = await getLikedPostIds(
      viewer,
      postsWithCounts.map((post) => post.id)
    );

    return postsWithCounts.map((post) => toProjectUpdateRecord(post, viewer, project, likedPostIds));
  } catch (error) {
    if (error instanceof ProjectUpdateNotFoundError) {
      throw error;
    }
    console.error('Failed to list project updates:', error);
    throw new ProjectUpdateNotFoundError('프로젝트를 찾을 수 없습니다.');
  }
};

export const createProjectUpdate = async (
  projectId: string,
  input: CreateProjectUpdateInput,
  user: SessionUser
): Promise<ProjectUpdateRecord> => {
  try {
    const project = await assertProjectOwner(projectId, user);

    if (input.milestoneId) {
      await ensureMilestoneBelongsToProject(projectId, input.milestoneId);
    }

    const db = await getDb();
    const [post] = await db
      .insert(posts)
      .values({
        id: crypto.randomUUID(),
        projectId,
        authorId: user.id,
        title: input.title,
        content: input.content,
        type: 'UPDATE',
        attachments: toJsonInput(input.attachments),
        milestoneId: input.milestoneId ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    // 간단한 post 데이터 구성
    const postWithRelations = {
      ...post,
      author: { id: user.id, name: user.name || '', avatarUrl: null },
      milestone: null, // 필요시 별도 조회
      _count: { likes: 0, comments: 0 }
    };

    const likedPostIds = await getLikedPostIds(user, [post.id]);

    return toProjectUpdateRecord(postWithRelations, user, project, likedPostIds);
  } catch (error) {
    if (error instanceof ProjectUpdateNotFoundError || error instanceof ProjectUpdateAccessDeniedError || error instanceof ProjectUpdateValidationError) {
      throw error;
    }
    console.error('Failed to create project update:', error);
    throw new ProjectUpdateValidationError('프로젝트 업데이트 생성에 실패했습니다.');
  }
};

export const updateProjectUpdate = async (
  projectId: string,
  updateId: string,
  input: UpdateProjectUpdateInput,
  user: SessionUser
): Promise<ProjectUpdateRecord> => {
  try {
    const project = await assertProjectOwner(projectId, user);

    const db = await getDb();
    const [existing] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(
        eq(posts.id, updateId),
        eq(posts.projectId, projectId),
        eq(posts.type, 'UPDATE' as any)
      ))
      .limit(1);

    if (!existing) {
      throw new ProjectUpdateNotFoundError();
    }

    if (input.milestoneId) {
      await ensureMilestoneBelongsToProject(projectId, input.milestoneId);
    }

    const data: any = {
      updatedAt: new Date().toISOString()
    };

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
      data.milestoneId = input.milestoneId;
    }

    const [updatedPost] = await db
      .update(posts)
      .set(data)
      .where(eq(posts.id, existing.id))
      .returning();

    // 간단한 post 데이터 구성
    const postWithRelations = {
      ...updatedPost,
      author: { id: user.id, name: user.name || '', avatarUrl: null },
      milestone: null, // 필요시 별도 조회
      _count: { likes: 0, comments: 0 }
    };

    const likedPostIds = await getLikedPostIds(user, [updatedPost.id]);

    return toProjectUpdateRecord(postWithRelations, user, project, likedPostIds);
  } catch (error) {
    if (error instanceof ProjectUpdateNotFoundError || error instanceof ProjectUpdateAccessDeniedError || error instanceof ProjectUpdateValidationError) {
      throw error;
    }
    console.error('Failed to update project update:', error);
    throw new ProjectUpdateValidationError('프로젝트 업데이트 수정에 실패했습니다.');
  }
};

export const deleteProjectUpdate = async (
  projectId: string,
  updateId: string,
  user: SessionUser
): Promise<void> => {
  try {
    await assertProjectOwner(projectId, user);

    const db = await getDb();
    const [existing] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(
        eq(posts.id, updateId),
        eq(posts.projectId, projectId),
        eq(posts.type, 'UPDATE' as any)
      ))
      .limit(1);

    if (!existing) {
      throw new ProjectUpdateNotFoundError();
    }

    await db
      .delete(posts)
      .where(eq(posts.id, existing.id));
  } catch (error) {
    if (error instanceof ProjectUpdateNotFoundError || error instanceof ProjectUpdateAccessDeniedError) {
      throw error;
    }
    console.error('Failed to delete project update:', error);
    throw new ProjectUpdateValidationError('프로젝트 업데이트 삭제에 실패했습니다.');
  }
};
