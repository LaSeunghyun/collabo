import Link from 'next/link';

import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_CATEGORY_LABELS,
  type AnnouncementCategory
} from '@/lib/constants/announcements';
import { getServerAuthSession } from '@/lib/auth/session';
import { getAnnouncements } from '@/lib/server/announcements';

const DATE_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const FILTERS = [{ value: 'all', label: '전체' }, ...ANNOUNCEMENT_CATEGORIES];

const getCategoryLabel = (category: string) =>
  ANNOUNCEMENT_CATEGORY_LABELS[category as AnnouncementCategory] ?? category;

const formatDate = (date: Date | null) =>
  date ? DATE_FORMATTER.format(typeof date === 'string' ? new Date(date) : date) : '발행 예정';

export default async function AnnouncementsPage({
  searchParams
}: {
  searchParams?: { category?: string };
}) {
  const selectedCategory =
    typeof searchParams?.category === 'string' ? searchParams.category : 'all';

  const session = await getServerAuthSession();
  const { announcements, unreadCount } = await getAnnouncements({
    userId: session?.user?.id ?? null,
    category: selectedCategory === 'all' ? null : selectedCategory
  });

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16">
      <header className="flex flex-col gap-3 py-12">
        <div className="flex items-center gap-2 text-sm text-blue-300/80">
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
            공지
          </span>
          {unreadCount > 0 ? <span>읽지 않은 공지 {unreadCount}개</span> : <span>모든 정보를 확인했습니다</span>}
        </div>
        <h1 className="text-3xl font-semibold text-white">플랫폼 공지사항</h1>
        <p className="text-sm text-neutral-300">
          Collaborium의 최신 소식, 정책 변경 및 이벤트 정보를 먼저 확인하세요.
        </p>
      </header>

      <section className="mb-10 flex flex-wrap gap-3">
        {FILTERS.map((filter) => {
          const isActive = selectedCategory === filter.value;
          return (
            <Link
              key={filter.value}
              href={filter.value === 'all' ? '/announcements' : `/announcements?category=${filter.value}`}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                isActive
                  ? 'border-blue-400 bg-blue-500/10 text-blue-200'
                  : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white'
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </section>

      <section>
        {announcements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-sm text-white/60">
            아직 공개된 공지가 없습니다. 곧 새로운 소식을 전해드릴게요.
          </div>
        ) : (
          <ul className="space-y-4">
            {announcements.map((announcement) => {
              const categoryLabel = getCategoryLabel(announcement.category);
              const publishedLabel = formatDate(announcement.publishedAt);

              return (
                <li key={announcement.id} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-blue-400/60 hover:bg-white/[0.05]">
                  <Link href={`/announcements/${announcement.id}`} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          {announcement.isPinned ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-300">
                              상단 고정
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-white/70">
                            {categoryLabel}
                          </span>
                          <span>{publishedLabel}</span>
                        </div>
                        <h2 className="text-xl font-semibold text-white group-hover:text-blue-200">
                          {announcement.title}
                        </h2>
                        <p className="line-clamp-2 text-sm leading-relaxed text-white/70">
                          {announcement.content.replace(/\n+/g, ' ').slice(0, 160)}
                          {announcement.content.length > 160 ? '...' : ''}
                        </p>
                      </div>
                      {announcement.isNew ? (
                        <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-200">
                          NEW
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}