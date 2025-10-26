import { cache } from 'react';
import { getTrendingPosts } from '@/lib/db/queries/posts';
import type { HomeCommunityPost } from '@/lib/data/community';
import { getDb } from '@/lib/db/client';
import { posts } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';

// 홈페이지용 경량 커뮤니티 조회
export const getHomeCommunityPosts = cache(async (limit = 5): Promise<HomeCommunityPost[]> => {
  try {
    const trendingPosts = await getTrendingPosts(limit);
    
    return trendingPosts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      likes: post.likesCount,
      comments: post.commentsCount,
      category: post.category,
      createdAt: post.createdAt,
      author: {
        id: post.author.id,
        name: post.author.name,
        avatarUrl: post.author.avatarUrl
      }
    }));
  } catch (error) {
    console.error('Failed to fetch home community posts:', error);
    return [];
  }
});

// 커뮤니티 전체 게시글 수(PUBLISHED 상태) 반환
export const getCommunityPostCount = cache(async (): Promise<number> => {
  try {
    const db = await getDb();
    // 게시 상태가 PUBLISHED이고 공개된 글만 카운트
    const [row] = await db
      .select({ value: sql<number>`count(*)` })
      .from(posts)
      .where(
        eq(posts.visibility, 'PUBLIC')
      );

    return Number(row?.value ?? 0);
  } catch (error) {
    console.error('Failed to count community posts:', error);
    return 0;
  }
});
