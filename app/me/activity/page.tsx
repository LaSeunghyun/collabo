'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  scope: string;
  categoryName: string;
  categorySlug: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  publishedAt: string;
}

interface Comment {
  id: string;
  content: string;
  postId: string;
  postTitle: string;
  postScope: string;
  parentCommentId: string | null;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
}

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  postTitle: string;
  postScope: string;
  postAuthorName: string;
}

export default function MyActivityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('posts');
  const [scope, setScope] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    posts: Post[];
    comments: Comment[];
    likes: Post[];
    bookmarks: Post[];
    reports: Report[];
  }>({
    posts: [],
    comments: [],
    likes: [],
    bookmarks: [],
    reports: [],
  });

  // 로그인 확인
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin?callbackUrl=/me/activity');
    }
  }, [session, status, router]);

  // 데이터 로드
  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [postsRes, commentsRes, likesRes, bookmarksRes, reportsRes] = await Promise.all([
          fetch(`/api/me/activity/posts?scope=${scope}`),
          fetch(`/api/me/activity/comments?scope=${scope}`),
          fetch(`/api/me/activity/likes?scope=${scope}`),
          fetch(`/api/me/activity/bookmarks?scope=${scope}`),
          fetch('/api/me/activity/reports'),
        ]);

        const [postsData, commentsData, likesData, bookmarksData, reportsData] = await Promise.all([
          postsRes.json(),
          commentsRes.json(),
          commentsRes.json(),
          bookmarksRes.json(),
          reportsRes.json(),
        ]);

        setData({
          posts: postsData.success ? postsData.posts : [],
          comments: commentsData.success ? commentsData.comments : [],
          likes: likesData.success ? likesData.posts : [],
          bookmarks: bookmarksData.success ? bookmarksData.posts : [],
          reports: reportsData.success ? reportsData.reports : [],
        });
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, scope]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScopeLabel = (scope: string) => {
    const labels: Record<string, string> = {
      'GLOBAL': '전체게시판',
      'PROJECT': '프로젝트',
      'ALL': '전체',
    };
    return labels[scope] || scope;
  };

  const getCategoryLabel = (categorySlug: string) => {
    const labels: Record<string, string> = {
      'FREE': '자유',
      'QUESTION': '질문',
      'REVIEW': '후기',
      'SUGGESTION': '제안',
      'RECRUITMENT': '모집',
      'TRADE': '거래',
      'INFO_SHARE': '정보공유',
    };
    return labels[categorySlug] || categorySlug;
  };

  if (status === 'loading') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">내 활동</h1>
        <p className="text-neutral-600">내가 작성한 글, 댓글, 좋아요, 저장글을 확인할 수 있습니다</p>
      </div>

      {/* 범위 선택 */}
      <div className="mb-6">
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            <SelectItem value="GLOBAL">전체게시판</SelectItem>
            <SelectItem value="PROJECT">프로젝트</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="posts">내가 쓴 글</TabsTrigger>
          <TabsTrigger value="comments">댓글</TabsTrigger>
          <TabsTrigger value="likes">좋아요</TabsTrigger>
          <TabsTrigger value="bookmarks">저장글</TabsTrigger>
          <TabsTrigger value="reports">신고 내역</TabsTrigger>
        </TabsList>

        {/* 내가 쓴 글 */}
        <TabsContent value="posts">
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : data.posts.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-neutral-600">작성한 글이 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              data.posts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{getCategoryLabel(post.categorySlug)}</Badge>
                          <Badge variant="secondary">{getScopeLabel(post.scope)}</Badge>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
                          {post.excerpt || post.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-neutral-500">
                      <span>{formatDate(post.createdAt)}</span>
                      <div className="flex items-center gap-4">
                        <span>조회 {post.viewCount}</span>
                        <span>좋아요 {post.likeCount}</span>
                        <span>댓글 {post.commentCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* 댓글 */}
        <TabsContent value="comments">
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : data.comments.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-neutral-600">작성한 댓글이 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              data.comments.map((comment) => (
                <Card key={comment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{getScopeLabel(comment.postScope)}</Badge>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{comment.postTitle}</h3>
                        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-neutral-500">
                      <span>{formatDate(comment.createdAt)}</span>
                      {comment.editedAt && (
                        <span className="text-neutral-500">(수정됨)</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* 좋아요 */}
        <TabsContent value="likes">
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : data.likes.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-neutral-600">좋아요한 글이 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              data.likes.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{getCategoryLabel(post.categorySlug)}</Badge>
                          <Badge variant="secondary">{getScopeLabel(post.scope)}</Badge>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
                          {post.excerpt || post.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-neutral-500">
                      <span>{formatDate(post.createdAt)}</span>
                      <div className="flex items-center gap-4">
                        <span>조회 {post.viewCount}</span>
                        <span>좋아요 {post.likeCount}</span>
                        <span>댓글 {post.commentCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* 저장글 */}
        <TabsContent value="bookmarks">
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : data.bookmarks.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-neutral-600">저장한 글이 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              data.bookmarks.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{getCategoryLabel(post.categorySlug)}</Badge>
                          <Badge variant="secondary">{getScopeLabel(post.scope)}</Badge>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
                          {post.excerpt || post.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-neutral-500">
                      <span>{formatDate(post.createdAt)}</span>
                      <div className="flex items-center gap-4">
                        <span>조회 {post.viewCount}</span>
                        <span>좋아요 {post.likeCount}</span>
                        <span>댓글 {post.commentCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* 신고 내역 */}
        <TabsContent value="reports">
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : data.reports.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-neutral-600">신고 내역이 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              data.reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{report.targetType}</Badge>
                          <Badge variant="secondary">{getScopeLabel(report.postScope)}</Badge>
                          <Badge variant={report.status === 'DISMISSED' ? 'destructive' : 'default'}>
                            {report.status}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{report.postTitle}</h3>
                        <p className="text-neutral-600 text-sm mb-3">
                          신고 사유: {report.reason}
                        </p>
                        {report.postAuthorName && (
                          <p className="text-sm text-neutral-500">
                            작성자: {report.postAuthorName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-neutral-500">
                      <span>{formatDate(report.createdAt)}</span>
                      {report.resolvedAt && (
                        <span>처리됨: {formatDate(report.resolvedAt)}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
