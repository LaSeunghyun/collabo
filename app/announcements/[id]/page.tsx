import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  ANNOUNCEMENT_CATEGORY_LABELS,
  type AnnouncementCategory
} from '@/lib/constants/announcements';
import { getServerAuthSession } from '@/lib/auth/session';
import { getAnnouncementDetail } from '@/lib/server/announcements';
import { userRole } from '@/drizzle/schema';

import { AnnouncementReadTracker } from './read-tracker';

const DATE_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const getCategoryLabel = (category: string) =>
  ANNOUNCEMENT_CATEGORY_LABELS[category as AnnouncementCategory] ?? category;

const formatDate = (date: Date | null) =>
  date ? DATE_FORMATTER.format(typeof date === 'string' ? new Date(date) : date) : '발행 예정';

export default async function AnnouncementDetailPage({
  params
}: {
  params: { id: string };
}) {
  const session = await getServerAuthSession();
  const announcement = await getAnnouncementDetail(params.id, session?.user?.id ?? null);

  if (!announcement) {
    notFound();
  }

  const publishedAt = announcement.publishedAt ?? announcement.updatedAt;
  const isPublished = !announcement.publishedAt || new Date(announcement.publishedAt) <= new Date();
  const isAdmin = session?.user?.role === 'ADMIN';

  if (!isPublished && !isAdmin) {
    notFound();
  }

  const categoryLabel = getCategoryLabel(announcement.category);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24">
      <AnnouncementReadTracker
        announcementId={announcement.id}
        canAcknowledge={Boolean(session?.user)}
        isAlreadyRead={announcement.isRead}
      />
      <header className="space-y-3 py-10">
        <Link href="/announcements" className="text-sm text-blue-300 hover:text-blue-200">
          ← 공지 목록으로 돌아가기
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
          {announcement.isPinned ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-300">
              📌 상단 고정
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-white/70">
            {categoryLabel}
          </span>
          <span>{formatDate(publishedAt)}</span>
          <span className="text-white/50">작성자 {announcement.author.name ?? '관리자'}</span>
        </div>
        <h1 className="text-4xl font-semibold text-white">{announcement.title}</h1>
      </header>

      <article className="prose prose-invert max-w-none space-y-6 text-base leading-relaxed">
        {announcement.content.split('\n').map((paragraph, index) => (
          <p key={index} className="text-white/80">
            {paragraph.trim().length > 0 ? paragraph : '\u00A0'}
          </p>
        ))}
      </article>
    </div>
  );
}
