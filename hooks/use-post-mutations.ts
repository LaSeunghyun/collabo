'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

interface MutationState<T> {
  isLoading: boolean;
  error: string | null;
  data: T | null;
}

export function usePostMutations() {
  const { data: session } = useSession();
  const [likeState, setLikeState] = useState<MutationState<void>>({ isLoading: false, error: null, data: null });
  const [reportState, setReportState] = useState<MutationState<void>>({ isLoading: false, error: null, data: null });

  const ensureAuthenticated = () => {
    if (!session) {
      alert('로그인이 필요합니다.');
      throw new Error('User not authenticated');
    }
  };

  const likePost = async (postId: string, isCurrentlyLiked: boolean) => {
    try {
      ensureAuthenticated();
      setLikeState({ isLoading: true, error: null, data: null });

      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/posts/${postId}/like`, {
        method,
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update like status');
      }

      setLikeState({ isLoading: false, error: null, data: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      if (errorMessage !== 'User not authenticated') {
        alert(errorMessage);
      }
      setLikeState({ isLoading: false, error: errorMessage, data: null });
      throw error; // Re-throw to allow caller to handle if needed
    }
  };

  const reportPost = async (postId: string) => {
    try {
      ensureAuthenticated();
      const reason = prompt('신고 사유를 입력해주세요:');
      if (!reason) return;

      setReportState({ isLoading: true, error: null, data: null });

      const response = await fetch(`/api/posts/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to report post');
      }

      alert('신고가 접수되었습니다.');
      setReportState({ isLoading: false, error: null, data: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      if (errorMessage !== 'User not authenticated') {
        alert(errorMessage);
      }
      setReportState({ isLoading: false, error: errorMessage, data: null });
    }
  };

  return {
    likePost,
    reportPost,
    likeState,
    reportState,
  };
}
