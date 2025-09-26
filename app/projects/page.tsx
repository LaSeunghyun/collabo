import { Suspense } from 'react';

import { CategoryFilter } from '@/components/sections/category-filter';
import { ProjectFilterPanel } from '@/components/sections/project-filter-panel';
import { SectionHeader } from '@/components/shared/section-header';
import { demoProjects } from '@/lib/data/projects';

export default function ProjectsPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pb-20">
      <header className="pt-4">
        <SectionHeader title="프로젝트 전체" />
        <p className="max-w-2xl text-sm text-white/60">
          카테고리, 정렬, 태그 필터를 활용해 팬과 아티스트가 함께 만드는 다양한 프로젝트를 탐색해 보세요.
        </p>
      </header>
      <CategoryFilter />
      <Suspense fallback={<div>Loading...</div>}>
        <ProjectFilterPanel initialProjects={demoProjects} />
      </Suspense>
    </div>
  );
}
