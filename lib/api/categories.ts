import type { Category } from '@/app/api/categories/route';

export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch('/api/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ [CATEGORIES] API 호출 실패:', response.status, response.statusText);
      throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [CATEGORIES] API 호출 성공:', data.length, '개 카테고리 로드됨');
    return data;
  } catch (error) {
    console.error('❌ [CATEGORIES] fetchCategories 오류:', error);
    throw error;
  }
}
