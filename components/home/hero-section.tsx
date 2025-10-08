'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HeroSectionProps {
  projectsCount: number;
  communityCount: number;
  artistsCount: number;
}

export function HeroSection({ projectsCount, communityCount, artistsCount }: HeroSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="pt-6">
      <div className="grid gap-8 rounded-4xl border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-950 p-10 lg:grid-cols-[3fr_2fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
            <Sparkles className="h-4 w-4" />
            {t('home.hero.tagline')}
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
            {t('home.hero.title')}
          </h1>
          <p className="max-w-2xl text-base text-white/70">{t('home.hero.subtitle')}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/artists"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              {t('home.hero.ctaArtists')}
            </Link>
            <Link
              href="/community"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:text-white"
            >
              {t('home.hero.ctaCommunity')}
            </Link>
          </div>
        </div>
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          <MetricRow label={t('home.hero.metrics.projects')} value={projectsCount} />
          <MetricRow label={t('home.hero.metrics.community')} value={communityCount} />
          <MetricRow label={t('home.hero.metrics.artists')} value={artistsCount} />
        </div>
      </div>
    </section>
  );
}

interface MetricRowProps {
  label: string;
  value: number;
}

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="text-2xl font-semibold text-white">{value}</span>
    </div>
  );
}
