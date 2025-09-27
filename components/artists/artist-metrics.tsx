'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface ArtistMetricsProps {
  followerCount: number;
  totalBackers: number;
  projectCount: number;
}

const formatter = new Intl.NumberFormat();

export function ArtistMetrics({ followerCount, totalBackers, projectCount }: ArtistMetricsProps) {
  const { t } = useTranslation();
  const items = useMemo(
    () => [
      {
        id: 'followers',
        label: t('artist.metrics.followers'),
        value: formatter.format(followerCount)
      },
      {
        id: 'backers',
        label: t('artist.metrics.backers'),
        value: formatter.format(totalBackers)
      },
      {
        id: 'projects',
        label: t('artist.metrics.projects'),
        value: formatter.format(projectCount)
      }
    ],
    [followerCount, totalBackers, projectCount, t]
  );

  return (
    <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/60">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
        </article>
      ))}
    </section>
  );
}
