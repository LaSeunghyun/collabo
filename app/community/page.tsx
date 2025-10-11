'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Plus, TrendingUp, MessageSquare, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { PostCard } from '@/components/ui/community';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  authorName: string;
  authorAvatar: string;
  categoryName: string;
  categorySlug: string;
  attachments: any[];
  tags: string[];
  isPinned: boolean;
  viewCount: number;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

function CommunityPageContent() {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(1);

  // 카테고리 로드
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/community/categories');
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('카테고리 로드 오류:', error);
      }
    };

    fetchCategories();
  }, []);

  // 게시글 로드
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20',
          sort: sortBy,
        });

        if (selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const response = await fetch(`/api/community/posts?${params}`);
        const data = await response.json();

        if (data.success) {
          setPosts(data.posts);
        } else {
          setError(data.error || '게시글을 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('게시글 로드 오류:', error);
        setError('게시글을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [selectedCategory, sortBy, searchQuery, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };


  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 영역 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">커뮤니티</h1>
              <p className="text-neutral-400 text-lg">자유롭게 소통하고 정보를 공유해보세요</p>
            </div>
            <Link href="/community/new">
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                글쓰기
              </Button>
            </Link>
          </div>

          {/* 검색바 */}
          <form onSubmit={handleSearch} className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <Input
              placeholder="게시글 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg border-2 border-neutral-700 bg-neutral-800 text-white placeholder-neutral-400 focus:border-blue-500 rounded-xl"
            />
          </form>
        </div>

        {/* 카테고리 버튼들 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className={`${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
              }`}
            >
              전체
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.id)}
                className={`${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* 정렬 및 필터 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 border-2 border-neutral-200 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  최신순
                </SelectItem>
                <SelectItem value="popular" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  인기순
                </SelectItem>
                <SelectItem value="comments" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  댓글많음
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 게시글 목록 */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-neutral-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                      <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                      <div className="h-3 bg-neutral-200 rounded w-full"></div>
                    </div>
                    <div className="w-16 space-y-2">
                      <div className="h-4 bg-neutral-200 rounded"></div>
                      <div className="h-4 bg-neutral-200 rounded"></div>
                      <div className="h-4 bg-neutral-200 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="bg-white">
            <CardContent className="p-12 text-center">
              <div className="text-red-500 text-lg font-medium">{error}</div>
              <p className="text-neutral-500 mt-2">게시글을 불러오는 중 문제가 발생했습니다.</p>
            </CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="p-12 text-center">
              <div className="text-neutral-400 text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-neutral-700 mb-2">게시글이 없습니다</h3>
              <p className="text-neutral-500 mb-6">첫 번째 게시글을 작성해보세요!</p>
              <Link href="/community/new">
                <Button size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  글쓰기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* 상단고정글 */}
            {posts.filter(post => post.isPinned).map((post) => (
              <PostCard key={post.id} post={post} showRecommendBadge={true} />
            ))}
            
            {/* 일반 게시글 */}
            {posts.filter(post => !post.isPinned).map((post) => (
              <PostCard key={post.id} post={post} showRecommendBadge={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <CommunityPageContent />
    </Suspense>
  );
}
