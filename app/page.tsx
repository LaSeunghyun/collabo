import Link from 'next/link';

import { HeroCarousel } from '@/components/sections/hero-carousel';
import { CategoryFilter } from '@/components/sections/category-filter';
import { ProjectCard } from '@/components/shared/project-card';
import { SectionHeader } from '@/components/shared/section-header';
import { StoreCard } from '@/components/shared/store-card';
import { demoProjects } from '@/lib/data/projects';

const storeItems = [
  {
    id: 'product-1',
    title: '한정판 투어 후드 티',
    price: 89000,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'
  },
  {
    id: 'product-2',
    title: '프리미엄 온라인 클래스 패스',
    price: 129000,
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d'
  },
  {
    id: 'product-3',
    title: '아티스트 사인 LP',
    price: 159000,
    discount: 10,
    image: 'https://images.unsplash.com/photo-1485579149621-3123dd979885'
  }
];

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 pb-20">
      <section className="pt-4 lg:pt-0">
        <HeroCarousel />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <SectionHeader title="실시간 인기" href="/projects" />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {demoProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Live AMA</h3>
          <p className="text-2xl font-semibold text-white">이번 주 라이브 클래스</p>
          <p className="text-sm text-white/60">
            아티스트와 직접 소통하는 원더월 스타일 AMA 세션. 지금 예약하면 얼리버드 혜택을 드립니다.
          </p>
          <Link href="/projects/1" className="inline-flex w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            참가 신청
          </Link>
        </div>
      </section>

      <CategoryFilter />

      <section>
        <SectionHeader title="마감 임박" href="/projects?sort=closing" />
        <div className="flex gap-6 overflow-x-auto pb-4">
          {demoProjects.map((project) => (
            <div key={project.id} className="min-w-[280px] max-w-xs flex-1">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="테마별 추천" href="/projects?theme=1" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {demoProjects.map((project) => (
            <ProjectCard key={`theme-${project.id}`} project={project} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="스토어" href="/projects?tab=store" />
        <div className="grid gap-6 md:grid-cols-3">
          {storeItems.map((item) => (
            <StoreCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
