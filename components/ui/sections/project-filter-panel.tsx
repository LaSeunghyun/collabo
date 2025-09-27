'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { ProjectCard } from '@/components/ui/cards/project-card';
import { useFilterStore } from '@/lib/stores/use-filter-store';
import type { ProjectSummary } from '@/lib/api/projects';
import { fetchProjects } from '@/lib/api/projects';

export function ProjectFilterPanel() {
  const { category, tags, sort } = useFilterStore();
  const {
    data = [],
    isLoading,
    isError,
    refetch
  } = useQuery<ProjectSummary[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 1000 * 60
  });

  const filtered = useMemo(() => {
    let items = [...data];
    if (category) {
      items = items.filter((item) => item.category === category);
    }
    if (tags.length > 0) {
      items = items.filter((item) => tags.every((tag) => item.title.toLowerCase().includes(tag.toLowerCase())));
    }
    if (sort === 'closing') {
      items.sort((a, b) => a.remainingDays - b.remainingDays);
    } else if (sort === 'newest') {
      items.sort((a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf());
    } else {
      items.sort((a, b) => b.participants - a.participants);
    }
    return items;
  }, [category, data, sort, tags]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`project-skeleton-${index}`}
            className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 animate-pulse"
          >
            <div className="mb-4 h-48 w-full rounded-2xl bg-white/10" />
            <div className="space-y-3">
              <div className="h-3 w-1/3 rounded-full bg-white/10" />
              <div className="h-5 w-3/4 rounded-full bg-white/20" />
              <div className="h-3 w-1/2 rounded-full bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100">
        <p>프로젝트 목록을 불러오는 중 문제가 발생했습니다.</p>
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

  if (filtered.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        조건에 맞는 프로젝트가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
