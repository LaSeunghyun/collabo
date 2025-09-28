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

export async function GET() {
  try {
    const storeItems: StoreItem[] = [
      {
        id: 'product-1',
        title: '아티스트 한정판 포스터',
        description: '특별한 순간을 담은 한정판 포스터',
        price: 89000,
        discount: 15,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
        category: 'poster',
        isAvailable: true,
        stock: 50,
        tags: ['한정판', '포스터', '아티스트'],
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z'
      },
      {
        id: 'product-2',
        title: '프리미엄 굿즈 세트',
        description: '아티스트와 함께 만든 특별한 굿즈',
        price: 129000,
        image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d',
        category: 'goods',
        isAvailable: true,
        stock: 30,
        tags: ['굿즈', '세트', '프리미엄'],
        createdAt: '2024-01-20T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z'
      },
      {
        id: 'product-3',
        title: '디지털 앨범 + 메이킹 영상',
        description: '디지털 앨범과 메이킹 영상이 포함된 패키지',
        price: 159000,
        discount: 10,
        image: 'https://images.unsplash.com/photo-1485579149621-3123dd979885',
        category: 'digital',
        isAvailable: true,
        stock: 100,
        tags: ['디지털', '앨범', '메이킹'],
        createdAt: '2024-01-25T00:00:00.000Z',
        updatedAt: '2024-01-25T00:00:00.000Z'
      }
    ];

    return NextResponse.json(storeItems);
  } catch (error) {
    console.error('Failed to load store items', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
