import React from 'react';

interface Filter {
  label: string;
  value: string;
}

interface AnnouncementFiltersProps {
  filters: Filter[];
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

export function AnnouncementFilters({ 
  filters, 
  selectedFilter, 
  onFilterChange 
}: AnnouncementFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isActive = selectedFilter === filter.value;
        return (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-neutral-300 hover:bg-white/10'
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
