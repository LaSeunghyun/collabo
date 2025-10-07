'use client';

import { useTranslation } from 'react-i18next';

import { CategoryFilter } from '@/components/ui/sections/category-filter';
import { ProjectFilterPanel } from '@/components/ui/sections/project-filter-panel';
import { SectionHeader } from '@/components/ui/headers/section-header';

export default function ProjectsPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pb-20">
      <header className="pt-4">
        <h1 className="text-3xl font-bold text-white mb-4">?ÑÎ°ú?ùÌä∏</h1>
        <SectionHeader title={t('projects.overviewTitle')} />
        <p className="max-w-2xl text-sm text-white/60">{t('projects.overviewDescription')}</p>
      </header>
      <CategoryFilter />
      <ProjectFilterPanel />
    </div>
  );
}
