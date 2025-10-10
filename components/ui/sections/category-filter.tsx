'use client';

import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/lib/stores/use-filter-store';
import { fetchCategories } from '@/lib/api/categories';

export function CategoryFilter() {
  const { category, setCategory } = useFilterStore();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 10 // 10�?
  });

  const toggleCategory = (id: string) => {
    setCategory(category === id ? null : id);
  };

  const content = isLoading ? (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-8 w-20 animate-pulse rounded-full bg-white/10" />
      ))}
    </div>
  ) : (
    <div className="flex flex-wrap gap-2">
      {categories.map((item) => {
        const isActive = category === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => toggleCategory(item.id)}
            className={clsx(
              'rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-0',
              isActive 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            )}
          >
            {item.icon ? <span className="mr-1 text-sm not-italic">{item.icon}</span> : null}
            {item.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">카테고리 검??/p>
          <h3 className="mt-1 text-xl font-semibold text-white">
            ?�로?�트 ?�이?�어�?카테고리별로 검?�해보세??
          </h3>
        </div>
        {category ? (
          <button
            type="button"
            onClick={() => setCategory(null)}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50 transition hover:text-white"
          >
            초기??
          </button>
        ) : null}
      </div>
      <div className="mt-6">{content}</div>
    </div>
  );
}
