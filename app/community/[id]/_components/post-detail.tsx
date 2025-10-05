'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Flag, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

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
  editedAt?: string;
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
    comments: number;
  };
}

interface PostDetailProps {
  post: Post;
  onLike?: () => void;
  onReport?: () => void;
  onDelete?: () => void;
}

const categoryLabels: Record<string, string> = {
  GENERAL: '일반',
  QUESTION: '질문',
  REVIEW: '후기',
  SUGGESTION: '제안',
  NOTICE: '공지',
  COLLAB: '협업',
  SUPPORT: '지원',
  SHOWCASE: '쇼케이스'
};

const categoryColors: Record<string, string> = {
  GENERAL: 'bg-gray-100 text-gray-800',
  QUESTION: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-green-100 text-green-800',
  SUGGESTION: 'bg-purple-100 text-purple-800',
  NOTICE: 'bg-red-100 text-red-800',
  COLLAB: 'bg-orange-100 text-orange-800',
  SUPPORT: 'bg-yellow-100 text-yellow-800',
  SHOWCASE: 'bg-pink-100 text-pink-800'
};

export function PostDetail({ post, onLike, onReport, onDelete }: PostDetailProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post._count.likes);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthor = session?.user?.id === post.author.id;
  const canReport = !isAuthor && session;

  const handleLike = async () => {
    if (!session) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
        onLike?.();
      } else {
        const error = await response.json();
        alert(error.message || '좋아요 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      alert('좋아요 처리에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = async () => {
    if (!session) {
      alert('로그인이 필요합니다.');
      return;
    }

    const reason = prompt('신고 사유를 입력해주세요:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/posts/${post.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert('신고가 접수되었습니다.');
        onReport?.();
      } else {
        const error = await response.json();
        alert(error.message || '신고 접수에 실패했습니다.');
      }
    } catch (error) {
      console.error('신고 접수 실패:', error);
      alert('신고 접수에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('게시글이 삭제되었습니다.');
        onDelete?.();
        router.push('/community');
      } else {
        const error = await response.json();
        alert(error.message || '게시글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  const handleEdit = () => {
    router.push(`/community/${post.id}/edit`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        뒤로가기
      </button>

      <article className="bg-white rounded-lg border border-gray-200 p-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                categoryColors[post.category] || categoryColors.GENERAL
              }`}
            >
              {categoryLabels[post.category] || post.category}
            </span>
            {post.isPinned && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                고정
              </span>
            )}
            {post.project && (
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                {post.project.title}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {canReport && (
              <button
                onClick={handleReport}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="신고"
              >
                <Flag className="h-4 w-4" />
              </button>
            )}
            {isAuthor && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleEdit}
                  className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                  title="수정"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        {/* 작성자 정보 */}
        <div className="flex items-center space-x-3 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.author.avatarUrl || '/default-avatar.png'}
            alt={post.author.name || '익명'}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <div className="font-medium text-gray-900">
              {post.isAnonymous ? '익명' : post.author.name || '익명'}
            </div>
            <div className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
                locale: ko
              })}
              {post.editedAt && (
                <span className="ml-2 text-gray-400">
                  (수정됨)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 내용 */}
        <div className="prose max-w-none mb-6">
          <div className="whitespace-pre-wrap text-gray-800">
            {post.content}
          </div>
        </div>

        {/* 상호작용 버튼 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span>{post._count.comments}</span>
            </button>
          </div>

          <div className="text-sm text-gray-500">
            신고 {post.reportsCount}건
          </div>
        </div>
      </article>
    </div>
  );
}
