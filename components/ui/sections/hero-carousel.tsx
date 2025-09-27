'use client';

import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

const slides = [
  {
    id: 'banner-1',
    title: 'Wonderwall Live Class',
    description: 'Top creators host masterclasses and AMAs every week.',
    image: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee'
  },
  {
    id: 'banner-2',
    title: 'Make your fandom goods',
    description: 'Collaborate with studios to launch bespoke merch drops.',
    image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef'
  },
  {
    id: 'banner-3',
    title: 'Hybrid Concert Experience',
    description: 'Immersive XR stage with real-time community voting.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819'
  }
];

export function HeroCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 6000 })]);

  return (
    <div className="overflow-hidden rounded-[40px] border border-white/10 bg-white/10" ref={emblaRef}>
      <div className="flex">
        {slides.map((slide) => (
          <div key={slide.id} className="relative flex min-w-0 flex-[0_0_100%] flex-col lg:h-[420px]">
            <div className="relative h-60 w-full overflow-hidden lg:h-full">
              <Image src={slide.image} alt={slide.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex flex-col justify-center gap-4 p-8 text-white lg:w-1/2">
                <span className="text-xs uppercase tracking-[0.2em] text-white/60">Featured</span>
                <h2 className="text-2xl font-semibold lg:text-4xl">{slide.title}</h2>
                <p className="text-sm text-white/70 lg:text-base">{slide.description}</p>
                <button
                  type="button"
                  className="mt-2 inline-flex w-fit items-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-neutral-900"
                >
                  자세히 보기
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
