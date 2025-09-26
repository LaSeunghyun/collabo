'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { HeroCarousel } from '@/components/sections/hero-carousel';
import { CategoryFilter } from '@/components/sections/category-filter';
import { ProjectCard } from '@/components/shared/project-card';
import { SectionHeader } from '@/components/shared/section-header';
import { StoreCard } from '@/components/shared/store-card';
import type { ProjectSummary } from '@/lib/api/projects';
import { fetchProjects } from '@/lib/api/projects';

export default function HomePage() {
  const { t } = useTranslation();
  const storeItems = [
    {
      id: 'product-1',
      title: t('home.store.items.product1.title'),
      price: 89000,
      discount: 15,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'
    },
    {
      id: 'product-2',
      title: t('home.store.items.product2.title'),
      price: 129000,
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d'
    },
    {
      id: 'product-3',
      title: t('home.store.items.product3.title'),
      price: 159000,
      discount: 10,
      image: 'https://images.unsplash.com/photo-1485579149621-3123dd979885'
    }
  ];

  const { data: projects = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 1000 * 60
  });

  const popularProjects = useMemo(() => {
    return [...projects].sort((a, b) => b.participants - a.participants).slice(0, 6);
  }, [projects]);

  const closingSoonProjects = useMemo(() => {
    return [...projects].sort((a, b) => a.remainingDays - b.remainingDays).slice(0, 6);
  }, [projects]);

  const themedProjects = useMemo(() => {
    return projects.slice(0, 6);
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

  const renderProjects = (
    items: ProjectSummary[],
    options: {
      layout: 'grid' | 'carousel';
      skeletonCount: number;
      wrapperClassName: string;
      itemClassName?: string;
    }
  ) => {
    if (isLoading) {
      return (
        <div className={options.wrapperClassName}>
          {Array.from({ length: options.skeletonCount }).map((_, index) => (
            <div key={`skeleton-${index}`} className={options.itemClassName ?? ''}>
              <ProjectSkeleton className="animate-pulse" />
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100">
          <p>{'프로젝트를 불러오지 못했어요.'}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-100 transition hover:border-red-300/60 hover:text-red-50"
          >
            다시 시도
          </button>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          아직 표시할 프로젝트가 없어요.
        </div>
      );
    }

    if (options.layout === 'grid') {
      return (
        <div className={options.wrapperClassName}>
          {items.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      );
    }

    return (
      <div className={options.wrapperClassName}>
        {items.map((project) => (
          <div key={project.id} className={options.itemClassName ?? ''}>
            <ProjectCard project={project} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 pb-20">
      <section className="pt-4 lg:pt-0">
        <HeroCarousel />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <SectionHeader
            title={t('home.livePopular')}
            href="/projects"
            ctaLabel={t('actions.viewMore') ?? undefined}
          />
          {renderProjects(popularProjects, {
            layout: 'grid',
            skeletonCount: 6,
            wrapperClassName: 'grid gap-6 md:grid-cols-2 xl:grid-cols-3'
          })}
        </div>
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
            {t('home.liveAma.tag')}
          </h3>
          <p className="text-2xl font-semibold text-white">{t('home.liveAma.title')}</p>
          <p className="text-sm text-white/60">{t('home.liveAma.description')}</p>
          <Link href="/projects/1" className="inline-flex w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            {t('home.liveAma.cta')}
          </Link>
        </div>
      </section>

      <CategoryFilter />

      <section>
        <SectionHeader
          title={t('home.closingSoon')}
          href="/projects?sort=closing"
          ctaLabel={t('actions.viewMore') ?? undefined}
        />
        {renderProjects(closingSoonProjects, {
          layout: 'carousel',
          skeletonCount: 4,
          wrapperClassName: 'flex gap-6 overflow-x-auto pb-4',
          itemClassName: 'min-w-[280px] max-w-xs flex-1'
        })}
      </section>

      <section>
        <SectionHeader
          title={t('home.themes')}
          href="/projects?theme=1"
          ctaLabel={t('actions.viewMore') ?? undefined}
        />
        {renderProjects(themedProjects, {
          layout: 'grid',
          skeletonCount: 6,
          wrapperClassName: 'grid gap-6 md:grid-cols-2 xl:grid-cols-3'
        })}
      </section>

      <section>
        <SectionHeader
          title={t('home.store.title')}
          href="/projects?tab=store"
          ctaLabel={t('actions.viewMore') ?? undefined}
        />
        <div className="grid gap-6 md:grid-cols-3">
          {storeItems.map((item) => (
            <StoreCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
