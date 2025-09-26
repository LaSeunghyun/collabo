'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { HeroCarousel } from '@/components/sections/hero-carousel';
import { CategoryFilter } from '@/components/sections/category-filter';
import { ProjectCard } from '@/components/shared/project-card';
import { SectionHeader } from '@/components/shared/section-header';
import { StoreCard } from '@/components/shared/store-card';
import { demoProjects } from '@/lib/data/projects';

export default function HomePage() {
  const { t } = useTranslation();
  const storeItems = [
    {
      id: 'product-1',
      title: t('home.store.items.product1.title'),
      price: 89000,
      discount: 15,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'
    },
    {
      id: 'product-2',
      title: t('home.store.items.product2.title'),
      price: 129000,
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d'
    },
    {
      id: 'product-3',
      title: t('home.store.items.product3.title'),
      price: 159000,
      discount: 10,
      image: 'https://images.unsplash.com/photo-1485579149621-3123dd979885'
    }
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 pb-20">
      <section className="pt-4 lg:pt-0">
        <HeroCarousel />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <SectionHeader
            title={t('home.livePopular')}
            href="/projects"
            ctaLabel={t('actions.viewMore') ?? undefined}
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {demoProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
            {t('home.liveAma.tag')}
          </h3>
          <p className="text-2xl font-semibold text-white">{t('home.liveAma.title')}</p>
          <p className="text-sm text-white/60">{t('home.liveAma.description')}</p>
          <Link href="/projects/1" className="inline-flex w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            {t('home.liveAma.cta')}
          </Link>
        </div>
      </section>

      <CategoryFilter />

      <section>
        <SectionHeader
          title={t('home.closingSoon')}
          href="/projects?sort=closing"
          ctaLabel={t('actions.viewMore') ?? undefined}
        />
        <div className="flex gap-6 overflow-x-auto pb-4">
          {demoProjects.map((project) => (
            <div key={project.id} className="min-w-[280px] max-w-xs flex-1">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title={t('home.themes')}
          href="/projects?theme=1"
          ctaLabel={t('actions.viewMore') ?? undefined}
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {demoProjects.map((project) => (
            <ProjectCard key={`theme-${project.id}`} project={project} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title={t('home.store.title')}
          href="/projects?tab=store"
          ctaLabel={t('actions.viewMore') ?? undefined}
        />
        <div className="grid gap-6 md:grid-cols-3">
          {storeItems.map((item) => (
            <StoreCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
