'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ProjectCard } from '@/components/ui/cards/project-card';
import { SectionHeader } from '@/components/ui/headers/section-header';
import type { ProjectSummary } from '@/lib/api/projects';

interface ProjectSpotlightSectionProps {
  projects: ProjectSummary[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function ProjectSpotlightSection({ projects, isLoading, isError, onRetry }: ProjectSpotlightSectionProps) {
  const { t } = useTranslation();
  const popularProjects = useMemo(() => {
    return [...projects].sort((a, b) => b.participants - a.participants).slice(0, 6);
  }, [projects]);

  return (
    <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <SectionHeader
          title={t('home.sections.spotlight')}
          href="/projects"
          ctaLabel={t('actions.viewMore') ?? undefined}
        />
        <ProjectContent
          projects={popularProjects}
          isLoading={isLoading}
          isError={isError}
          onRetry={onRetry}
        />
      </div>
      <LiveAmaCard />
    </section>
  );
}

interface ProjectContentProps {
  projects: ProjectSummary[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function ProjectContent({ projects, isLoading, isError, onRetry }: ProjectContentProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ProjectSkeleton key={`project-skeleton-${index}`} className="animate-pulse" />
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
          onClick={onRetry}
          className="mt-4 inline-flex items-center rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-100 transition hover:border-red-300/60 hover:text-red-50"
        >
          {t('actions.viewMore')}
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        {t('home.empty.projects')}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

interface ProjectSkeletonProps {
  className?: string;
}

function ProjectSkeleton({ className = '' }: ProjectSkeletonProps) {
  return (
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
}

function LiveAmaCard() {
  const { t } = useTranslation();

  return (
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
  );
}
