import { NextResponse } from 'next/server';

export interface Category {
  id: string;
  label: string;
  subcategories: string[];
  icon?: string;
  color?: string;
  isActive: boolean;
  order: number;
}

export async function GET() {
  try {
    const categories: Category[] = [
      {
        id: 'music',
        label: 'Music',
        subcategories: ['K-pop', 'Indie', 'Live Session'],
        icon: '?��',
        color: '#ff6b6b',
        isActive: true,
        order: 1
      },
      {
        id: 'performance',
        label: 'Performance',
        subcategories: ['Musical', 'Play', 'Dance'],
        icon: '?��',
        color: '#4ecdc4',
        isActive: true,
        order: 2
      },
      {
        id: 'art',
        label: 'Art',
        subcategories: ['Media Art', 'Exhibition', 'Workshop'],
        icon: '?��',
        color: '#45b7d1',
        isActive: true,
        order: 3
      },
      {
        id: 'tech',
        label: 'Tech',
        subcategories: ['XR', 'Metaverse', 'AI Collab'],
        icon: '?��',
        color: '#96ceb4',
        isActive: true,
        order: 4
      }
    ];

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to load categories', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
