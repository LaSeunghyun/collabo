'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/lib/stores/use-filter-store';
import { fetchCategories } from '@/lib/api/categories';

export function CategoryFilter() {
  const { category, setCategory } = useFilterStore();
  const [open, setOpen] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 10 // 10분
  });

  const toggleCategory = (id: string) => {
    setCategory(category === id ? null : id);
  };

  const content = isLoading ? (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-10 w-24 animate-pulse rounded-full bg-white/10" />
      ))}
    </div>
  ) : (
    <div className="flex flex-wrap gap-2">
      {categories.map((item) => {
        const isActive = category === item.id;
        const hasSubcategories = item.subcategories.length > 0;

        return (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => setOpen(item.id)}
            onMouseLeave={() => setOpen(null)}
          >
            <button
              type="button"
              onClick={() => toggleCategory(item.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  toggleCategory(item.id);
                }
              }}
              className={clsx(
                'group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-0',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              )}
            >
              {item.icon ? <span className="text-base not-italic">{item.icon}</span> : null}
              <span className="tracking-[0.08em]">{item.label}</span>
              {hasSubcategories ? (
                <ChevronDown
                  className={clsx(
                    'h-3.5 w-3.5 transition-transform text-white/40',
                    open === item.id ? 'rotate-180 text-white/60' : 'group-hover:text-white/60'
                  )}
                />
              ) : null}
            </button>
            {open === item.id && hasSubcategories ? (
              <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl border border-white/10 bg-neutral-900/95 p-3 shadow-lg backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">세부 카테고리</p>
                <ul className="mt-2 space-y-1.5 text-xs text-white/70">
                  {item.subcategories.map((sub) => (
                    <li key={sub} className="rounded-md px-2 py-1 transition hover:bg-white/5 hover:text-white">
                      {sub}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">카테고리 탐색</p>
          <h3 className="mt-1 text-xl font-semibold text-white">
            프로젝트 아이디어를 카테고리별로 탐색하세요
          </h3>
        </div>
        {category ? (
          <button
            type="button"
            onClick={() => setCategory(null)}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50 transition hover:text-white"
          >
            초기화
          </button>
        ) : null}
      </div>
      <div className="mt-6">{content}</div>
    </div>
  );
}
