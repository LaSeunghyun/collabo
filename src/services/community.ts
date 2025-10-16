import { supabase } from '../lib/supabase';
import { CommunityPost, ApiResponse, PaginatedResponse } from '../types';

export class CommunityService {
  // 커뮤니티 게시글 목록 조회
  static async getPosts(
    category?: string,
    search?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<CommunityPost>> {
    try {
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          users!inner(
            id,
            name,
            avatar,
            verified,
            role
          )
        `);

      // 카테고리 필터
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      // 검색 필터
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      // 정렬 (고정글 먼저, 그 다음 최신순)
      query = query.order('is_pinned', { ascending: false });
      query = query.order('created_at', { ascending: false });

      // 페이지네이션
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      // 데이터 변환
      const posts: CommunityPost[] = (data || []).map((item: any) => ({
        id: item.id,
        category: item.category,
        title: item.title,
        content: item.content,
        author: {
          id: item.users.id,
          name: item.users.name,
          avatar: item.users.avatar,
          isVerified: item.users.verified,
          role: item.users.role
        },
        stats: {
          likes: item.likes,
          comments: item.comments,
          views: item.views
        },
        timestamp: item.created_at,
        isPinned: item.is_pinned,
        isHot: item.is_hot
      }));

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        data: posts,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages
        },
        success: true
      };
    } catch (error) {
      console.error('Error fetching community posts:', error);
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 게시글 상세 조회
  static async getPostById(id: string): Promise<ApiResponse<CommunityPost | null>> {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          users!inner(
            id,
            name,
            avatar,
            verified,
            role
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return {
          data: null,
          success: false,
          message: 'Post not found'
        };
      }

      const post: CommunityPost = {
        id: data.id,
        category: data.category,
        title: data.title,
        content: data.content,
        author: {
          id: data.users.id,
          name: data.users.name,
          avatar: data.users.avatar,
          isVerified: data.users.verified,
          role: data.users.role
        },
        stats: {
          likes: data.likes,
          comments: data.comments,
          views: data.views
        },
        timestamp: data.created_at,
        isPinned: data.is_pinned,
        isHot: data.is_hot
      };

      return {
        data: post,
        success: true
      };
    } catch (error) {
      console.error('Error fetching post:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 게시글 생성
  static async createPost(
    title: string,
    content: string,
    category: string,
    authorId: string
  ): Promise<ApiResponse<CommunityPost>> {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          title,
          content,
          category,
          author_id: authorId,
          likes: 0,
          comments: 0,
          views: 0,
          is_pinned: false,
          is_hot: false
        })
        .select(`
          *,
          users!inner(
            id,
            name,
            avatar,
            verified,
            role
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      const post: CommunityPost = {
        id: data.id,
        category: data.category,
        title: data.title,
        content: data.content,
        author: {
          id: data.users.id,
          name: data.users.name,
          avatar: data.users.avatar,
          isVerified: data.users.verified,
          role: data.users.role
        },
        stats: {
          likes: data.likes,
          comments: data.comments,
          views: data.views
        },
        timestamp: data.created_at,
        isPinned: data.is_pinned,
        isHot: data.is_hot
      };

      return {
        data: post,
        success: true
      };
    } catch (error) {
      console.error('Error creating post:', error);
      return {
        data: null as any,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 게시글 업데이트
  static async updatePost(
    id: string,
    updates: { title?: string; content?: string; category?: string }
  ): Promise<ApiResponse<CommunityPost>> {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          users!inner(
            id,
            name,
            avatar,
            verified,
            role
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      const post: CommunityPost = {
        id: data.id,
        category: data.category,
        title: data.title,
        content: data.content,
        author: {
          id: data.users.id,
          name: data.users.name,
          avatar: data.users.avatar,
          isVerified: data.users.verified,
          role: data.users.role
        },
        stats: {
          likes: data.likes,
          comments: data.comments,
          views: data.views
        },
        timestamp: data.created_at,
        isPinned: data.is_pinned,
        isHot: data.is_hot
      };

      return {
        data: post,
        success: true
      };
    } catch (error) {
      console.error('Error updating post:', error);
      return {
        data: null as any,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 게시글 삭제
  static async deletePost(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return {
        data: true,
        success: true
      };
    } catch (error) {
      console.error('Error deleting post:', error);
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 게시글 좋아요
  static async likePost(postId: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      // 좋아요 테이블이 있다면 여기서 처리
      // 현재는 단순히 게시글의 좋아요 수를 증가시킴
      const { error } = await supabase.rpc('increment_likes', {
        post_id: postId
      });

      if (error) {
        throw error;
      }

      return {
        data: true,
        success: true
      };
    } catch (error) {
      console.error('Error liking post:', error);
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 조회수 증가
  static async incrementViews(postId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.rpc('increment_views', {
        post_id: postId
      });

      if (error) {
        throw error;
      }

      return {
        data: true,
        success: true
      };
    } catch (error) {
      console.error('Error incrementing views:', error);
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
