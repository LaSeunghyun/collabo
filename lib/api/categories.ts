import type { Category } from '@/app/api/categories/route';

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch('/api/categories', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
}
