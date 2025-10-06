'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Eye, Flag } from 'lucide-react';
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
  const { likePost, reportPost, likeState } = usePostMutations();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(() => 
    new Set(posts.filter(p => (p as any).liked).map(p => p.id))
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

  const handleReport = async (postId: string) => {
    await reportPost(postId);
    onMutation?.();
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <article
          key={post.id}
          className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${
            post.isPinned ? 'border-l-4 border-l-blue-500' : ''
          }`}
        >
          {/* Header */}
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
              {/* More options dropdown can be added here */}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            <Link href={`/community/${post.id}`} className="hover:text-blue-600">
              {post.title}
            </Link>
          </h2>

          {/* Content Preview */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {post.content}
          </p>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
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
                  locale: ko,
                })}
              </span>
            </div>

            <div className="flex items-center space-x-4">
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
                {/* This count should ideally be updated based on API response */}
                <span>{post._count.likes + (likedPosts.has(post.id) ? 1 : 0) - ((post as any).liked ? 1 : 0) }</span>
              </button>
              <div className="flex items-center space-x-1 text-gray-400">
                <MessageCircle className="h-4 w-4" />
                <span>{post._count.comments}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-400">
                <Eye className="h-4 w-4" />
                <span>0</span>{/* View count not available in data */}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
