import { supabase } from '../lib/supabase';
import { User, LoginForm, SignupForm, ApiResponse } from '../types';

export class AuthService {
  // 이메일/비밀번호로 로그인
  static async login(credentials: LoginForm): Promise<ApiResponse<User>> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Login failed');
      }

      // 사용자 정보 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        throw userError;
      }

      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatar: userData.avatar,
        verified: userData.verified,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at
      };

      return {
        data: user,
        success: true
      };
    } catch (error) {
      console.error('Error logging in:', error);
      return {
        data: null as any,
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  // 회원가입
  static async signup(userData: SignupForm): Promise<ApiResponse<User>> {
    try {
      // Supabase Auth에 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Signup failed');
      }

      // 사용자 프로필 생성
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          verified: false
        })
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      const user: User = {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        role: profileData.role,
        avatar: profileData.avatar,
        verified: profileData.verified,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at
      };

      return {
        data: user,
        success: true
      };
    } catch (error) {
      console.error('Error signing up:', error);
      return {
        data: null as any,
        success: false,
        error: error instanceof Error ? error.message : 'Signup failed'
      };
    }
  }

  // 로그아웃
  static async logout(): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      return {
        data: true,
        success: true
      };
    } catch (error) {
      console.error('Error logging out:', error);
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      };
    }
  }

  // 현재 사용자 정보 조회
  static async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        return {
          data: null,
          success: true
        };
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        throw error;
      }

      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatar: userData.avatar,
        verified: userData.verified,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at
      };

      return {
        data: user,
        success: true
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user'
      };
    }
  }

  // 사용자 프로필 업데이트
  static async updateProfile(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.avatar) updateData.avatar = updates.avatar;
      if (updates.verified !== undefined) updateData.verified = updates.verified;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const user: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatar: data.avatar,
        verified: data.verified,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      return {
        data: user,
        success: true
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        data: null as any,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      };
    }
  }

  // 비밀번호 재설정 이메일 발송
  static async resetPassword(email: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      return {
        data: true,
        success: true
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset password'
      };
    }
  }
}
