import { createClient } from '@jsr/supabase__supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'creator' | 'participant' | 'partner';
          avatar?: string;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role: 'creator' | 'participant' | 'partner';
          avatar?: string;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: 'creator' | 'participant' | 'partner';
          avatar?: string;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          image_url: string;
          target_amount: number;
          current_amount: number;
          participant_count: number;
          days_left: number;
          artist_id: string;
          reward_type: 'reward' | 'revenue' | 'both';
          verified: boolean;
          status: 'draft' | 'active' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: string;
          image_url: string;
          target_amount: number;
          current_amount?: number;
          participant_count?: number;
          days_left: number;
          artist_id: string;
          reward_type: 'reward' | 'revenue' | 'both';
          verified?: boolean;
          status?: 'draft' | 'active' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          image_url?: string;
          target_amount?: number;
          current_amount?: number;
          participant_count?: number;
          days_left?: number;
          artist_id?: string;
          reward_type?: 'reward' | 'revenue' | 'both';
          verified?: boolean;
          status?: 'draft' | 'active' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      artists: {
        Row: {
          id: string;
          name: string;
          genre: string;
          bio: string;
          profile_image: string;
          cover_image: string;
          location: string;
          join_date: string;
          is_verified: boolean;
          followers: number;
          following: number;
          total_funded: number;
          success_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          genre: string;
          bio: string;
          profile_image: string;
          cover_image: string;
          location: string;
          join_date: string;
          is_verified?: boolean;
          followers?: number;
          following?: number;
          total_funded?: number;
          success_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          genre?: string;
          bio?: string;
          profile_image?: string;
          cover_image?: string;
          location?: string;
          join_date?: string;
          is_verified?: boolean;
          followers?: number;
          following?: number;
          total_funded?: number;
          success_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      community_posts: {
        Row: {
          id: string;
          category: string;
          title: string;
          content: string;
          author_id: string;
          likes: number;
          comments: number;
          views: number;
          is_pinned: boolean;
          is_hot: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          title: string;
          content: string;
          author_id: string;
          likes?: number;
          comments?: number;
          views?: number;
          is_pinned?: boolean;
          is_hot?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          title?: string;
          content?: string;
          author_id?: string;
          likes?: number;
          comments?: number;
          views?: number;
          is_pinned?: boolean;
          is_hot?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      participations: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          type: 'reward' | 'revenue';
          amount: number;
          reward_id?: string;
          participant_info: any; // JSON object
          status: 'pending' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          type: 'reward' | 'revenue';
          amount: number;
          reward_id?: string;
          participant_info: any;
          status?: 'pending' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          type?: 'reward' | 'revenue';
          amount?: number;
          reward_id?: string;
          participant_info?: any;
          status?: 'pending' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

