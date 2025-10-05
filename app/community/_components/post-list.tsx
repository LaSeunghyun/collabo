'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Heart, MessageCircle, Eye, Flag, MoreHorizontal } from 'lucide-react';
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

interface PostListProps {
  posts: Post[];
  onLike?: (postId: string) => void;
  onReport?: (postId: string) => void;
  // onDelete?: (postId: string) => void;
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

export function PostList({ posts, onLike, onReport }: PostListProps) {
  const { data: session } = useSession();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const handleLike = async (postId: string) => {
    if (!session) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const isLiked = likedPosts.has(postId);
      const method = isLiked ? 'DELETE' : 'POST';
      
      const response = await fetch(`/api/posts/${postId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (isLiked) {
            newSet.delete(postId);
          } else {
            newSet.add(postId);
          }
          return newSet;
        });
        onLike?.(postId);
      } else {
        const error = await response.json();
        alert(error.message || '좋아요 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  const handleReport = async (postId: string) => {
    if (!session) {
      alert('로그인이 필요합니다.');
      return;
    }

    const reason = prompt('신고 사유를 입력해주세요:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/posts/${postId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert('신고가 접수되었습니다.');
        onReport?.(postId);
      } else {
        const error = await response.json();
        alert(error.message || '신고 접수에 실패했습니다.');
      }
    } catch (error) {
      console.error('신고 접수 실패:', error);
      alert('신고 접수에 실패했습니다.');
    }
  };

  // const handleDelete = async (postId: string) => {
  //   if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

  //   try {
  //     const response = await fetch(`/api/posts/${postId}`, {
  //       method: 'DELETE'
  //     });

  //     if (response.ok) {
  //       alert('게시글이 삭제되었습니다.');
  //       onDelete?.(postId);
  //     } else {
  //       const error = await response.json();
  //       alert(error.message || '게시글 삭제에 실패했습니다.');
  //     }
  //   } catch (error) {
  //     console.error('게시글 삭제 실패:', error);
  //     alert('게시글 삭제에 실패했습니다.');
  //   }
  // };

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <article
          key={post.id}
          className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${
            post.isPinned ? 'border-l-4 border-l-blue-500' : ''
          }`}
        >
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
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
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleReport(post.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="신고"
              >
                <Flag className="h-4 w-4" />
              </button>
              {session?.user?.id === post.author.id && (
                <div className="relative">
                  <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {/* 드롭다운 메뉴는 추후 구현 */}
                </div>
              )}
            </div>
          </div>

          {/* 제목 */}
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            <Link href={`/community/${post.id}`} className="hover:text-blue-600">
              {post.title}
            </Link>
          </h2>

          {/* 내용 미리보기 */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {post.content}
          </p>

          {/* 메타 정보 */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.author.avatarUrl || '/default-avatar.png'}
                  alt={post.author.name || '익명'}
                  className="w-6 h-6 rounded-full"
                />
                <span>
                  {post.isAnonymous ? '익명' : post.author.name || '익명'}
                </span>
              </div>
              <span>
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                  locale: ko
                })}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center space-x-1 transition-colors ${
                  likedPosts.has(post.id)
                    ? 'text-red-500'
                    : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className="h-4 w-4" />
                <span>{post._count.likes}</span>
              </button>
              <div className="flex items-center space-x-1 text-gray-400">
                <MessageCircle className="h-4 w-4" />
                <span>{post._count.comments}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-400">
                <Eye className="h-4 w-4" />
                <span>0</span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
