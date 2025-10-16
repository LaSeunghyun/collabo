import { supabase } from '../lib/supabase';
import { Project, ApiResponse, PaginatedResponse, ProjectFilters, ProjectSort } from '../types';

export class ProjectService {
  // 프로젝트 목록 조회
  static async getProjects(
    filters?: ProjectFilters,
    sort?: ProjectSort,
    page: number = 1,
    limit: number = 12
  ): Promise<PaginatedResponse<Project>> {
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          artists!inner(
            id,
            name,
            avatar,
            verified,
            followers
          )
        `);

      // 필터 적용
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.rewardType) {
        query = query.eq('reward_type', filters.rewardType);
      }

      if (filters?.verified !== undefined) {
        query = query.eq('verified', filters.verified);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // 정렬 적용
      if (sort) {
        query = query.order(sort.field, { ascending: sort.order === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // 페이지네이션
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      // 데이터 변환
      const projects: Project[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        imageUrl: item.image_url,
        targetAmount: item.target_amount,
        currentAmount: item.current_amount,
        participantCount: item.participant_count,
        daysLeft: item.days_left,
        artist: {
          id: item.artists.id,
          name: item.artists.name,
          avatar: item.artists.avatar,
          verified: item.artists.verified,
          followers: item.artists.followers
        },
        rewardType: item.reward_type,
        verified: item.verified,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        status: item.status
      }));

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        data: projects,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages
        },
        success: true
      };
    } catch (error) {
      console.error('Error fetching projects:', error);
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

  // 프로젝트 상세 조회
  static async getProjectById(id: string): Promise<ApiResponse<Project | null>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          artists!inner(
            id,
            name,
            avatar,
            verified,
            followers
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
          message: 'Project not found'
        };
      }

      const project: Project = {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category,
        imageUrl: data.image_url,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        participantCount: data.participant_count,
        daysLeft: data.days_left,
        artist: {
          id: data.artists.id,
          name: data.artists.name,
          avatar: data.artists.avatar,
          verified: data.artists.verified,
          followers: data.artists.followers
        },
        rewardType: data.reward_type,
        verified: data.verified,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        status: data.status
      };

      return {
        data: project,
        success: true
      };
    } catch (error) {
      console.error('Error fetching project:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 프로젝트 생성
  static async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount' | 'participantCount'>): Promise<ApiResponse<Project>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: projectData.title,
          description: projectData.description,
          category: projectData.category,
          image_url: projectData.imageUrl,
          target_amount: projectData.targetAmount,
          current_amount: 0,
          participant_count: 0,
          days_left: projectData.daysLeft,
          artist_id: projectData.artist.id,
          reward_type: projectData.rewardType,
          verified: projectData.verified,
          status: 'draft'
        })
        .select(`
          *,
          artists!inner(
            id,
            name,
            avatar,
            verified,
            followers
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      const project: Project = {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category,
        imageUrl: data.image_url,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        participantCount: data.participant_count,
        daysLeft: data.days_left,
        artist: {
          id: data.artists.id,
          name: data.artists.name,
          avatar: data.artists.avatar,
          verified: data.artists.verified,
          followers: data.artists.followers
        },
        rewardType: data.reward_type,
        verified: data.verified,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        status: data.status
      };

      return {
        data: project,
        success: true
      };
    } catch (error) {
      console.error('Error creating project:', error);
      return {
        data: null as any,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 프로젝트 업데이트
  static async updateProject(id: string, updates: Partial<Project>): Promise<ApiResponse<Project>> {
    try {
      const updateData: any = {};
      
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.category) updateData.category = updates.category;
      if (updates.imageUrl) updateData.image_url = updates.imageUrl;
      if (updates.targetAmount) updateData.target_amount = updates.targetAmount;
      if (updates.daysLeft) updateData.days_left = updates.daysLeft;
      if (updates.rewardType) updateData.reward_type = updates.rewardType;
      if (updates.verified !== undefined) updateData.verified = updates.verified;
      if (updates.status) updateData.status = updates.status;

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          artists!inner(
            id,
            name,
            avatar,
            verified,
            followers
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      const project: Project = {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category,
        imageUrl: data.image_url,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        participantCount: data.participant_count,
        daysLeft: data.days_left,
        artist: {
          id: data.artists.id,
          name: data.artists.name,
          avatar: data.artists.avatar,
          verified: data.artists.verified,
          followers: data.artists.followers
        },
        rewardType: data.reward_type,
        verified: data.verified,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        status: data.status
      };

      return {
        data: project,
        success: true
      };
    } catch (error) {
      console.error('Error updating project:', error);
      return {
        data: null as any,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 프로젝트 삭제
  static async deleteProject(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('projects')
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
      console.error('Error deleting project:', error);
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
