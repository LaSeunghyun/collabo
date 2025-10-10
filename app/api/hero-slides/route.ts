import { NextResponse } from 'next/server';

export interface HeroSlide {
  id: string;
  title: string;
  description: string;
  image: string;
  link?: string;
  isActive: boolean;
  order: number;
}

export async function GET() {
  try {
    // ?�제로는 ?�이?�베?�스?�서 가?��????��?�? ?�단 ?�드코딩???�이?��? 반환
    const slides: HeroSlide[] = [
      {
        id: 'banner-1',
        title: 'Wonderwall Live Class',
        description: 'Top creators host masterclasses and AMAs every week.',
        image: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee',
        link: '/projects?category=music',
        isActive: true,
        order: 1
      },
      {
        id: 'banner-2',
        title: 'Make your fandom goods',
        description: 'Collaborate with studios to launch bespoke merch drops.',
        image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef',
        link: '/store',
        isActive: true,
        order: 2
      },
      {
        id: 'banner-3',
        title: 'Hybrid Concert Experience',
        description: 'Immersive XR stage with real-time community voting.',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
        link: '/projects?category=tech',
        isActive: true,
        order: 3
      }
    ];

    return NextResponse.json(slides);
  } catch (error) {
    console.error('Failed to load hero slides', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
