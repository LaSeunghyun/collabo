'use client';

import { Eye, Heart, MessageCircle } from 'lucide-react';

interface PostStatsProps {
  viewCount: number;
  likesCount: number;
  commentsCount: number;
  className?: string;
}

export function PostStats({ 
  viewCount, 
  likesCount, 
  commentsCount, 
  className = '' 
}: PostStatsProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-sm text-neutral-600">
        <Eye className="w-4 h-4" />
        <span className="font-medium">{viewCount}</span>
      </div>
      
      <div className="flex items-center gap-1 text-sm text-neutral-600">
        <Heart className="w-4 h-4" />
        <span className="font-medium">{likesCount}</span>
      </div>
      
      <div className="flex items-center gap-1 text-sm text-neutral-600">
        <MessageCircle className="w-4 h-4" />
        <span className="font-medium">{commentsCount}</span>
      </div>
    </div>
  );
}
