import { cache } from 'react';
import { getTrendingPosts } from '@/lib/db/queries/posts';
import type { HomeCommunityPost } from '@/lib/data/community';

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
