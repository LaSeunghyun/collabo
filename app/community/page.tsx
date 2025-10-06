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
  { value: '', label: '?„ì²´' },
  { value: CommunityCategory.GENERAL, label: '?¼ë°˜' },
  { value: CommunityCategory.QUESTION, label: 'ì§ˆë¬¸' },
  { value: CommunityCategory.REVIEW, label: '?„ê¸°' },
  { value: CommunityCategory.SUGGESTION, label: '?œì•ˆ' },
  { value: CommunityCategory.NOTICE, label: 'ê³µì?' },
  { value: CommunityCategory.COLLAB, label: '?‘ì—…' },
  { value: CommunityCategory.SUPPORT, label: 'ì§€?? },
  { value: CommunityCategory.SHOWCASE, label: '?¼ì??´ìŠ¤' }
];

const sortOptions = [
  { value: 'latest', label: 'ìµœì‹ ?? },
  { value: 'popular', label: '?¸ê¸°?? },
  { value: 'comments', label: '?“ê??? }
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
        throw new Error('ê²Œì‹œê¸€??ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
      }

      const data: PostsResponse = await response.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (error) {
      console.error('ê²Œì‹œê¸€ ë¡œë“œ ?¤íŒ¨:', error);
      setError(error instanceof Error ? error.message : 'ê²Œì‹œê¸€??ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.');
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
      {/* ?¤ë” */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ì»¤ë??ˆí‹°</h1>
        <p className="text-gray-600">?„í‹°?¤íŠ¸?€ ?¬ë“¤???Œí†µ?˜ëŠ” ê³µê°„?…ë‹ˆ??</p>
      </div>

      {/* ?„í„° ë°?ê²€??*/}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* ì¹´í…Œê³ ë¦¬ ?„í„° */}
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

          {/* ?•ë ¬ ?µì…˜ */}
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

          {/* ê²€??*/}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ê²Œì‹œê¸€ ê²€??.."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* ê¸€?°ê¸° ë²„íŠ¼ */}
          <div className="ml-auto">
            <Link
              href="/community/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              ê¸€?°ê¸°
            </Link>
          </div>
        </div>
      </div>

      {/* ê²Œì‹œê¸€ ëª©ë¡ */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">ê²Œì‹œê¸€??ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPosts}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ?¤ì‹œ ?œë„
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">ê²Œì‹œê¸€???†ìŠµ?ˆë‹¤.</p>
          <Link
            href="/community/new"
            className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            ì²?ê²Œì‹œê¸€ ?‘ì„±?˜ê¸°
          </Link>
        </div>
      ) : (
        <>
          <PostList
            posts={posts}
          />

          {/* ?˜ì´ì§€?¤ì´??*/}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ?´ì „
                </button>
                <span className="px-3 py-2 text-sm text-gray-600">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ?¤ìŒ
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
