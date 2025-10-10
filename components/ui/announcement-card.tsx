import React from 'react';
import Link from 'next/link';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'notice' | 'update' | 'event';
  priority: 'high' | 'normal' | 'low';
  isActive: boolean;
  publishedAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementCardProps {
  announcement: Announcement;
  onRead?: () => void;
}

export function AnnouncementCard({ announcement, onRead }: AnnouncementCardProps) {
  const handleClick = () => {
    if (onRead) {
      onRead();
    }
  };

  return (
    <article className="rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-white/20">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              announcement.priority === 'high' 
                ? 'bg-red-500/20 text-red-300' 
                : announcement.priority === 'normal'
                ? 'bg-blue-500/20 text-blue-300'
                : 'bg-gray-500/20 text-gray-300'
            }`}>
              {announcement.type === 'notice' ? '공지' : 
               announcement.type === 'update' ? '업데이트' : '이벤트'}
            </span>
            <span>/</span>
            <time dateTime={announcement.publishedAt}>
              {new Date(announcement.publishedAt).toLocaleDateString('ko-KR')}
            </time>
          </div>
          
          <h3 className="mt-2 text-lg font-semibold text-white">
            <Link
              href={`/announcements/${announcement.id}`}
              className="transition hover:text-primary"
              onClick={handleClick}
            >
              {announcement.title}
            </Link>
          </h3>
          
          <p className="mt-2 text-sm text-white/70 line-clamp-3">
            {announcement.content}
          </p>
        </div>
      </div>
    </article>
  );
}
