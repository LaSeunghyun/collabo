'use client';

import { CommunityCategory } from '@/types/prisma';
import { usePostForm } from '@/hooks/use-post-form';

interface PostFormProps {
  projectId?: string;
  onSuccess?: (postId: string) => void;
  onCancel?: () => void;
}

const categoryOptions = [
  { value: CommunityCategory.GENERAL, label: '일반' },
  { value: CommunityCategory.QUESTION, label: '질문' },
  { value: CommunityCategory.REVIEW, label: '후기' },
  { value: CommunityCategory.SUGGESTION, label: '제안' },
  { value: CommunityCategory.NOTICE, label: '공지' },
  { value: CommunityCategory.COLLAB, label: '협업' },
  { value: CommunityCategory.SUPPORT, label: '지원' },
  { value: CommunityCategory.SHOWCASE, label: '쇼케이스' },
];

export function PostForm({ projectId, onSuccess, onCancel }: PostFormProps) {
  const {
    formData,
    errors,
    isSubmitting,
    handleSubmit,
    handleInputChange,
    handleTagAdd,
    handleTagRemove,
  } = usePostForm({ projectId, onSuccess });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {projectId ? '프로젝트 게시글 작성' : '커뮤니티 게시글 작성'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">카테고리 *</label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="제목을 입력하세요 (5-100자)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
            <div className="mt-1 flex justify-between text-sm text-gray-500">
              <span>{errors.title && <span className="text-red-600">{errors.title}</span>}</span>
              <span>{formData.title.length}/100</span>
            </div>
          </div>

          {/* Content Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">내용 *</label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="내용을 입력하세요 (10자 이상)"
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-1 flex justify-between text-sm text-gray-500">
              <span>{errors.content && <span className="text-red-600">{errors.content}</span>}</span>
              <span>{formData.content.length}자</span>
            </div>
          </div>

          {/* Hashtags Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">해시태그</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  #{tag}
                  <button type="button" onClick={() => handleTagRemove(tag)} className="ml-1 text-blue-600 hover:text-blue-800">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="해시태그를 입력하고 Enter를 누르세요"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTagAdd(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Anonymous Option (only for project posts) */}
          {projectId && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAnonymous"
                checked={formData.isAnonymous}
                onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isAnonymous" className="ml-2 text-sm text-gray-700">익명으로 게시하기</label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
              취소
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isSubmitting ? '작성 중...' : '게시글 작성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
