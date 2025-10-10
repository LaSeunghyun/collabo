'use client';

import { useState } from 'react';

interface CategoryFilterProps {
  categories: Array<{ value: string; label: string }>;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

export function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  className = '' 
}: CategoryFilterProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        onClick={() => onCategoryChange('all')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          selectedCategory === 'all'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        전체
      </button>
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => onCategoryChange(category.value)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === category.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
