'use client';

import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

import { SectionHeader } from '@/components/ui/headers/section-header';

// 대형 컴포넌트들을 동적 import로 코드 스플리팅
const CategoryFilter = dynamic(
  () => import('@/components/ui/sections/category-filter').then(mod => ({ default: mod.CategoryFilter })),
  { ssr: true }
);

const ProjectFilterPanel = dynamic(
  () => import('@/components/ui/sections/project-filter-panel').then(mod => ({ default: mod.ProjectFilterPanel })),
  { ssr: true }
);

export default function ProjectsPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pb-20">
      <div className="pt-6">
        <h1 className="text-3xl font-bold text-white mb-4">프로젝트</h1>
        <SectionHeader title={t('projects.overviewTitle')} />
        <p className="max-w-2xl text-sm text-white/60">{t('projects.overviewDescription')}</p>
      </div>
      <CategoryFilter />
      <ProjectFilterPanel />
    </div>
  );
}
