'use client';

import Link from 'next/link';
import { Eye, Heart, MessageCircle, Calendar, User } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CategoryBadge } from './CategoryBadge';
import { RecommendBadge } from './RecommendBadge';
import { PostStats } from './PostStats';

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

interface PostCardProps {
  post: Post;
  showRecommendBadge?: boolean;
}

export function PostCard({ post, showRecommendBadge = true }: PostCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-0 bg-white">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* 좌측: 추천글 배지 및 날짜 */}
          <div className="flex flex-col items-center gap-2 min-w-[60px]">
            {showRecommendBadge && post.isPinned && (
              <RecommendBadge count={post.likesCount} />
            )}
            <div className="text-xs text-neutral-500 font-medium">
              {formatDate(post.createdAt)}
            </div>
          </div>

          {/* 중앙: 메인 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CategoryBadge categorySlug={post.categorySlug} />
              {post.tags.length > 0 && (
                <div className="flex gap-1">
                  {post.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs px-2 py-0.5"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Link href={`/community/${post.id}`} className="block group">
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                {post.title}
              </h3>
              <p className="text-neutral-600 text-sm line-clamp-2 mb-3">
                {post.excerpt || post.content}
              </p>
            </Link>

            <div className="flex items-center gap-4 text-sm text-neutral-500">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{post.authorName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatFullDate(post.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* 우측: 통계 정보 */}
          <div className="flex flex-col items-end gap-2 min-w-[80px]">
            <PostStats
              viewCount={post.viewCount}
              likesCount={post.likesCount}
              commentsCount={post.commentsCount}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
