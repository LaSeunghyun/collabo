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
    const error = await response.json().catch(() => ({ message: 'ê³µì??¬í•­ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.' }));
    throw new Error(error.message ?? 'ê³µì??¬í•­ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
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
      setError('?œëª©ê³??´ìš©??ëª¨ë‘ ?…ë ¥?´ì£¼?¸ìš”.');
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
      <h2 className="text-xl font-semibold text-gray-900 mb-6">??ê³µì??¬í•­ ?‘ì„±</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            ?œëª©
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="ê³µì??¬í•­ ?œëª©???…ë ¥?˜ì„¸??
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            ì¹´í…Œê³ ë¦¬
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
            ?€??
          </label>
          <select
            id="targetAudience"
            value={formData.targetAudience}
            onChange={(e) => handleChange('targetAudience', e.target.value as 'ALL' | 'PARTNERS' | 'ARTISTS')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">?„ì²´</option>
            <option value="PARTNERS">?ŒíŠ¸??/option>
            <option value="ARTISTS">?„í‹°?¤íŠ¸</option>
          </select>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            ?´ìš©
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="ê³µì??¬í•­ ?´ìš©???…ë ¥?˜ì„¸??
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
            ?ë‹¨ ê³ ì •
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
            ì·¨ì†Œ
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? '?ì„± ì¤?..' : 'ê³µì??¬í•­ ?ì„±'}
          </button>
        </div>
      </form>
    </div>
  );
}
