'use client';

import Image from 'next/image';
import { Heart, Users as UsersIcon, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ProjectSummary } from '@/lib/api/projects';

interface ProjectCardProps {
  project: ProjectSummary;
}

const categoryColor: Record<string, string> = {
  music: 'bg-category-music/20 text-category-music',
  performance: 'bg-category-performance/20 text-category-performance',
  art: 'bg-category-art/20 text-category-art',
  tech: 'bg-category-tech/20 text-category-tech'
};

export function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useTranslation();
  const progress = Math.min(100, Math.round((project.currentAmount / project.targetAmount) * 100));

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <button
        type="button"
        aria-label={t('actions.favorite') ?? 'Favorite'}
        className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950/80 text-white/70 backdrop-blur transition hover:text-primary"
      >
        <Heart className="h-5 w-5" />
      </button>
      <div className="relative h-52 w-full overflow-hidden">
        <Image
          src={project.thumbnail}
          alt={project.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/60">
          <span className={`rounded-full px-3 py-1 capitalize ${categoryColor[project.category] ?? 'bg-white/10 text-white/80'}`}>
            {project.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" aria-hidden />
            {project.remainingDays}d
          </span>
        </div>
        <h3 className="text-lg font-semibold text-white">{project.title}</h3>
        <div className="flex items-center gap-3 text-sm text-white/70">
          <UsersIcon className="h-4 w-4" aria-hidden />
          {project.participants.toLocaleString()} supporters
        </div>
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>{progress}%</span>
            <span>
              {project.currentAmount.toLocaleString()}??/ {project.targetAmount.toLocaleString()}??
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
