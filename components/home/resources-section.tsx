'use client';

import { useTranslation } from 'react-i18next';

import { CategoryFilter } from '@/components/ui/sections/category-filter';
import { SectionHeader } from '@/components/ui/headers/section-header';

export function ResourcesSection() {
  const { t } = useTranslation();

  return (
    <section>
      <SectionHeader
        title={t('home.sections.resources')}
        href="/partners"
        ctaLabel={t('actions.viewMore') ?? undefined}
      />
      <CategoryFilter />
    </section>
  );
}
