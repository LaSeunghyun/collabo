'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Post {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorAvatar: string;
  categoryName: string;
  categorySlug: string;
  attachments: any[];
  tags: string[];
  isPinned: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorAvatar: string;
  parentCommentId: string | null;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  isDeleted: boolean;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const postId = params.id as string;

  // 게시글 로드
  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/community/posts/${postId}`);
        const data = await response.json();

        if (data.success) {
          setPost(data.post);
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

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // 댓글 로드
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/community/posts/${postId}/comments`);
        const data = await response.json();

        if (data.success) {
          setComments(data.comments);
        }
      } catch (error) {
        console.error('댓글 로드 오류:', error);
      }
    };

    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !commentContent.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: commentContent.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCommentContent('');
        // 댓글 목록 새로고침
        const commentsResponse = await fetch(`/api/community/posts/${postId}/comments`);
        const commentsData = await commentsResponse.json();
        if (commentsData.success) {
          setComments(commentsData.comments);
        }
      } else {
        alert(data.error || '댓글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-3/4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error || '게시글을 찾을 수 없습니다.'}</p>
            <Button onClick={() => router.back()} className="mt-4">
              돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 게시글 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          {post.isPinned && (
            <Badge variant="secondary">상단고정</Badge>
          )}
          <Badge variant="outline">{getCategoryLabel(post.categorySlug)}</Badge>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        
        <div className="flex items-center justify-between text-sm text-neutral-600 mb-6">
          <div className="flex items-center gap-4">
            <span>{post.authorName}</span>
            <span>{formatDate(post.createdAt)}</span>
            {post.updatedAt !== post.createdAt && (
              <span className="text-neutral-500">(수정됨)</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>조회 {post.viewCount}</span>
          </div>
        </div>
      </div>

      {/* 게시글 내용 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap">{post.content}</div>
          </div>
          
          {post.tags.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex gap-2 mb-6">
        <Button variant="outline" size="sm">
          좋아요
        </Button>
        <Button variant="outline" size="sm">
          저장
        </Button>
        <Button variant="outline" size="sm">
          신고
        </Button>
        {session?.user?.id === post.authorName && (
          <>
            <Button variant="outline" size="sm">
              수정
            </Button>
            <Button variant="outline" size="sm">
              삭제
            </Button>
          </>
        )}
      </div>

      <Separator className="mb-6" />

      {/* 댓글 섹션 */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">댓글 {comments.length}</h2>

        {/* 댓글 작성 */}
        {session ? (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <Textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="댓글을 작성하세요..."
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={submittingComment || !commentContent.trim()}>
                    {submittingComment ? '작성 중...' : '댓글 작성'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-neutral-600">댓글을 작성하려면 로그인이 필요합니다.</p>
            </CardContent>
          </Card>
        )}

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{comment.authorName}</span>
                    <span className="text-sm text-neutral-500">
                      {formatDate(comment.createdAt)}
                    </span>
                    {comment.editedAt && (
                      <span className="text-sm text-neutral-500">(수정됨)</span>
                    )}
                  </div>
                </div>
                <div className="whitespace-pre-wrap">{comment.content}</div>
                <div className="flex gap-2 mt-3">
                  <Button variant="ghost" size="sm">
                    좋아요
                  </Button>
                  <Button variant="ghost" size="sm">
                    답글
                  </Button>
                  {session?.user?.id === comment.authorName && (
                    <>
                      <Button variant="ghost" size="sm">
                        수정
                      </Button>
                      <Button variant="ghost" size="sm">
                        삭제
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
