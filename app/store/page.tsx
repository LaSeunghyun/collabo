'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { StoreCard } from '@/components/ui/cards/store-card';
import { fetchStoreItems } from '@/lib/api/store';

export default function StorePage() {
  const { t } = useTranslation();

  const {
    data: items = [],
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['store-items', 'page'],
    queryFn: fetchStoreItems,
    staleTime: 5 * 60 * 1000
  });

  const renderSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`store-skeleton-${index}`}
          className="flex h-full animate-pulse flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5"
        >
          <div className="h-48 w-full bg-white/10" />
          <div className="flex flex-1 flex-col justify-between gap-4 p-5">
            <div className="space-y-2">
              <div className="h-3 w-1/3 rounded-full bg-white/10" />
              <div className="h-4 w-3/4 rounded-full bg-white/20" />
            </div>
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-white/10" />
              <div className="h-3 w-1/2 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return renderSkeleton();
    }

    if (isError) {
      return (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100">
          <p>We could not load store items right now.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-100 transition hover:border-red-300/60 hover:text-red-50"
          >
            Try again
          </button>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          {t('home.empty.store') ?? 'There are no items for sale yet.'}
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <StoreCard key={item.id} product={item} />
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-20">
      <header className="pt-6">
        <h1 className="mb-3 text-3xl font-bold text-white">
          {t('navigation.store') ?? 'Store'}
        </h1>
        <p className="max-w-2xl text-sm text-white/70">
          Discover limited releases, event bundles, and digital packs published alongside each artist campaign.
        </p>
      </header>
      {renderContent()}
    </div>
  );
}
