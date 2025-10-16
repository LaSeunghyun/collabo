import { NextResponse } from 'next/server';

export interface StoreItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  discount?: number;
  image: string;
  category: string;
  isAvailable: boolean;
  stock?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const FALLBACK_ITEMS: StoreItem[] = [
  {
    id: 'poster-set',
    title: 'Limited Poster Set',
    description: 'Hand-numbered tour posters curated with the artist.',
    price: 89000,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
    category: 'poster',
    isAvailable: true,
    stock: 50,
    tags: ['poster', 'limited', 'collector'],
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'merch-bundle',
    title: 'Premium Merch Bundle',
    description: 'Exclusive hoodie, enamel pins, and lyric zine.',
    price: 129000,
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d',
    category: 'goods',
    isAvailable: true,
    stock: 30,
    tags: ['bundle', 'hoodie', 'zine'],
    createdAt: '2024-01-20T00:00:00.000Z',
    updatedAt: '2024-01-20T00:00:00.000Z'
  },
  {
    id: 'studio-pack',
    title: 'Studio Pack + Masterclass',
    description: 'Digital stems, behind-the-scenes footage, and live Q&A access.',
    price: 159000,
    discount: 10,
    image: 'https://images.unsplash.com/photo-1485579149621-3123dd979885',
    category: 'digital',
    isAvailable: true,
    stock: 100,
    tags: ['digital', 'masterclass', 'stems'],
    createdAt: '2024-01-25T00:00:00.000Z',
    updatedAt: '2024-01-25T00:00:00.000Z'
  }
];

export async function GET() {
  try {
    return NextResponse.json(FALLBACK_ITEMS);
  } catch (error) {
    console.error('Failed to load store items', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
