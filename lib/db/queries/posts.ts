import { eq, desc, and, lte, count, inArray } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { posts, users, postLikes, comments } from '@/lib/db/schema';
import type { PostWithAuthor } from '@/types/database';

export async function getPublishedPosts(limit: number = 10): Promise<PostWithAuthor[]> {
  const db = await getDb();
  
  const postsData = await db
    .select({
      id: posts.id,
      projectId: posts.projectId,
      authorId: posts.authorId,
      title: posts.title,
      content: posts.content,
      type: posts.type,
      status: posts.status,
      visibility: posts.visibility,
      attachments: posts.attachments,
      milestoneId: posts.milestoneId,
      excerpt: posts.excerpt,
      tags: posts.tags,
      category: posts.category,
      language: posts.language,
      scheduledAt: posts.scheduledAt,
      publishedAt: posts.publishedAt,
      isPinned: posts.isPinned,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        passwordHash: users.passwordHash,
        avatarUrl: users.avatarUrl,
        language: users.language,
        timezone: users.timezone,
        bio: users.bio,
        socialLinks: users.socialLinks,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.status, 'PUBLISHED'))
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  // 각 포스트의 좋아요와 댓글 수를 조회
  const postIds = postsData.map(p => p.id);
  
  const [likeCounts, commentCounts] = await Promise.all([
    db.select({
      postId: postLikes.postId,
      count: count()
    })
      .from(postLikes)
      .where(inArray(postLikes.postId, postIds))
      .groupBy(postLikes.postId),
    db.select({
      postId: comments.postId,
      count: count()
    })
      .from(comments)
      .where(inArray(comments.postId, postIds))
      .groupBy(comments.postId)
  ]);

  const likeCountMap = new Map(likeCounts.map(l => [l.postId, l.count]));
  const commentCountMap = new Map(commentCounts.map(c => [c.postId, c.count]));

  return postsData.map(post => ({
    ...post,
    likesCount: likeCountMap.get(post.id) || 0,
    commentsCount: commentCountMap.get(post.id) || 0
  }));
}

export async function getTrendingPosts(limit: number = 5): Promise<PostWithAuthor[]> {
  const db = await getDb();
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // 최근 3일간의 게시된 포스트 조회
  const trendingPosts = await db
    .select({
      id: posts.id,
      projectId: posts.projectId,
      authorId: posts.authorId,
      title: posts.title,
      content: posts.content,
      type: posts.type,
      status: posts.status,
      visibility: posts.visibility,
      attachments: posts.attachments,
      milestoneId: posts.milestoneId,
      excerpt: posts.excerpt,
      tags: posts.tags,
      category: posts.category,
      language: posts.language,
      scheduledAt: posts.scheduledAt,
      publishedAt: posts.publishedAt,
      isPinned: posts.isPinned,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        passwordHash: users.passwordHash,
        avatarUrl: users.avatarUrl,
        language: users.language,
        timezone: users.timezone,
        bio: users.bio,
        socialLinks: users.socialLinks,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(
      and(
        eq(posts.status, 'PUBLISHED'),
        lte(posts.createdAt, now.toISOString()),
        lte(posts.createdAt, threeDaysAgo.toISOString())
      )
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit * 2); // 더 많이 가져와서 필터링

  if (trendingPosts.length === 0) {
    return [];
  }

  const postIds = trendingPosts.map(p => p.id);

  // 좋아요와 댓글 수를 배치로 조회
  const [likeCounts, commentCounts] = await Promise.all([
    db.select({
      postId: postLikes.postId,
      count: count()
    })
      .from(postLikes)
      .where(inArray(postLikes.postId, postIds))
      .groupBy(postLikes.postId),
    db.select({
      postId: comments.postId,
      count: count()
    })
      .from(comments)
      .where(inArray(comments.postId, postIds))
      .groupBy(comments.postId)
  ]);

  const likeCountMap = new Map(likeCounts.map(l => [l.postId, l.count]));
  const commentCountMap = new Map(commentCounts.map(c => [c.postId, c.count]));

  // 트렌딩 조건 필터링 (좋아요 5개 이상, 댓글 3개 이상)
  const trendingFiltered = trendingPosts
    .filter(post => {
      const likes = likeCountMap.get(post.id) || 0;
      const comments = commentCountMap.get(post.id) || 0;
      return likes >= 5 && comments >= 3;
    })
    .slice(0, limit);

  return trendingFiltered.map(post => ({
    ...post,
    likesCount: likeCountMap.get(post.id) || 0,
    commentsCount: commentCountMap.get(post.id) || 0
  }));
}

export async function getPostById(id: string): Promise<PostWithAuthor | null> {
  const db = await getDb();
  
  const [post] = await db
    .select({
      id: posts.id,
      projectId: posts.projectId,
      authorId: posts.authorId,
      title: posts.title,
      content: posts.content,
      type: posts.type,
      status: posts.status,
      visibility: posts.visibility,
      attachments: posts.attachments,
      milestoneId: posts.milestoneId,
      excerpt: posts.excerpt,
      tags: posts.tags,
      category: posts.category,
      language: posts.language,
      scheduledAt: posts.scheduledAt,
      publishedAt: posts.publishedAt,
      isPinned: posts.isPinned,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        passwordHash: users.passwordHash,
        avatarUrl: users.avatarUrl,
        language: users.language,
        timezone: users.timezone,
        bio: users.bio,
        socialLinks: users.socialLinks,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, id))
    .limit(1);

  if (!post) {
    return null;
  }

  // 좋아요와 댓글 수 조회
  const [likeCounts, commentCounts] = await Promise.all([
    db.select({ count: count() })
      .from(postLikes)
      .where(eq(postLikes.postId, id)),
    db.select({ count: count() })
      .from(comments)
      .where(eq(comments.postId, id))
  ]);

  return {
    ...post,
    likesCount: likeCounts[0]?.count || 0,
    commentsCount: commentCounts[0]?.count || 0
  };
}
