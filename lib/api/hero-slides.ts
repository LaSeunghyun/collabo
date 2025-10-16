import type { HeroSlide } from '@/app/api/hero-slides/route';

export async function fetchHeroSlides(): Promise<HeroSlide[]> {
  const response = await fetch('/api/hero-slides', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch hero slides');
  }

  return response.json();
}
