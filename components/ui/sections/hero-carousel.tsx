'use client';

import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useQuery } from '@tanstack/react-query';
import { fetchHeroSlides } from '@/lib/api/hero-slides';
import type { HeroSlide } from '@/app/api/hero-slides/route';

export function HeroCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 6000 })]);
  
  const { data: slides = [], isLoading } = useQuery({
    queryKey: ['hero-slides'],
    queryFn: fetchHeroSlides,
    staleTime: 1000 * 60 * 5 // 5분
  });

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-[40px] border border-white/10 bg-white/10">
        <div className="flex h-[240px] lg:h-[420px] items-center justify-center">
          <div className="text-white/60">로딩 중...</div>
        </div>
      </div>
    );
  }

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
                {slide.link ? (
                  <Link
                    href={slide.link}
                    className="mt-2 inline-flex w-fit items-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-neutral-900 hover:bg-white/90 transition-colors"
                  >
                    자세히 보기
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="mt-2 inline-flex w-fit items-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-neutral-900 hover:bg-white/90 transition-colors"
                  >
                    자세히 보기
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
