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
  GENERAL: '?¼ë°˜',
  QUESTION: 'ì§ˆë¬¸',
  REVIEW: '?„ê¸°',
  SUGGESTION: '?œì•ˆ',
  NOTICE: 'ê³µì?',
  COLLAB: '?‘ì—…',
  SUPPORT: 'ì§€??,
  SHOWCASE: '?¼ì??´ìŠ¤',
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
          {/* ê°„ë‹¨????ì¤??ˆì´?„ì›ƒ: ì¹´í…Œê³ ë¦¬ / ?œëª©[?“ê??? / ?‘ì„±??/ ì¢‹ì•„??/ ?«ì–´??/ ê²Œì¬ ?œê°„ */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* ì¹´í…Œê³ ë¦¬ */}
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                  categoryColors[post.category] || categoryColors.GENERAL
                }`}
              >
                {categoryLabels[post.category] || post.category}
              </span>
              
              {/* ?œëª©[?“ê??? */}
              <Link 
                href={`/community/${post.id}`} 
                className="font-semibold text-gray-900 hover:text-blue-600 truncate flex-1 min-w-0"
              >
                {post.title}
                <span className="text-gray-500 font-normal ml-1">
                  [{post._count.comments}]
                </span>
              </Link>
              
              {/* ?‘ì„±??*/}
              <span className="text-gray-600 whitespace-nowrap">
                {post.isAnonymous ? '?µëª…' : post.author.name || '?µëª…'}
              </span>
            </div>

            <div className="flex items-center space-x-4 ml-4">
              {/* ì¢‹ì•„??*/}
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
              
              {/* ?«ì–´??*/}
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
              
              {/* ê²Œì¬ ?œê°„ */}
              <span className="text-gray-500 whitespace-nowrap">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>
              
              {/* ? ê³  ë²„íŠ¼ */}
              <button
                onClick={() => handleReport(post.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="? ê³ "
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





