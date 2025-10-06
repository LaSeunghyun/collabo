'use client';

import { CommunityCategory } from '@/types/drizzle';
import { usePostForm } from '@/hooks/use-post-form';

interface PostFormProps {
  projectId?: string;
  onSuccess?: (postId: string) => void;
  onCancel?: () => void;
}

const categoryOptions = [
  { value: CommunityCategory.GENERAL, label: '?ºÎ∞ò' },
  { value: CommunityCategory.QUESTION, label: 'ÏßàÎ¨∏' },
  { value: CommunityCategory.REVIEW, label: '?ÑÍ∏∞' },
  { value: CommunityCategory.SUGGESTION, label: '?úÏïà' },
  { value: CommunityCategory.NOTICE, label: 'Í≥µÏ?' },
  { value: CommunityCategory.COLLAB, label: '?ëÏóÖ' },
  { value: CommunityCategory.SUPPORT, label: 'ÏßÄ?? },
  { value: CommunityCategory.SHOWCASE, label: '?ºÏ??¥Ïä§' },
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
          {projectId ? '?ÑÎ°ú?ùÌä∏ Í≤åÏãúÍ∏Ä ?ëÏÑ±' : 'Ïª§Î??àÌã∞ Í≤åÏãúÍ∏Ä ?ëÏÑ±'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ïπ¥ÌÖåÍ≥†Î¶¨ *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">?úÎ™© *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="?úÎ™©???ÖÎ†•?òÏÑ∏??(5-100??"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">?¥Ïö© *</label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="?¥Ïö©???ÖÎ†•?òÏÑ∏??(10???¥ÏÉÅ)"
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-1 flex justify-between text-sm text-gray-500">
              <span>{errors.content && <span className="text-red-600">{errors.content}</span>}</span>
              <span>{formData.content.length}??/span>
            </div>
          </div>

          {/* Hashtags Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">?¥Ïãú?úÍ∑∏</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  #{tag}
                  <button type="button" onClick={() => handleTagRemove(tag)} className="ml-1 text-blue-600 hover:text-blue-800">
                    √ó
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="?¥Ïãú?úÍ∑∏Î•??ÖÎ†•?òÍ≥† EnterÎ•??ÑÎ•¥?∏Ïöî"
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
              <label htmlFor="isAnonymous" className="ml-2 text-sm text-gray-700">?µÎ™Ö?ºÎ°ú Í≤åÏãú?òÍ∏∞</label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
              Ï∑®ÏÜå
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isSubmitting ? '?ëÏÑ± Ï§?..' : 'Í≤åÏãúÍ∏Ä ?ëÏÑ±'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
