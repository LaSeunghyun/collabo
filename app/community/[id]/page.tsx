'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Eye, Heart, MessageCircle, Share2, Bookmark, Flag, Edit, Trash2, User, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CategoryBadge } from '@/components/ui/community';

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
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 뒤로가기 버튼 */}
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6 gap-2 text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </Button>

        {/* 게시글 헤더 */}
        <Card className="mb-6 bg-white shadow-sm">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              {post.isPinned && (
                <Badge className="bg-red-500 text-white border-0">
                  상단고정
                </Badge>
              )}
              <CategoryBadge categorySlug={post.categorySlug} />
            </div>
            
            <h1 className="text-4xl font-bold text-neutral-900 mb-6 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex items-center justify-between text-sm text-neutral-600 mb-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{post.authorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.createdAt)}</span>
                  {post.updatedAt !== post.createdAt && (
                    <span className="text-neutral-500">(수정됨)</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span className="font-medium">{post.viewCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 게시글 내용 */}
        <Card className="mb-6 bg-white shadow-sm">
          <CardContent className="p-8">
            <div className="prose prose-lg max-w-none text-neutral-800">
              <div className="whitespace-pre-wrap leading-relaxed">{post.content}</div>
            </div>
            
            {post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-neutral-200">
                <h4 className="text-sm font-medium text-neutral-700 mb-3">태그</h4>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs px-3 py-1">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <Card className="mb-6 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="gap-2">
                  <Heart className="w-4 h-4" />
                  좋아요
                </Button>
                <Button variant="outline" size="lg" className="gap-2">
                  <Bookmark className="w-4 h-4" />
                  저장
                </Button>
                <Button variant="outline" size="lg" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  공유
                </Button>
                <Button variant="outline" size="lg" className="gap-2">
                  <Flag className="w-4 h-4" />
                  신고
                </Button>
              </div>
              
              {session?.user?.id === post.authorName && (
                <div className="flex gap-2">
                  <Button variant="outline" size="lg" className="gap-2">
                    <Edit className="w-4 h-4" />
                    수정
                  </Button>
                  <Button variant="outline" size="lg" className="gap-2 text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 댓글 섹션 */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              댓글 {comments.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* 댓글 작성 */}
            {session ? (
              <div className="bg-neutral-50 rounded-xl p-6">
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <Textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="댓글을 작성하세요..."
                    rows={4}
                    className="resize-none border-2 border-neutral-200 focus:border-blue-500 rounded-xl"
                  />
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={submittingComment || !commentContent.trim()}
                      size="lg"
                      className="gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {submittingComment ? '작성 중...' : '댓글 작성'}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-xl p-6 text-center">
                <p className="text-neutral-600 mb-4">댓글을 작성하려면 로그인이 필요합니다.</p>
                <Button variant="outline" onClick={() => router.push('/auth/signin')}>
                  로그인하기
                </Button>
              </div>
            )}

            {/* 댓글 목록 */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                  <p>아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-white border border-neutral-200 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {comment.authorName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-medium text-neutral-900">{comment.authorName}</span>
                          <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <span>{formatDate(comment.createdAt)}</span>
                            {comment.editedAt && (
                              <span>(수정됨)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="whitespace-pre-wrap text-neutral-800 mb-4">{comment.content}</div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Heart className="w-4 h-4" />
                        좋아요
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <MessageCircle className="w-4 h-4" />
                        답글
                      </Button>
                      {session?.user?.id === comment.authorName && (
                        <>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Edit className="w-4 h-4" />
                            수정
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                            삭제
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
