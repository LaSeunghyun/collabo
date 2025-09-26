import { Suspense } from 'react';

import { CategoryFilter } from '@/components/sections/category-filter';
import { ProjectFilterPanel } from '@/components/sections/project-filter-panel';
import { SectionHeader } from '@/components/shared/section-header';
import type { ProjectSummary } from '@/lib/api/projects';
import { listProjects } from '@/lib/services/projects';

function ProjectGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`project-skeleton-${index}`}
          className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/[0.07]"
        />
      ))}
    </div>
  );
}

export default async function ProjectsPage() {
  let initialProjects: ProjectSummary[] = [];
  let initialError: string | null = null;

  try {
    initialProjects = await listProjects();
  } catch (error) {
    console.error('Failed to load projects', error);
    initialError = '프로젝트를 불러오는 중 오류가 발생했습니다.';
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pb-20">
      <header className="pt-4">
        <SectionHeader title="프로젝트 전체" />
        <p className="max-w-2xl text-sm text-white/60">
          카테고리, 정렬, 태그 필터를 활용해 팬과 아티스트가 함께 만드는 다양한 프로젝트를 탐색해 보세요.
        </p>
      </header>
      <CategoryFilter />
      {initialError ? (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200">
          {initialError}
        </div>
      ) : null}
      <Suspense fallback={<ProjectGridSkeleton />}>
        <ProjectFilterPanel initialProjects={initialProjects} />
      </Suspense>
    </div>
  );
}
