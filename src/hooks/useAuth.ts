import { useState, useEffect, useCallback } from 'react';
import { AuthService } from '../services/auth';
import { User, LoginForm, SignupForm } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 현재 사용자 정보 조회
  const fetchCurrentUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.getCurrentUser();
      
      if (response.success) {
        setUser(response.data);
      } else {
        setUser(null);
        if (response.error) {
          setError(response.error);
        }
      }
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // 로그인
  const login = useCallback(async (credentials: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.login(credentials);
      
      if (response.success && response.data) {
        setUser(response.data);
        return { success: true };
      } else {
        setError(response.error || 'Login failed');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // 회원가입
  const signup = useCallback(async (userData: SignupForm) => {
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.signup(userData);
      
      if (response.success && response.data) {
        setUser(response.data);
        return { success: true };
      } else {
        setError(response.error || 'Signup failed');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // 로그아웃
  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.logout();
      
      if (response.success) {
        setUser(null);
        return { success: true };
      } else {
        setError(response.error || 'Logout failed');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // 프로필 업데이트
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return { success: false, error: 'No user logged in' };

    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.updateProfile(user.id, updates);
      
      if (response.success && response.data) {
        setUser(response.data);
        return { success: true };
      } else {
        setError(response.error || 'Profile update failed');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 비밀번호 재설정
  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.resetPassword(email);
      
      if (response.success) {
        return { success: true };
      } else {
        setError(response.error || 'Password reset failed');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    updateProfile,
    resetPassword,
    refetch: fetchCurrentUser
  };
}
