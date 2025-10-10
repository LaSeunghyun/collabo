'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Edit, Heart, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

// Mock data types
interface ProjectUpdate {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  createdAt: string;
  updatedAt: string;
  likes: number;
  comments: number;
  liked: boolean;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  canEdit: boolean;
}

interface ProjectUpdatesBoardProps {
  projectId: string;
  updates?: ProjectUpdate[];
  onUpdateCreated?: (update: ProjectUpdate) => void;
  onUpdateUpdated?: (update: ProjectUpdate) => void;
  onUpdateDeleted?: (updateId: string) => void;
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  
  return formatDateTime(dateString);
};

export function ProjectUpdatesBoard({ 
  projectId, 
  updates = [], 
  onUpdateCreated, 
  onUpdateUpdated, 
  onUpdateDeleted 
}: ProjectUpdatesBoardProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // Mock mutations
  const likeMutation = useMutation({
    mutationFn: async (updateId: string) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-updates', projectId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (updateId: string) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: (_, updateId) => {
      onUpdateDeleted?.(updateId);
      queryClient.invalidateQueries({ queryKey: ['project-updates', projectId] });
      console.log('업데이트가 삭제되었습니다.');
    },
  });

  const handleLike = (updateId: string) => {
    likeMutation.mutate(updateId);
  };

  const handleDelete = (updateId: string) => {
    if (confirm('정말로 이 업데이트를 삭제하시겠습니까?')) {
      deleteMutation.mutate(updateId);
    }
  };

  const handleEdit = (update: ProjectUpdate) => {
    // Mock edit functionality
    console.log('편집 기능은 준비 중입니다.');
  };

  if (updates.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-12">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">아직 업데이트가 없습니다</h3>
          <p className="text-sm text-white/60 mb-4">
            프로젝트의 진행 상황을 공유해보세요.
          </p>
          {session?.user && (
            <button 
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              첫 업데이트 작성하기
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {session?.user && (
        <div className="flex justify-end">
          <button 
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            새 업데이트 작성
          </button>
        </div>
      )}

      <div className="space-y-4">
        {updates.map((update) => (
          <div key={update.id} className="rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium">
                  {update.author.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-white">{update.author.name}</p>
                  <p className="text-xs text-white/60">
                    {formatRelativeTime(update.createdAt)}
                  </p>
                </div>
              </div>
              
              {update.canEdit && (
                <div className="relative">
                  <button className="p-2 hover:bg-white/10 rounded">
                    <MoreHorizontal className="h-4 w-4 text-white/60" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {update.title}
                </h3>
                <p className="text-white/80 leading-relaxed">
                  {update.excerpt || update.content}
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm text-white/60">
                <button
                  onClick={() => handleLike(update.id)}
                  disabled={likeMutation.isPending}
                  className={`flex items-center gap-1 transition-colors ${
                    update.liked 
                      ? 'text-red-400' 
                      : 'hover:text-red-400'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${update.liked ? 'fill-current' : ''}`} />
                  {update.likes}
                </button>
                
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {update.comments}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}