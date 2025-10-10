'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CategoryFilter } from '@/components/ui/sections/category-filter';
import { SectionHeader } from '@/components/ui/headers/section-header';

const DUMMY_CATEGORIES = [
  { value: 'all', label: '전체' },
  { value: 'production', label: '음반/음원 제작' },
  { value: 'marketing', label: '홍보/마케팅' },
  { value: 'distribution', label: '유통' },
  { value: 'legal', label: '법률/회계' },
];

export function ResourcesSection() {
  const { t } = useTranslation();
  const [category, setCategory] = useState('all');

  return (
    <section>
      <SectionHeader
        title={t('home.sections.resources')}
        href="/partners"
        ctaLabel={t('actions.viewMore') ?? undefined}
      />
      <CategoryFilter
        categories={DUMMY_CATEGORIES}
        selectedCategory={category}
        onCategoryChange={setCategory}
        className="mt-6"
      />
    </section>
  );
}
