'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { PostList } from './_components/post-list';
import { CommunityCategory } from '@/types/drizzle';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  isAnonymous: boolean;
  likesCount: number;
  reportsCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  project?: {
    id: string;
    title: string;
  };
  _count: {
    likes: number;
    dislikes: number;
    comments: number;
  };
}

interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const categoryOptions = [
  { value: '', label: '전체' },
  { value: CommunityCategory.GENERAL, label: '일반' },
  { value: CommunityCategory.QUESTION, label: '질문' },
  { value: CommunityCategory.REVIEW, label: '후기' },
  { value: CommunityCategory.SUGGESTION, label: '제안' },
  { value: CommunityCategory.NOTICE, label: '공지' },
  { value: CommunityCategory.COLLAB, label: '협업' },
  { value: CommunityCategory.SUPPORT, label: '지원' },
  { value: CommunityCategory.SHOWCASE, label: '쇼케이스' }
];

const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'comments', label: '댓글순' }
];

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    sort: 'latest',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort: filters.sort
      });

      if (filters.category) {
        params.append('category', filters.category);
      }

      if (filters.search) {
        params.append('search', filters.search);
      }

      const response = await fetch(`/api/posts?${params}`);
      
      if (!response.ok) {
        throw new Error('게시글을 불러올 수 없습니다.');
      }

      const data: PostsResponse = await response.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      setError(error instanceof Error ? error.message : '게시글을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filters, pagination.page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };



  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">커뮤니티</h1>
        <p className="text-gray-600">아티스트와 팬들이 소통하는 공간입니다.</p>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* 카테고리 필터 */}
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* 정렬 옵션 */}
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* 검색 */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="게시글 검색..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 글쓰기 버튼 */}
          <div className="ml-auto">
            <Link
              href="/community/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              글쓰기
            </Link>
          </div>
        </div>
      </div>

      {/* 게시글 목록 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">게시글을 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPosts}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">게시글이 없습니다.</p>
          <Link
            href="/community/new"
            className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            첫 게시글 작성하기
          </Link>
        </div>
      ) : (
        <>
          <PostList
            posts={posts}
          />

          {/* 페이지네이션 */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  이전
                </button>
                <span className="px-3 py-2 text-sm text-gray-600">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
