'use client';

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

import { CommunityBoard } from '@/components/ui/sections/community-board';
import type { CommunityPost } from '@/lib/data/community';

interface FeedHighlights {
  pinned: CommunityPost[];
  popular: CommunityPost[];
  total: number;
}

export default function CommunityPage() {
  const { t } = useTranslation();
  const [highlights, setHighlights] = useState<FeedHighlights>({ pinned: [], popular: [], total: 0 });

  const handleMetaChange = useCallback((meta: FeedHighlights) => {
    setHighlights(meta);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20">
      <header className="pt-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                {t('community.hero.tagline')}
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-white">
                {t('community.hero.title')}
              </h1>
              <p className="text-base text-white/70">
                {t('community.hero.subtitle')}
              </p>
            </div>
            <div className="grid gap-4 rounded-3xl border border-white/10 bg-neutral-950/70 p-6 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>{t('community.hero.metrics.posts')}</span>
                <span className="text-2xl font-semibold text-white">{highlights.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('community.hero.metrics.pinned')}</span>
                <span className="text-lg font-semibold text-white">{highlights.pinned.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('community.hero.metrics.popular')}</span>
                <span className="text-lg font-semibold text-white">{highlights.popular.length}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-8 flex justify-end">
        <Link
          href="/community/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          새 게시글 작성
        </Link>
      </div>

      <section className="mt-10">
        <CommunityBoard onMetaChange={handleMetaChange} />
      </section>
    </div>
  );
}
