import type { StoreItem } from '@/app/api/store/route';

export async function fetchStoreItems(): Promise<StoreItem[]> {
  const response = await fetch('/api/store', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch store items');
  }

  return response.json();
}
