'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CategoryFilter } from '@/components/ui/sections/category-filter';
import { ProjectCard } from '@/components/ui/cards/project-card';
import { SectionHeader } from '@/components/ui/headers/section-header';
import { StoreCard } from '@/components/ui/cards/store-card';
import type { ProjectSummary } from '@/lib/api/projects';
import { fetchProjects } from '@/lib/api/projects';
import { fetchStoreItems } from '@/lib/api/store';
import type { CommunityFeedResponse } from '@/lib/data/community';

interface ArtistListResponse {
  artists: {
    id: string;
    name: string;
    avatarUrl: string | null;
    bio: string | null;
    followerCount: number;
    projectCount: number;
  }[];
}

export default function HomePage() {
  const { t } = useTranslation();

  const { data: storeItems = [], isLoading: storeLoading } = useQuery({
    queryKey: ['store-items'],
    queryFn: fetchStoreItems,
    staleTime: 1000 * 60 * 5
  });

  const { data: projects = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 1000 * 60
  });

  const { data: artistsResponse } = useQuery<ArtistListResponse>({
    queryKey: ['artists', 'home'],
    queryFn: async () => {
      const res = await fetch('/api/artists?limit=4');
      if (!res.ok) {
        throw new Error('Failed to load artists');
      }
      return (await res.json()) as ArtistListResponse;
    },
    staleTime: 60_000
  });

  const { data: communityResponse } = useQuery<CommunityFeedResponse>({
    queryKey: ['community', 'home'],
    queryFn: async () => {
      const res = await fetch('/api/community?sort=trending&limit=5');
      if (!res.ok) {
        throw new Error('Failed to load community');
      }
      return (await res.json()) as CommunityFeedResponse;
    },
    staleTime: 15_000
  });

  const artists = artistsResponse?.artists ?? [];
  const communityPosts = communityResponse?.posts ?? [];

  const popularProjects = useMemo(() => {
    return [...projects].sort((a, b) => b.participants - a.participants).slice(0, 6);
  }, [projects]);

  const ProjectSkeleton = ({ className = '' }: { className?: string }) => (
    <div className={`flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 ${className}`}>
      <div className="h-52 w-full bg-white/10" />
      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="space-y-2">
          <div className="h-3 w-1/3 rounded-full bg-white/10" />
          <div className="h-5 w-3/4 rounded-full bg-white/20" />
          <div className="h-3 w-1/2 rounded-full bg-white/10" />
        </div>
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-white/10" />
          <div className="h-3 w-2/3 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );

  const renderProjects = (items: ProjectSummary[]) => {
    if (isLoading) {
      return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProjectSkeleton key={`skeleton-${index}`} className="animate-pulse" />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100">
          <p>{t('home.errors.projects')}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-100 transition hover:border-red-300/60 hover:text-red-50"
          >
            {t('actions.viewMore')}
          </button>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          {t('home.empty.projects')}
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 pb-20">
      <section className="pt-6">
        <div className="grid gap-8 rounded-4xl border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-950 p-10 lg:grid-cols-[3fr_2fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
              <Sparkles className="h-4 w-4" />
              {t('home.hero.tagline')}
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
              {t('home.hero.title')}
            </h1>
            <p className="max-w-2xl text-base text-white/70">{t('home.hero.subtitle')}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/artists"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                {t('home.hero.ctaArtists')}
              </Link>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:text-white"
              >
                {t('home.hero.ctaCommunity')}
              </Link>
            </div>
          </div>
          <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>{t('home.hero.metrics.projects')}</span>
              <span className="text-2xl font-semibold text-white">{projects.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('home.hero.metrics.community')}</span>
              <span className="text-2xl font-semibold text-white">{communityPosts.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('home.hero.metrics.artists')}</span>
              <span className="text-2xl font-semibold text-white">{artists.length}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <SectionHeader
            title={t('home.sections.spotlight')}
            href="/projects"
            ctaLabel={t('actions.viewMore') ?? undefined}
          />
          {renderProjects(popularProjects)}
        </div>
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
            {t('home.liveAma.tag')}
          </h3>
          <p className="text-2xl font-semibold text-white">{t('home.liveAma.title')}</p>
          <p className="text-sm text-white/60">{t('home.liveAma.description')}</p>
          <Link
            href="/projects/1"
            className="inline-flex w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            aria-label={t('home.liveAma.ctaAria', { title: t('home.liveAma.title') })}
          >
            {t('home.liveAma.cta')}
          </Link>
        </div>
      </section>

      <section>
        <SectionHeader
          title={t('home.sections.artistNetwork')}
          href="/artists"
          ctaLabel={t('actions.viewMore') ?? undefined}
        />
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {artists.length === 0
            ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
            ))
            : artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.id}`}
                className="group flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-primary/40 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
                    {artist.avatarUrl ? (
                      <Image src={artist.avatarUrl} alt={artist.name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/70">
                        {artist.name.slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white group-hover:text-primary">{artist.name}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                      {t('artist.directory.projectCount', { count: artist.projectCount })}
                    </p>
                  </div>
                </div>
                <p className="flex-1 text-sm text-white/70 line-clamp-3">{artist.bio ?? t('artist.profile.emptyBioDetailed')}</p>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{t('artist.directory.followerCount', { count: artist.followerCount })}</span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-white/70">
                    {t('artist.directory.viewProfile')}
                  </span>
                </div>
              </Link>
            ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title={t('home.sections.communityPulse')}
          href="/community"
          ctaLabel={t('actions.viewMore') ?? undefined}
        />
        <div className="mt-6 space-y-3">
          {communityPosts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-sm text-white/60">
              {t('home.empty.community')}
            </div>
          ) : (
            communityPosts.map((post) => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-primary/40 hover:bg-white/10"
              >
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/50">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-white">
                    {t(`community.filters.${post.category}`)}
                  </span>
                  {post.isTrending ? (
                    <span className="rounded-full bg-primary/20 px-3 py-1 text-primary">
                      {t('community.badges.trending')}
                    </span>
                  ) : null}
                </div>
                <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                <p className="text-sm text-white/70 line-clamp-2">{post.content}</p>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>{post.author?.name ?? t('community.defaultGuestName')}</span>
                  <span>{t('community.likesLabel_other', { count: post.likes })}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section>
        <SectionHeader
          title={t('home.sections.resources')}
          href="/partners"
          ctaLabel={t('actions.viewMore') ?? undefined}
        />
        <CategoryFilter />
      </section>

      <section>
        <SectionHeader
          title={t('home.store.title')}
          href="/store"
          ctaLabel={t('actions.viewMore') ?? undefined}
        />
        {storeLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-3xl bg-white/10" />
            ))}
          </div>
        ) : storeItems.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            {t('home.empty.store')}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {storeItems.map((item) => (
              <StoreCard key={item.id} product={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
