'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/lib/stores/use-filter-store';
import { fetchCategories } from '@/lib/api/categories';
import type { Category } from '@/app/api/categories/route';

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

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-white/60">카테고리 탐색</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-white/60">카테고리 탐색</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {categories.map((item) => (
          <div
            key={item.id}
            onMouseEnter={() => setOpen(item.id)}
            onMouseLeave={() => setOpen(null)}
            className={`group relative cursor-pointer rounded-2xl border border-white/10 px-4 py-3 transition ${category === item.id ? 'bg-primary text-primary-foreground' : 'bg-neutral-950/60 hover:bg-white/10'
              }`}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleCategory(item.id);
              }
            }}
          >
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                {item.icon && <span>{item.icon}</span>}
                {item.label}
              </span>
              <ChevronDown className="h-4 w-4 transition group-hover:rotate-180" />
            </div>
            {open === item.id ? (
              <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-2xl border border-white/10 bg-neutral-900/95 p-3 backdrop-blur">
                <ul className="space-y-2 text-xs text-white/70">
                  {item.subcategories.map((sub) => (
                    <li key={sub} className="hover:text-white cursor-pointer">
                      {sub}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <button
              type="button"
              aria-label={`${item.label} 선택`}
              onClick={() => toggleCategory(item.id)}
              className="absolute inset-0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
