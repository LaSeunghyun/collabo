'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { COMMUNITY_CATEGORY_LABELS } from '@/lib/constants/enums';

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryLabel = (categorySlug: string) => {
    return COMMUNITY_CATEGORY_LABELS[categorySlug as keyof typeof COMMUNITY_CATEGORY_LABELS] || categorySlug;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">커뮤니티</h1>
        <p className="text-neutral-600">자유롭게 소통하고 정보를 공유해보세요</p>
      </div>

      {/* 검색 및 필터 */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="게시글 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">검색</Button>
        </form>

        <div className="flex gap-4 items-center">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="popular">인기순</SelectItem>
              <SelectItem value="comments">댓글많음</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/community/new">
            <Button>글쓰기</Button>
          </Link>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="all">전체</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* 게시글 목록 */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-neutral-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-neutral-600">게시글이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {post.isPinned && (
                        <Badge variant="secondary" className="text-xs">
                          상단고정
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(post.categorySlug)}
                      </Badge>
                    </div>
                    <Link href={`/community/${post.id}`}>
                      <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors mb-2">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
                      {post.excerpt || post.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-neutral-500">
                  <div className="flex items-center gap-4">
                    <span>{post.authorName}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>조회 {post.viewCount}</span>
                    <span>좋아요 {post.likesCount}</span>
                    <span>댓글 {post.commentsCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
