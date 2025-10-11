'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Plus, User, MessageSquare, Eye, Heart, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInHours < 48) return '어제';
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">커뮤니티</h1>
          <p className="text-neutral-400">아티스트들과 소통하고 정보를 공유해보세요</p>
        </div>

        {/* 검색 및 필터 */}
        <Card className="mb-6 bg-neutral-800 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 검색바 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="게시글 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400"
                />
              </div>

              {/* 카테고리 선택 */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 bg-neutral-700 border-neutral-600 text-white">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  <SelectItem value="all" className="text-white hover:bg-neutral-700">전체</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug} className="text-white hover:bg-neutral-700">
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 정렬 */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 bg-neutral-700 border-neutral-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  <SelectItem value="latest" className="text-white hover:bg-neutral-700">최신순</SelectItem>
                  <SelectItem value="popular" className="text-white hover:bg-neutral-700">인기순</SelectItem>
                  <SelectItem value="comments" className="text-white hover:bg-neutral-700">댓글순</SelectItem>
                </SelectContent>
              </Select>
              
              <Link href="/community/new">
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  글쓰기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 게시글 목록 */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-neutral-800 border-neutral-700">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-neutral-600 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-neutral-600 rounded w-3/4"></div>
                      <div className="h-3 bg-neutral-600 rounded w-1/2"></div>
                      <div className="h-3 bg-neutral-600 rounded w-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="bg-neutral-800 border-neutral-700">
            <CardContent className="p-12 text-center">
              <div className="text-red-400 text-lg font-medium">{error}</div>
              <p className="text-neutral-400 mt-2">게시글을 불러오는 중 문제가 발생했습니다.</p>
            </CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <Card className="bg-neutral-800 border-neutral-700">
            <CardContent className="p-12 text-center">
              <div className="text-neutral-400 text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-white mb-2">게시글이 없습니다</h3>
              <p className="text-neutral-400 mb-6">첫 번째 게시글을 작성해보세요!</p>
              <Link href="/community/new">
                <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-5 h-5" />
                  글쓰기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link key={post.id} href={`/community/${post.id}`} className="block group">
                <Card className="hover:shadow-lg transition-all duration-200 bg-neutral-800 border-neutral-700 group-hover:border-blue-500/50 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-neutral-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-neutral-400" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-white">{post.authorName}</span>
                          <span className="text-neutral-500">•</span>
                          <span className="text-sm text-neutral-400">{formatDate(post.createdAt)}</span>
                          {post.isPinned && (
                            <Badge variant="secondary" className="ml-2 bg-blue-900/30 text-blue-400 border-blue-700">
                              상단고정
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-neutral-400 text-sm line-clamp-2 mb-3">
                          {post.excerpt || post.content}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-neutral-400">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{post.viewCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              <span>{post.likesCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{post.commentsCount}</span>
                            </div>
                          </div>
                          
                          {post.tags.length > 0 && (
                            <div className="flex gap-1">
                              {post.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs border-neutral-600 text-neutral-300">
                                  #{tag}
                                </Badge>
                              ))}
                              {post.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-300">
                                  +{post.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <CommunityPageContent />
    </Suspense>
  );
}