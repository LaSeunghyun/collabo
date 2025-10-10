'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAnnouncementRead } from '@/hooks/use-announcement-read';
import { AnnouncementCard } from '@/components/ui/announcement-card';
import { AnnouncementFilters } from '@/components/ui/announcement-filters';
import { AnnouncementPagination } from '@/components/ui/announcement-pagination';

const FILTERS = [
  { label: '전체', value: 'all' },
  { label: '공지사항', value: 'notice' },
  { label: '업데이트', value: 'update' },
  { label: '이벤트', value: 'event' }
] as const;

type FilterValue = typeof FILTERS[number]['value'];

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

interface AnnouncementsPageProps {
  announcements: Announcement[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  unreadCount: number;
}

export default function AnnouncementsPage({
  announcements,
  totalCount,
  currentPage,
  totalPages,
  unreadCount
}: AnnouncementsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<FilterValue>('all');
  const { markAsRead } = useAnnouncementRead();

  const handleFilterChange = (filter: FilterValue) => {
    setSelectedCategory(filter);
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    if (selectedCategory === 'all') return true;
    return announcement.type === selectedCategory;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16">
      <header className="flex flex-col gap-3 py-12">
        <div className="flex items-center gap-2 text-sm text-blue-300/80">
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
            공지
          </span>
          {unreadCount > 0 ? <span>읽지 않은 공지 {unreadCount}개</span> : <span>모든 공지를 읽었습니다</span>}
        </div>
        <h1 className="text-3xl font-semibold text-white">공지사항</h1>
        <p className="text-sm text-neutral-300">
          Collaborium의 최신 소식, 정책 변경사항, 이벤트 정보를 확인하세요.
        </p>
      </header>

      <section className="mb-10 flex flex-wrap gap-3">
        {FILTERS.map((filter) => {
          const isActive = selectedCategory === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => handleFilterChange(filter.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </section>

      <section className="space-y-6">
        {filteredAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-neutral-800 p-4">
              <svg
                className="h-8 w-8 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">공지사항이 없습니다</h3>
            <p className="text-sm text-neutral-400">
              {selectedCategory === 'all' 
                ? '아직 등록된 공지사항이 없습니다.'
                : '해당 카테고리에 공지사항이 없습니다.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onRead={() => markAsRead(announcement.id)}
              />
            ))}
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <AnnouncementPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            // 페이지 변경 로직 구현
            console.log('Page changed to:', page);
          }}
        />
      )}
    </div>
  );
}