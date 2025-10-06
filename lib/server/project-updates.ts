import { db } from '@/lib/drizzle';
import { posts, users, postLikes, projects } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { SessionUser } from '@/lib/auth/session';

// Drizzle enum values
type MilestoneStatusType = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'RELEASED';

const UserRole = {
  CREATOR: 'CREATOR',
  PARTICIPANT: 'PARTICIPANT',
  PARTNER: 'PARTNER',
  ADMIN: 'ADMIN',
} as const;

const PostType = {
  UPDATE: 'UPDATE',
  DISCUSSION: 'DISCUSSION',
  AMA: 'AMA',
} as const;

type MilestoneStatusType = typeof MilestoneStatus[keyof typeof MilestoneStatus];
type UserRole = typeof UserRole[keyof typeof UserRole];
type PostType = typeof PostType[keyof typeof PostType];

export class ProjectUpdateNotFoundError extends Error {
  constructor(message = '?�로?�트 ?�데?�트�?찾을 ???�습?�다.') {
    super(message);
    this.name = 'ProjectUpdateNotFoundError';
  }
}

export class ProjectUpdateAccessDeniedError extends Error {
  constructor(message = '?�로?�트 ?�데?�트???�??권한???�습?�다.') {
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
    status: MilestoneStatusType;
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
): any => {
  if (!value || value.length === 0) {
    return [];
  }

  return value;
};

const normalizeAttachments = (value: any): ProjectUpdateAttachment[] => {
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
  projectId: string | null;
  title: string;
  content: string;
  attachments: any;
  milestoneId: string | null;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
  author: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  milestone: {
    id: string;
    title: string;
    status: string;
  } | null;
};

const getLikedPostIds = async (
  viewer: SessionUser | null | undefined,
  postIds: string[]
): Promise<Set<string> | undefined> => {
  if (!viewer || postIds.length === 0) {
    return undefined;
  }

  const likes = await db
    .select({ postId: postLikes.postId })
    .from(postLikes)
    .where(and(
      eq(postLikes.userId, viewer.id),
      sql`${postLikes.postId} = ANY(${postIds})`
    ));

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
  attachments: normalizeAttachments(post.attachments),
  milestone: post.milestone
    ? {
        id: post.milestone.id,
        title: post.milestone.title,
        status: post.milestone.status as MilestoneStatusType
      }
    : null,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  likes: post.likesCount,
  comments: post.commentsCount,
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
  // TODO: Implement milestone validation when milestone table is added
  // For now, just validate that milestoneId is not empty
  if (!milestoneId) {
    throw new ProjectUpdateValidationError('마일?�톤??찾을 ???�습?�다.');
  }
};

export const assertProjectOwner = async (
  projectId: string,
  user: SessionUser
): Promise<ProjectInfo> => {
  if (user.role !== UserRole.CREATOR && user.role !== UserRole.ADMIN) {
    throw new ProjectUpdateAccessDeniedError();
  }

  const [project] = await db
    .select({ id: projects.id, ownerId: projects.ownerId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    throw new ProjectUpdateNotFoundError('?�로?�트�?찾을 ???�습?�다.');
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
  const [project] = await db
    .select({ id: projects.id, ownerId: projects.ownerId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    throw new ProjectUpdateNotFoundError('?�로?�트�?찾을 ???�습?�다.');
  }

  const postsData = await db
    .select({
      id: posts.id,
      projectId: posts.projectId,
      title: posts.title,
      content: posts.content,
      attachments: posts.attachments,
      milestoneId: posts.milestoneId,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      author: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(and(
      eq(posts.projectId, projectId),
      eq(posts.type, PostType.UPDATE)
    ))
    .orderBy(desc(posts.createdAt));

  const likedPostIds = await getLikedPostIds(
    viewer,
    postsData.map((post) => post.id)
  );

  // Convert to PostWithRelations format
  const postsWithRelations: PostWithRelations[] = postsData.map(post => ({
    ...post,
    author: post.author || { id: '', name: null, avatarUrl: null },
    milestone: null, // TODO: Add milestone data when milestone table is implemented
  }));

  return postsWithRelations.map((post) => toProjectUpdateRecord(post, viewer, project, likedPostIds));
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

  const [post] = await db
    .insert(posts)
    .values({
      projectId,
      authorId: user.id,
      title: input.title,
      content: input.content,
      type: PostType.UPDATE,
      attachments: toJsonInput(input.attachments),
      milestoneId: input.milestoneId ?? null
    })
    .returning({
      id: posts.id,
      projectId: posts.projectId,
      title: posts.title,
      content: posts.content,
      attachments: posts.attachments,
      milestoneId: posts.milestoneId,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
    });

  // Get author info
  const [author] = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const postWithRelations: PostWithRelations = {
    ...post,
    author,
    milestone: null, // TODO: Add milestone data when milestone table is implemented
  };

  const likedPostIds = await getLikedPostIds(user, [post.id]);

  return toProjectUpdateRecord(postWithRelations, user, project, likedPostIds);
};

export const updateProjectUpdate = async (
  projectId: string,
  updateId: string,
  input: UpdateProjectUpdateInput,
  user: SessionUser
): Promise<ProjectUpdateRecord> => {
  const project = await assertProjectOwner(projectId, user);

  const [existing] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(
      eq(posts.id, updateId),
      eq(posts.projectId, projectId),
      eq(posts.type, PostType.UPDATE)
    ))
    .limit(1);

  if (!existing) {
    throw new ProjectUpdateNotFoundError();
  }

  if (input.milestoneId) {
    await ensureMilestoneBelongsToProject(projectId, input.milestoneId);
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (input.title !== undefined) {
    updateData.title = input.title;
  }

  if (input.content !== undefined) {
    updateData.content = input.content;
  }

  if (input.attachments !== undefined) {
    updateData.attachments = toJsonInput(input.attachments);
  }

  if (input.milestoneId !== undefined) {
    updateData.milestoneId = input.milestoneId;
  }

  const [post] = await db
    .update(posts)
    .set(updateData)
    .where(eq(posts.id, existing.id))
    .returning({
      id: posts.id,
      projectId: posts.projectId,
      title: posts.title,
      content: posts.content,
      attachments: posts.attachments,
      milestoneId: posts.milestoneId,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
    });

  // Get author info
  const [author] = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const postWithRelations: PostWithRelations = {
    ...post,
    author,
    milestone: null, // TODO: Add milestone data when milestone table is implemented
  };

  const likedPostIds = await getLikedPostIds(user, [post.id]);

  return toProjectUpdateRecord(postWithRelations, user, project, likedPostIds);
};

export const deleteProjectUpdate = async (
  projectId: string,
  updateId: string,
  user: SessionUser
): Promise<void> => {
  await assertProjectOwner(projectId, user);

  const [existing] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(
      eq(posts.id, updateId),
      eq(posts.projectId, projectId),
      eq(posts.type, PostType.UPDATE)
    ))
    .limit(1);

  if (!existing) {
    throw new ProjectUpdateNotFoundError();
  }

  await db.delete(posts).where(eq(posts.id, existing.id));
};
