'use client';

import { useTranslation } from 'react-i18next';

import type { StoreItem } from '@/app/api/store/route';
import { StoreCard } from '@/components/ui/cards/store-card';
import { SectionHeader } from '@/components/ui/headers/section-header';

interface StoreSectionProps {
  items: StoreItem[];
  isLoading: boolean;
}

export function StoreSection({ items, isLoading }: StoreSectionProps) {
  const { t } = useTranslation();

  return (
    <section>
      <SectionHeader
        title={t('home.store.title')}
        href="/store"
        ctaLabel={t('actions.viewMore') ?? undefined}
      />
      <StoreContent items={items} isLoading={isLoading} />
    </section>
  );
}

interface StoreContentProps {
  items: StoreItem[];
  isLoading: boolean;
}

function StoreContent({ items, isLoading }: StoreContentProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`store-skeleton-${index}`} className="h-64 animate-pulse rounded-3xl bg-white/10" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        {t('home.empty.store')}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {items.map((item) => (
        <StoreCard key={item.id} product={item} />
      ))}
    </div>
  );
}
