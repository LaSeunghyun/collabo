'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  ANNOUNCEMENT_CATEGORIES,
  DEFAULT_ANNOUNCEMENT_CATEGORY,
  type AnnouncementCategory
} from '@/lib/constants/announcements';

interface AnnouncementComposerProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface CreateAnnouncementData {
  title: string;
  content: string;
  category: AnnouncementCategory;
  isPinned: boolean;
  targetAudience: 'ALL' | 'PARTNERS' | 'ARTISTS';
}

async function createAnnouncement(data: CreateAnnouncementData) {
  const response = await fetch('/api/announcements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '공지사항 생성에 실패했습니다.' }));
    throw new Error(error.message ?? '공지사항 생성에 실패했습니다.');
  }

  return response.json();
}

export default function AnnouncementComposer({ onSuccess, onCancel }: AnnouncementComposerProps) {
  const [formData, setFormData] = useState<CreateAnnouncementData>({
    title: '',
    content: '',
    category: DEFAULT_ANNOUNCEMENT_CATEGORY,
    isPinned: false,
    targetAudience: 'ALL'
  });
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setError(null);
    createMutation.mutate(formData);
  };

  const handleChange = (field: keyof CreateAnnouncementData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">새 공지사항 생성</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            제목
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="공지사항 제목을 입력하세요"
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            카테고리
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value as AnnouncementCategory)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ANNOUNCEMENT_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-2">
            대상
          </label>
          <select
            id="targetAudience"
            value={formData.targetAudience}
            onChange={(e) => handleChange('targetAudience', e.target.value as 'ALL' | 'PARTNERS' | 'ARTISTS')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">전체</option>
            <option value="PARTNERS">파트너</option>
            <option value="ARTISTS">아티스트</option>
          </select>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            내용
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="공지사항 내용을 입력하세요"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPinned"
            checked={formData.isPinned}
            onChange={(e) => handleChange('isPinned', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isPinned" className="ml-2 block text-sm text-gray-700">
            상단 고정
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? '생성 중...' : '공지사항 생성'}
          </button>
        </div>
      </form>
    </div>
  );
}