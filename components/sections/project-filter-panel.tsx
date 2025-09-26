'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { ProjectCard } from '@/components/shared/project-card';
import { useFilterStore } from '@/lib/stores/use-filter-store';
import type { ProjectSummary } from '@/lib/api/projects';

export function ProjectFilterPanel({ initialProjects }: { initialProjects: ProjectSummary[] }) {
  const { category, tags, sort } = useFilterStore();
  const {
    data = initialProjects,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['projects'],
    initialData: initialProjects,
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to load projects');
      return res.json();
    }
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

  if (isError) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류입니다.';
    return (
      <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200">
        <p className="font-semibold">프로젝트를 불러오지 못했습니다.</p>
        <p className="mt-2 text-xs text-red-100/80">{message}</p>
        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          className="mt-4 inline-flex items-center rounded-full border border-red-500/50 px-4 py-2 text-xs font-semibold text-red-100"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        조건에 맞는 프로젝트가 없습니다. 필터를 조정하거나 조금만 기다려 주세요.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isFetching ? (
        <p className="text-xs text-white/60">최신 데이터를 동기화하는 중입니다…</p>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
