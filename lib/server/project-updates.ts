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
    ownerId: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
  isLiked: boolean;
};

export type CreateProjectUpdateInput = {
  title: string;
  content: string;
  attachments?: ProjectUpdateAttachment[];
  milestoneId?: string;
};

export type UpdateProjectUpdateInput = {
  title?: string;
  content?: string;
  attachments?: ProjectUpdateAttachment[];
  milestoneId?: string;
};

export type ProjectUpdateFilters = {
  projectId?: string;
  authorId?: string;
  milestoneId?: string;
  isPinned?: boolean;
  search?: string;
};

export type ProjectUpdateListOptions = {
  filters?: ProjectUpdateFilters;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'likes' | 'comments';
  sortOrder?: 'asc' | 'desc';
};

export type ProjectUpdateListResult = {
  updates: ProjectUpdateRecord[];
  total: number;
  hasMore: boolean;
};

const validateProjectUpdateInput = (input: CreateProjectUpdateInput | UpdateProjectUpdateInput): void => {
  if ('title' in input && input.title) {
    if (input.title.length < 1) {
      throw new ProjectUpdateValidationError('제목은 1자 이상이어야 합니다.');
    }
    if (input.title.length > 200) {
      throw new ProjectUpdateValidationError('제목은 200자 이하여야 합니다.');
    }
  }

  if ('content' in input && input.content) {
    if (input.content.length < 1) {
      throw new ProjectUpdateValidationError('내용은 1자 이상이어야 합니다.');
    }
    if (input.content.length > 10000) {
      throw new ProjectUpdateValidationError('내용은 10,000자 이하여야 합니다.');
    }
  }

  if (input.attachments) {
    if (input.attachments.length > 10) {
      throw new ProjectUpdateValidationError('첨부파일은 최대 10개까지 업로드할 수 있습니다.');
    }

    for (const attachment of input.attachments) {
      if (!attachment.url) {
        throw new ProjectUpdateValidationError('첨부파일 URL이 필요합니다.');
      }
      if (!['image', 'video', 'document'].includes(attachment.type)) {
        throw new ProjectUpdateValidationError('지원하지 않는 첨부파일 유형입니다.');
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

  // 프로젝트 소유자이거나 관리자인 경우에만 접근 가능
  if (project[0].ownerId !== userId && userRole !== 'ADMIN') {
    throw new ProjectUpdateAccessDeniedError('프로젝트 업데이트에 대한 권한이 없습니다.');
  }
};

export const createProjectUpdate = async (
  projectId: string,
  input: CreateProjectUpdateInput,
  user: SessionUser
): Promise<ProjectUpdateRecord> => {
  validateProjectUpdateInput(input);
  await checkProjectUpdateAccess(projectId, user.id, user.role);

  const db = await getDb();
  const now = new Date().toISOString();

  try {
    const [newUpdate] = await db
      .insert(posts)
      .values({
        id: crypto.randomUUID(),
        title: input.title,
        content: input.content,
        projectId,
        authorId: user.id,
        type: 'UPDATE',
        category: 'GENERAL',
        isPinned: false,
        attachments: input.attachments || [],
        milestoneId: input.milestoneId || null,
        createdAt: now,
        updatedAt: now,
        language: 'ko',
        visibility: 'PUBLIC'
      })
      .returning({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        projectId: posts.projectId,
        authorId: posts.authorId,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        isPinned: posts.isPinned,
        attachments: posts.attachments,
        milestoneId: posts.milestoneId
      });

    if (!newUpdate) {
      throw new Error('프로젝트 업데이트 생성에 실패했습니다.');
    }

    // 작성자 정보 조회
    const [author] = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    // 프로젝트 정보 조회
    const [project] = await db
      .select({ 
        id: projects.id, 
        title: projects.title,
        ownerId: projects.ownerId 
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    return {
      ...newUpdate,
      createdAt: new Date(newUpdate.createdAt),
      updatedAt: new Date(newUpdate.updatedAt),
      attachments: (newUpdate.attachments as ProjectUpdateAttachment[]) || [],
      author: author || { id: user.id, name: user.name || 'Unknown', avatarUrl: null },
      project: project || { id: projectId, title: 'Unknown Project', ownerId: user.id },
      _count: { likes: 0, comments: 0 },
      isLiked: false
    };
  } catch (error) {
    if (error instanceof ProjectUpdateValidationError || error instanceof ProjectUpdateAccessDeniedError) {
      throw error;
    }
    throw new Error(`프로젝트 업데이트 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getProjectUpdate = async (
  updateId: string,
  user?: SessionUser
): Promise<ProjectUpdateRecord> => {
  const db = await getDb();

  const [update] = await db
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
      milestoneId: posts.milestoneId
    })
    .from(posts)
    .where(and(
      eq(posts.id, updateId),
      eq(posts.type, 'UPDATE')
    ))
    .limit(1);

  if (!update) {
    throw new ProjectUpdateNotFoundError('프로젝트 업데이트를 찾을 수 없습니다.');
  }

  // 작성자 정보 조회
  const [author] = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl
    })
    .from(users)
    .where(eq(users.id, update.authorId))
    .limit(1);

  // 프로젝트 정보 조회
  const [project] = update.projectId ? await db
      .select({ 
        id: projects.id, 
      title: projects.title,
        ownerId: projects.ownerId 
      })
      .from(projects)
    .where(eq(projects.id, update.projectId))
    .limit(1) : [null];

  // 좋아요 수 조회
  const likeCountResult = await db
    .select({ count: postLikes.id })
    .from(postLikes)
    .where(eq(postLikes.postId, updateId));
  
  const likeCount = likeCountResult.length;

  // 댓글 수 조회 (실제로는 comments 테이블에서 조회해야 함)
  const commentCount = 0; // 댓글 기능은 추후 구현 예정

  // 사용자가 좋아요를 눌렀는지 확인
  let isLiked = false;
  if (user) {
    const [like] = await db
      .select({ id: postLikes.id })
      .from(postLikes)
      .where(and(
        eq(postLikes.postId, updateId),
        eq(postLikes.userId, user.id)
      ))
      .limit(1);
    isLiked = !!like;
  }

  return {
    ...update,
    createdAt: new Date(update.createdAt),
    updatedAt: new Date(update.updatedAt),
    attachments: (update.attachments as ProjectUpdateAttachment[]) || [],
    author: author || { id: update.authorId, name: 'Unknown', avatarUrl: null },
    project: project || { id: update.projectId || 'unknown', title: 'Unknown Project', ownerId: update.authorId },
    _count: { 
      likes: likeCount, 
      comments: commentCount 
    },
    isLiked
  };
};

export const updateProjectUpdate = async (
  updateId: string,
  input: UpdateProjectUpdateInput,
  user: SessionUser
): Promise<ProjectUpdateRecord> => {
  validateProjectUpdateInput(input);

  const db = await getDb();

  // 기존 업데이트 조회
  const [existingUpdate] = await db
    .select({
      id: posts.id,
      projectId: posts.projectId,
      authorId: posts.authorId
    })
    .from(posts)
    .where(and(
      eq(posts.id, updateId),
      eq(posts.type, 'UPDATE')
    ))
      .limit(1);

  if (!existingUpdate) {
    throw new ProjectUpdateNotFoundError('프로젝트 업데이트를 찾을 수 없습니다.');
  }

  // 권한 확인
  if (existingUpdate.projectId) {
    await checkProjectUpdateAccess(existingUpdate.projectId, user.id, user.role);
  }

  const now = new Date().toISOString();

  try {
    const [updatedUpdate] = await db
      .update(posts)
      .set({
        ...(input.title && { title: input.title }),
        ...(input.content && { content: input.content }),
        ...(input.attachments && { attachments: input.attachments }),
        ...(input.milestoneId !== undefined && { milestoneId: input.milestoneId }),
        updatedAt: now
      })
      .where(eq(posts.id, updateId))
      .returning({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        projectId: posts.projectId,
        authorId: posts.authorId,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        isPinned: posts.isPinned,
        attachments: posts.attachments,
        milestoneId: posts.milestoneId
      });

    if (!updatedUpdate) {
      throw new Error('프로젝트 업데이트 수정에 실패했습니다.');
    }

    return await getProjectUpdate(updateId, user);
  } catch (error) {
    if (error instanceof ProjectUpdateValidationError || error instanceof ProjectUpdateAccessDeniedError) {
      throw error;
    }
    throw new Error(`프로젝트 업데이트 수정 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteProjectUpdate = async (
  updateId: string,
  user: SessionUser
): Promise<void> => {
  const db = await getDb();

  // 기존 업데이트 조회
  const [existingUpdate] = await db
    .select({
      id: posts.id,
      projectId: posts.projectId,
      authorId: posts.authorId
    })
    .from(posts)
    .where(and(
      eq(posts.id, updateId),
      eq(posts.type, 'UPDATE')
    ))
    .limit(1);

  if (!existingUpdate) {
    throw new ProjectUpdateNotFoundError('프로젝트 업데이트를 찾을 수 없습니다.');
  }

  // 권한 확인
  if (existingUpdate.projectId) {
    await checkProjectUpdateAccess(existingUpdate.projectId, user.id, user.role);
  }

  try {
    await db
      .delete(posts)
      .where(eq(posts.id, updateId));
  } catch (error) {
    throw new Error(`프로젝트 업데이트 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const listProjectUpdates = async (
  projectId: string,
  user?: SessionUser,
  options: ProjectUpdateListOptions = {}
): Promise<ProjectUpdateListResult> => {
  const db = await getDb();
  const {
    filters = {},
    limit = 20,
    offset = 0,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  // 기본 조건
  const conditions = [
    eq(posts.projectId, projectId),
    eq(posts.type, 'UPDATE')
  ];

  // 필터 조건 추가
  if (filters.authorId) {
    conditions.push(eq(posts.authorId, filters.authorId));
  }

  if (filters.milestoneId) {
    conditions.push(eq(posts.milestoneId, filters.milestoneId));
  }

  if (filters.isPinned !== undefined) {
    conditions.push(eq(posts.isPinned, filters.isPinned));
  }

  if (filters.search) {
    // 검색 조건은 LIKE 연산자를 사용해야 하므로 별도 처리
    // 검색 기능은 추후 개선 예정
  }

  // 정렬 조건
  const orderBy = sortOrder === 'asc' ? 
    (sortBy === 'createdAt' ? posts.createdAt : 
     sortBy === 'updatedAt' ? posts.updatedAt : 
     posts.createdAt) : 
    desc(sortBy === 'createdAt' ? posts.createdAt : 
         sortBy === 'updatedAt' ? posts.updatedAt : 
         posts.createdAt);

  try {
    // 업데이트 목록 조회
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
        milestoneId: posts.milestoneId
      })
      .from(posts)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit + 1)
      .offset(offset);

    // 작성자 정보 조회
    const authorIds = [...new Set(updates.map(update => update.authorId))];
    const authors = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl
      })
      .from(users)
      .where(inArray(users.id, authorIds));

    const authorMap = new Map(authors.map(author => [author.id, author]));

    // 프로젝트 정보 조회
    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title,
        ownerId: projects.ownerId
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    // 좋아요 수 조회
    const updateIds = updates.map(update => update.id);
    const likeCounts = await db
      .select({
        postId: postLikes.postId,
        count: postLikes.id
      })
      .from(postLikes)
      .where(inArray(postLikes.postId, updateIds));

    // postId별로 그룹화하여 개수 계산
    const likeCountMap = new Map<string, number>();
    likeCounts.forEach(like => {
      const currentCount = likeCountMap.get(like.postId) || 0;
      likeCountMap.set(like.postId, currentCount + 1);
    });

    // 사용자가 좋아요를 눌렀는지 확인
    let userLikes = new Set<string>();
    if (user) {
      const userLikePosts = await db
        .select({ postId: postLikes.postId })
        .from(postLikes)
        .where(and(
          inArray(postLikes.postId, updateIds),
          eq(postLikes.userId, user.id)
        ));
      userLikes = new Set(userLikePosts.map(like => like.postId));
    }

    // 결과 변환
    const hasMore = updates.length > limit;
    const resultUpdates = updates.slice(0, limit).map(update => ({
      ...update,
      createdAt: new Date(update.createdAt),
      updatedAt: new Date(update.updatedAt),
      attachments: (update.attachments as ProjectUpdateAttachment[]) || [],
      author: authorMap.get(update.authorId) || { id: update.authorId, name: 'Unknown', avatarUrl: null },
      project: project || { id: projectId, title: 'Unknown Project', ownerId: update.authorId },
      _count: { 
        likes: likeCountMap.get(update.id) || 0, 
        comments: 0 // 댓글 기능은 추후 구현 예정
      },
      isLiked: userLikes.has(update.id)
    }));

    // 전체 개수 조회
    const totalResult = await db
      .select({ count: posts.id })
      .from(posts)
      .where(and(...conditions));

    return {
      updates: resultUpdates,
      total: totalResult.length,
      hasMore
    };
  } catch (error) {
    throw new Error(`프로젝트 업데이트 목록 조회 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const toggleProjectUpdateLike = async (
  updateId: string,
  user: SessionUser
): Promise<{ isLiked: boolean; likeCount: number }> => {
  const db = await getDb();

  // 업데이트 존재 확인
  const [update] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(
        eq(posts.id, updateId),
      eq(posts.type, 'UPDATE')
    ))
    .limit(1);

  if (!update) {
    throw new ProjectUpdateNotFoundError('프로젝트 업데이트를 찾을 수 없습니다.');
  }

  try {
    // 기존 좋아요 확인
    const [existingLike] = await db
      .select({ id: postLikes.id })
      .from(postLikes)
      .where(and(
        eq(postLikes.postId, updateId),
        eq(postLikes.userId, user.id)
      ))
      .limit(1);

    if (existingLike) {
      // 좋아요 취소
      await db
        .delete(postLikes)
        .where(eq(postLikes.id, existingLike.id));
    } else {
      // 좋아요 추가
      await db
        .insert(postLikes)
        .values({
          id: crypto.randomUUID(),
          postId: updateId,
          userId: user.id,
          createdAt: new Date().toISOString()
        });
    }

    // 현재 좋아요 수 조회
    const likeCountResult = await db
      .select({ count: postLikes.id })
      .from(postLikes)
      .where(eq(postLikes.postId, updateId));

    return {
      isLiked: !existingLike,
      likeCount: likeCountResult.length
    };
  } catch (error) {
    throw new Error(`좋아요 토글 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const pinProjectUpdate = async (
  updateId: string,
  user: SessionUser
): Promise<void> => {
  const db = await getDb();

  // 업데이트 존재 확인 및 권한 확인
  const [update] = await db
    .select({
      id: posts.id,
      projectId: posts.projectId,
      authorId: posts.authorId
    })
    .from(posts)
    .where(and(
      eq(posts.id, updateId),
      eq(posts.type, 'UPDATE')
    ))
    .limit(1);

  if (!update) {
    throw new ProjectUpdateNotFoundError('프로젝트 업데이트를 찾을 수 없습니다.');
  }

  // 권한 확인
  if (update.projectId) {
    await checkProjectUpdateAccess(update.projectId, user.id, user.role);
  }

  try {
    await db
      .update(posts)
      .set({
        isPinned: true,
        updatedAt: new Date().toISOString()
      })
      .where(eq(posts.id, updateId));
  } catch (error) {
    throw new Error(`업데이트 고정 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const unpinProjectUpdate = async (
  updateId: string,
  user: SessionUser
): Promise<void> => {
  const db = await getDb();

  // 업데이트 존재 확인 및 권한 확인
  const [update] = await db
    .select({
      id: posts.id,
      projectId: posts.projectId,
      authorId: posts.authorId
    })
      .from(posts)
      .where(and(
        eq(posts.id, updateId),
      eq(posts.type, 'UPDATE')
      ))
      .limit(1);

  if (!update) {
    throw new ProjectUpdateNotFoundError('프로젝트 업데이트를 찾을 수 없습니다.');
    }

  // 권한 확인
  if (update.projectId) {
    await checkProjectUpdateAccess(update.projectId, user.id, user.role);
  }

  try {
    await db
      .update(posts)
      .set({
        isPinned: false,
        updatedAt: new Date().toISOString()
      })
      .where(eq(posts.id, updateId));
  } catch (error) {
    throw new Error(`업데이트 고정 해제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};