'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Share, MoreHorizontal, Play, Pause } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

import type { CommunityPost, AttachmentMetadata, LinkPreviewMetadata } from '@/lib/data/community';
import { ThreadsImageGrid } from './ThreadsImageGrid';
import { MediaPlayer } from './MediaPlayer';
import { LinkPreview } from './LinkPreview';

interface ThreadsPostCardProps {
  post: CommunityPost;
  onToggleLike: () => void;
  isLiking: boolean;
  showThreadLine?: boolean;
}

export function ThreadsPostCard({ post, onToggleLike, isLiking, showThreadLine = true }: ThreadsPostCardProps) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);

  const authorName = post.author?.name ?? t('community.defaultGuestName');
  const createdAt = post.createdAt ? new Date(post.createdAt) : null;
  const timeAgo = createdAt ? getTimeAgo(createdAt) : '';

  const hasImages = post.images && post.images.length > 0 && post.images[0] !== 'RAY';
  const hasAttachments = post.attachments && post.attachments.length > 0;
  const hasLinkPreviews = post.linkPreviews && post.linkPreviews.length > 0;

  return (
    <article className="relative">
      {/* Thread line */}
      {showThreadLine && (
        <div className="absolute left-6 top-12 w-0.5 h-full bg-white/10" />
      )}
      
      <div className="flex gap-3 p-4 hover:bg-white/5 transition-colors">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            {post.author?.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={authorName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-primary">
                {authorName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white">{authorName}</span>
            <span className="text-white/60 text-sm">•</span>
            <time className="text-white/60 text-sm" dateTime={createdAt?.toISOString()}>
              {timeAgo}
            </time>
            <button className="ml-auto p-1 rounded-full hover:bg-white/10 transition-colors">
              <MoreHorizontal className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <p className="text-white/90 whitespace-pre-wrap break-words">
              {post.content}
            </p>

            {/* Images */}
            {hasImages && (
              <ThreadsImageGrid images={post.images} />
            )}

            {/* Attachments */}
            {hasAttachments && (
              <div className="space-y-2">
                {post.attachments?.map((attachment) => (
                  <MediaPlayer key={attachment.id} attachment={attachment} />
                ))}
              </div>
            )}

            {/* Link Previews */}
            {hasLinkPreviews && (
              <div className="space-y-2">
                {post.linkPreviews?.map((preview, index) => (
                  <LinkPreview key={index} preview={preview} />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6 mt-3">
            <button
              onClick={onToggleLike}
              disabled={isLiking}
              className={clsx(
                'flex items-center gap-2 text-sm transition-colors',
                post.liked
                  ? 'text-red-400'
                  : 'text-white/60 hover:text-red-400'
              )}
            >
              <Heart className={clsx('w-5 h-5', post.liked && 'fill-current')} />
              <span>{post.likes || 0}</span>
            </button>

            <Link
              href={`/community/${post.id}`}
              className="flex items-center gap-2 text-white/60 hover:text-blue-400 text-sm transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments || 0}</span>
            </Link>

            <button className="flex items-center gap-2 text-white/60 hover:text-green-400 text-sm transition-colors">
              <Share className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  return date.toLocaleDateString('ko-KR');
}
