import { create } from 'zustand';
export type SortOption = 'popular' | 'closing' | 'newest';

interface FilterState {
  category: string | null;
  tags: string[];
  sort: SortOption;
  setCategory: (category: string | null) => void;
  toggleTag: (tag: string) => void;
  setSort: (sort: SortOption) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  category: null,
  tags: [],
  sort: 'popular',
  setCategory: (category) => set({ category }),
  toggleTag: (tag) =>
    set((state) => ({
      tags: state.tags.includes(tag)
        ? state.tags.filter((item) => item !== tag)
        : [...state.tags, tag]
    })),
  setSort: (sort) => set({ sort })
}));
