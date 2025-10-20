'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { SectionHeader } from '@/components/ui/headers/section-header';
import type { CommunityPost, HomeCommunityPost } from '@/lib/data/community';

interface CommunityPulseSectionProps {
  featuredPost?: CommunityPost | HomeCommunityPost;
  highlightedPosts: (CommunityPost | HomeCommunityPost)[];
  hasPosts: boolean;
}

export function CommunityPulseSection({ featuredPost, highlightedPosts, hasPosts }: CommunityPulseSectionProps) {
  const { t } = useTranslation();

  return (
    <section>
      <SectionHeader
        title={t('home.sections.communityPulse')}
        href="/community"
        ctaLabel={t('actions.viewMore') ?? undefined}
      />
      {hasPosts ? (
        <CommunityFeed featuredPost={featuredPost} highlightedPosts={highlightedPosts} />
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-sm text-white/60">
          {t('home.empty.community')}
        </div>
      )}
    </section>
  );
}

interface CommunityFeedProps {
  featuredPost?: CommunityPost;
  highlightedPosts: CommunityPost[];
}

function CommunityFeed({ featuredPost, highlightedPosts }: CommunityFeedProps) {
  const { t } = useTranslation();
  const hasHighlights = highlightedPosts.length > 0;

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr] xl:grid-cols-[3fr_2fr]">
      {featuredPost ? (
        <Link
          href={`/community/${featuredPost.id}`}
          className="group flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/[0.02] p-6 transition hover:border-primary/40 hover:from-primary/20 hover:via-primary/10 hover:to-primary/0"
        >
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">
            <span className="rounded-full bg-white/10 px-3 py-1 text-white">
              {t(`community.filters.${featuredPost.category}`)}
            </span>
            {featuredPost.isTrending ? (
              <span className="rounded-full bg-primary/20 px-3 py-1 text-primary">
                {t('community.badges.trending')}
              </span>
            ) : null}
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-semibold text-white group-hover:text-primary">{featuredPost.title}</h3>
            <p className="text-sm text-white/70 line-clamp-4">{featuredPost.content}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
            <span>{featuredPost.author?.name ?? t('community.defaultGuestName')}</span>
            <div className="flex items-center gap-3">
              <span>{t('community.likesLabel_other', { count: featuredPost.likes ?? 0 })}</span>
              <span>{t('community.commentsLabel_other', { count: featuredPost.comments ?? 0 })}</span>
            </div>
          </div>
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
          <span>{t('home.sections.communityPulse')}</span>
          <Link href="/community" className="text-white/60 transition hover:text-white">
            {t('actions.viewMore')}
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {hasHighlights ? (
            highlightedPosts.map((post) => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="group flex flex-col gap-2 rounded-2xl border border-white/10 bg-neutral-950/60 px-4 py-3 transition hover:border-primary/40 hover:bg-neutral-900/80"
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-white/50">
                  <span className="truncate text-white/70">
                    {t(`community.filters.${post.category}`)}
                  </span>
                  {post.isTrending ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                      {t('community.badges.trending')}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-white group-hover:text-primary line-clamp-2">{post.title}</p>
                <p className="text-xs text-white/60 line-clamp-2">{post.content}</p>
                <div className="mt-auto flex items-center justify-between text-[11px] text-white/50">
                  <span className="truncate">{post.author?.name ?? t('community.defaultGuestName')}</span>
                  <span>{t('community.likesLabel_other', { count: post.likes ?? 0 })}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-xs text-white/50">
              {t('home.empty.community')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
