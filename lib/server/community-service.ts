import { PostType, CommunityCategory } from '@/types/drizzle';
// PostStatus enum removed - using string type
import { prisma } from '@/lib/prisma';
import { responses } from './api-responses';

export interface PostCreateData {
  title: string;
  content: string;
  category: CommunityCategory;
  projectId?: string;
  isAnonymous?: boolean;
  attachments?: any[];
  authorId: string;
}

export interface PostUpdateData {
  title?: string;
  content?: string;
  category?: CommunityCategory;
  isAnonymous?: boolean;
  attachments?: any[];
  status?: PostStatus;
}

export interface PostFilters {
  projectId?: string;
  authorId?: string;
  category?: CommunityCategory;
  status?: PostStatus;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * 게시글 생성
 */
export async function createPost(data: PostCreateData) {
  try {
    const { title, content, category, projectId, isAnonymous, attachments, authorId } = data;

    const post = await prisma.post.create({
      data: {
        title,
        content,
        category,
        projectId,
        isAnonymous: isAnonymous || false,
        attachments: attachments || [],
        authorId,
        type: PostType.DISCUSSION,
        status: PostStatus.ACTIVE
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        _count: {
          select: {
            likes: true,
            dislikes: true,
            comments: true
          }
        }
      }
    });

    return responses.success(post, '게시글이 작성되었습니다.');
  } catch (error) {
    console.error('게시글 생성 실패:', error);
    return responses.error('게시글 작성에 실패했습니다.');
  }
}

/**
 * 게시글 수정
 */
export async function updatePost(postId: string, data: PostUpdateData, userId: string) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return responses.notFound('게시글');
    }

    // 작성자만 수정 가능
    if (post.authorId !== userId) {
      return responses.forbidden();
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        ...data,
        editedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        _count: {
          select: {
            likes: true,
            dislikes: true,
            comments: true
          }
        }
      }
    });

    return responses.success(updatedPost, '게시글이 수정되었습니다.');
  } catch (error) {
    console.error('게시글 수정 실패:', error);
    return responses.error('게시글 수정에 실패했습니다.');
  }
}

/**
 * 게시글 목록 조회
 */
export async function getPosts(filters: PostFilters) {
  try {
    const { projectId, authorId, category, status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      type: PostType.DISCUSSION
    };
    
    if (projectId) where.projectId = projectId;
    if (authorId) where.authorId = authorId;
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          },
          project: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          _count: {
            select: {
              likes: true,
              dislikes: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.post.count({ where })
    ]);

    return responses.success({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('게시글 목록 조회 실패:', error);
    return responses.error('게시글 목록을 불러올 수 없습니다.');
  }
}

/**
 * 게시글 상세 조회
 */
export async function getPost(postId: string) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            likes: true,
            dislikes: true,
            comments: true
          }
        }
      }
    });

    if (!post) {
      return responses.notFound('게시글');
    }

    return responses.success(post);
  } catch (error) {
    console.error('게시글 조회 실패:', error);
    return responses.error('게시글 정보를 불러올 수 없습니다.');
  }
}

/**
 * 게시글 삭제
 */
export async function deletePost(postId: string, userId: string) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return responses.notFound('게시글');
    }

    // 작성자만 삭제 가능
    if (post.authorId !== userId) {
      return responses.forbidden();
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.DELETED,
        editedAt: new Date()
      }
    });

    return responses.success(null, '게시글이 삭제되었습니다.');
  } catch (error) {
    console.error('게시글 삭제 실패:', error);
    return responses.error('게시글 삭제에 실패했습니다.');
  }
}

/**
 * 게시글 좋아요/싫어요 토글
 */
export async function togglePostReaction(
  postId: string, 
  userId: string, 
  reactionType: 'like' | 'dislike'
) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return responses.notFound('게시글');
    }

    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          userId,
          postId
        }
      }
    });

    const existingDislike = await prisma.postDislike.findUnique({
      where: {
        postId_userId: {
          userId,
          postId
        }
      }
    });

    await prisma.$transaction(async (tx) => {
      if (reactionType === 'like') {
        if (existingLike) {
          // 이미 좋아요한 경우 취소
          await tx.postLike.delete({
            where: {
              postId_userId: {
                userId,
                postId
              }
            }
          });
        } else {
          // 좋아요 추가
          await tx.postLike.create({
            data: {
              userId,
              postId
            }
          });
          
          // 기존 싫어요가 있다면 제거
          if (existingDislike) {
            await tx.postDislike.delete({
              where: {
                postId_userId: {
                  userId,
                  postId
                }
              }
            });
          }
        }
      } else {
        if (existingDislike) {
          // 이미 싫어요한 경우 취소
          await tx.postDislike.delete({
            where: {
              postId_userId: {
                userId,
                postId
              }
            }
          });
        } else {
          // 싫어요 추가
          await tx.postDislike.create({
            data: {
              userId,
              postId
            }
          });
          
          // 기존 좋아요가 있다면 제거
          if (existingLike) {
            await tx.postLike.delete({
              where: {
                postId_userId: {
                  userId,
                  postId
                }
              }
            });
          }
        }
      }
    });

    // 업데이트된 반응 수 조회
    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        _count: {
          select: {
            likes: true,
            dislikes: true
          }
        }
      }
    });

    return responses.success({
      likes: updatedPost?._count.likes || 0,
      dislikes: updatedPost?._count.dislikes || 0
    });
  } catch (error) {
    console.error('게시글 반응 토글 실패:', error);
    return responses.error('반응 처리에 실패했습니다.');
  }
}
