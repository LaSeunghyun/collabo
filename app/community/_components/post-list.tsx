'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Flag, ThumbsDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

import { usePostMutations } from '@/hooks/use-post-mutations';

// NOTE: This Post interface is specific to the list view.
// It might differ from the global CommunityPost type.
interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  isAnonymous: boolean;
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

interface PostListProps {
  posts: Post[];
  // The parent component might want to refetch data on mutation
  onMutation?: () => void;
}

const categoryLabels: Record<string, string> = {
  GENERAL: '일반',
  QUESTION: '질문',
  REVIEW: '후기',
  SUGGESTION: '제안',
  NOTICE: '공지',
  COLLAB: '협업',
  SUPPORT: '지원',
  SHOWCASE: '쇼케이스',
};

const categoryColors: Record<string, string> = {
  GENERAL: 'bg-gray-100 text-gray-800',
  QUESTION: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-green-100 text-green-800',
  SUGGESTION: 'bg-purple-100 text-purple-800',
  NOTICE: 'bg-red-100 text-red-800',
  COLLAB: 'bg-orange-100 text-orange-800',
  SUPPORT: 'bg-yellow-100 text-yellow-800',
  SHOWCASE: 'bg-pink-100 text-pink-800',
};

export function PostList({ posts, onMutation }: PostListProps) {
  const { likePost, dislikePost, reportPost, likeState, dislikeState } = usePostMutations();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(() => 
    new Set(posts.filter(p => (p as any).liked).map(p => p.id))
  );
  const [dislikedPosts, setDislikedPosts] = useState<Set<string>>(() => 
    new Set(posts.filter(p => (p as any).disliked).map(p => p.id))
  );

  const handleLike = async (postId: string) => {
    const isLiked = likedPosts.has(postId);
    // Optimistic UI update
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    try {
      await likePost(postId, isLiked);
      onMutation?.(); // Notify parent to refetch if needed
    } catch {
      // Revert optimistic update on error
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
    }
  };

  const handleDislike = async (postId: string) => {
    const isDisliked = dislikedPosts.has(postId);
    // Optimistic UI update
    setDislikedPosts(prev => {
      const newSet = new Set(prev);
      if (isDisliked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    try {
      await dislikePost(postId, isDisliked);
      onMutation?.(); // Notify parent to refetch if needed
    } catch {
      // Revert optimistic update on error
      setDislikedPosts(prev => {
        const newSet = new Set(prev);
        if (isDisliked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
    }
  };

  const handleReport = async (postId: string) => {
    await reportPost(postId);
    onMutation?.();
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <article
          key={post.id}
          className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${
            post.isPinned ? 'border-l-4 border-l-blue-500' : ''
          }`}
        >
          {/* 간단한 한 줄 레이아웃: 카테고리 / 제목[댓글수] / 작성자 / 좋아요 / 싫어요 / 게재 시간 */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* 카테고리 */}
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                  categoryColors[post.category] || categoryColors.GENERAL
                }`}
              >
                {categoryLabels[post.category] || post.category}
              </span>
              
              {/* 제목[댓글수] */}
              <Link 
                href={`/community/${post.id}`} 
                className="font-semibold text-gray-900 hover:text-blue-600 truncate flex-1 min-w-0"
              >
                {post.title}
                <span className="text-gray-500 font-normal ml-1">
                  [{post._count.comments}]
                </span>
              </Link>
              
              {/* 작성자 */}
              <span className="text-gray-600 whitespace-nowrap">
                {post.isAnonymous ? '익명' : post.author.name || '익명'}
              </span>
            </div>

            <div className="flex items-center space-x-4 ml-4">
              {/* 좋아요 */}
              <button
                onClick={() => handleLike(post.id)}
                disabled={likeState.isLoading}
                className={`flex items-center space-x-1 transition-colors ${
                  likedPosts.has(post.id)
                    ? 'text-red-500'
                    : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className="h-4 w-4" />
                <span>{post._count.likes + (likedPosts.has(post.id) ? 1 : 0) - ((post as any).liked ? 1 : 0)}</span>
              </button>
              
              {/* 싫어요 */}
              <button
                onClick={() => handleDislike(post.id)}
                disabled={dislikeState.isLoading}
                className={`flex items-center space-x-1 transition-colors ${
                  dislikedPosts.has(post.id)
                    ? 'text-blue-500'
                    : 'text-gray-400 hover:text-blue-500'
                }`}
              >
                <ThumbsDown className="h-4 w-4" />
                <span>{post._count.dislikes || 0}</span>
              </button>
              
              {/* 게재 시간 */}
              <span className="text-gray-500 whitespace-nowrap">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>
              
              {/* 신고 버튼 */}
              <button
                onClick={() => handleReport(post.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="신고"
              >
                <Flag className="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}





