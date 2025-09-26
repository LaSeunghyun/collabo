'use client';

import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { CategoryFilter } from '@/components/sections/category-filter';
import { ProjectFilterPanel } from '@/components/sections/project-filter-panel';
import { SectionHeader } from '@/components/shared/section-header';
import { demoProjects } from '@/lib/data/projects';

export default function ProjectsPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pb-20">
      <header className="pt-4">
        <SectionHeader title={t('projects.overviewTitle')} />
        <p className="max-w-2xl text-sm text-white/60">{t('projects.overviewDescription')}</p>
      </header>
      <CategoryFilter />
      <Suspense fallback={<div>{t('common.loading')}</div>}>
        <ProjectFilterPanel initialProjects={demoProjects} />
      </Suspense>
    </div>
  );
}
