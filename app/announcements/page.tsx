'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Calendar, Pin, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

const CATEGORY_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'GENERAL', label: '일반' },
  { value: 'SYSTEM', label: '시스템' },
  { value: 'MAINTENANCE', label: '점검' },
  { value: 'EVENT', label: '이벤트' },
  { value: 'UPDATE', label: '업데이트' }
] as const;

export default function AnnouncementsPage() {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, [selectedCategory]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }

      const response = await fetch(`/api/announcements?${params.toString()}`);
      if (!response.ok) {
        throw new Error('공지사항을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('공지사항 로드 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    if (!searchQuery) return true;
    return announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SYSTEM': return 'text-blue-400 bg-blue-500/10';
      case 'MAINTENANCE': return 'text-yellow-400 bg-yellow-500/10';
      case 'EVENT': return 'text-green-400 bg-green-500/10';
      case 'UPDATE': return 'text-purple-400 bg-purple-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getCategoryLabel = (category: string) => {
    const option = CATEGORY_OPTIONS.find(opt => opt.value === category);
    return option?.label || category;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">공지사항</h1>
            <p className="mt-2 text-white/70">플랫폼의 최신 소식을 확인하세요</p>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="animate-pulse">
                  <div className="h-6 w-3/4 rounded bg-white/10 mb-2" />
                  <div className="h-4 w-1/2 rounded bg-white/10 mb-4" />
                  <div className="h-20 w-full rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">공지사항</h1>
          <p className="mt-2 text-white/70">플랫폼의 최신 소식을 확인하세요</p>
        </div>

        {/* 검색 및 필터 */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="공지사항 검색..."
                className="w-full rounded-full border border-white/10 bg-neutral-950/60 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
            >
              <Filter className="h-4 w-4" />
              필터
            </button>
          </div>

          {/* 필터 옵션 */}
          {showFilters && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">카테고리</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-neutral-950/60 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                >
                  {CATEGORY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 공지사항 목록 */}
        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <p className="text-red-300">{error}</p>
            <button
              onClick={loadAnnouncements}
              className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              다시 시도
            </button>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/60">표시할 공지사항이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <Link
                key={announcement.id}
                href={`/announcements/${announcement.id}`}
                className="group block rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/10"
              >
                <div className="space-y-4">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {announcement.isPinned && (
                          <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400">
                            <Pin className="h-3 w-3" />
                            고정
                          </span>
                        )}
                        <span className={clsx(
                          'rounded-full px-2 py-1 text-xs font-medium',
                          getCategoryColor(announcement.category)
                        )}>
                          {getCategoryLabel(announcement.category)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-primary transition">
                        {announcement.title}
                      </h3>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-white transition" />
                  </div>

                  {/* 내용 미리보기 */}
                  <p className="line-clamp-3 text-sm text-white/70">
                    {announcement.content}
                  </p>

                  {/* 메타 정보 */}
                  <div className="flex items-center gap-4 text-xs text-white/60">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(announcement.publishedAt || announcement.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{announcement.author.name}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
