'use client';

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
    <div className="mx-auto max-w-5xl px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">{t('community.title')}</h1>
        <p className="mt-2 text-sm text-white/60">{t('community.description')}</p>

        {highlights.pinned.length ? (
          <div className="mt-6 rounded-3xl border border-primary/20 bg-primary/10 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">
              {t('community.pinned.title')}
            </h2>
            <ul className="mt-3 space-y-2">
              {highlights.pinned.map((post) => (
                <li key={post.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{post.title}</p>
                    <p className="text-xs text-white/70">{post.content}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                    {t(`community.filters.${post.category}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {highlights.popular.length ? (
          <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/60">
              {t('community.popular.title')}
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {highlights.popular.slice(0, 4).map((post) => (
                <div key={post.id} className="rounded-2xl border border-white/10 bg-neutral-950/60 p-4">
                  <p className="text-sm font-semibold text-white">{post.title}</p>
                  <p className="mt-1 text-xs text-white/60">
                    {t('community.likesLabel_other', { count: post.likes })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </header>
      <section className="mt-10">
        <CommunityBoard onMetaChange={handleMetaChange} />
      </section>
    </div>
  );
}
