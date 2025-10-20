'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { ProjectCard } from '@/components/ui/cards/project-card';
import { SectionHeader } from '@/components/ui/headers/section-header';
import type { ProjectSummary } from '@/lib/api/projects';

interface ProjectSpotlightSectionProps {
  projects: ProjectSummary[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function ProjectSpotlightSection({ projects, isLoading, isError, onRetry }: ProjectSpotlightSectionProps) {
  const { t } = useTranslation();
  const popularProjects = useMemo(() => {
    return [...projects].sort((a, b) => b.participants - a.participants).slice(0, 10); // 10개로 증가
  }, [projects]);

  return (
    <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <SectionHeader
          title={t('home.sections.spotlight')}
          href="/projects"
          ctaLabel={t('actions.viewMore') ?? undefined}
        />
        <ProjectSlider
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

interface ProjectSliderProps {
  projects: ProjectSummary[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

function ProjectSlider({ projects, isLoading, isError, onRetry }: ProjectSliderProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const itemsToShow = 3;
  const maxIndex = Math.max(0, projects.length - itemsToShow);
  const currentProjects = projects.slice(currentIndex, currentIndex + itemsToShow);

  const goToPrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex(Math.min(maxIndex, currentIndex + 1));
  };

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
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-100 transition hover:border-red-300/60 hover:text-red-50"
          >
            {t('actions.viewMore')}
          </button>
        )}
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
    <div className="space-y-4">
      {/* 슬라이더 컨테이너 */}
      <div className="relative">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {currentProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {/* 네비게이션 버튼 */}
        {projects.length > itemsToShow && (
          <>
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="이전 프로젝트"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex >= maxIndex}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="다음 프로젝트"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* 인디케이터 */}
      {projects.length > itemsToShow && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full transition ${
                index === currentIndex ? 'bg-primary' : 'bg-white/30'
              }`}
              aria-label={`${index + 1}번째 슬라이드로 이동`}
            />
          ))}
        </div>
      )}
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
        href="/projects"
        className="inline-flex w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        aria-label={t('home.liveAma.ctaAria', { title: t('home.liveAma.title') })}
      >
        {t('home.liveAma.cta')}
      </Link>
    </div>
  );
}
