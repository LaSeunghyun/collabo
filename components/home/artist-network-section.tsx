'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { SectionHeader } from '@/components/ui/headers/section-header';
import type { HomeArtistSummary } from '@/types/home';

interface ArtistNetworkSectionProps {
  artists: HomeArtistSummary[];
}

export function ArtistNetworkSection({ artists }: ArtistNetworkSectionProps) {
  const { t } = useTranslation();
  const hasArtists = artists.length > 0;

  return (
    <section>
      <SectionHeader
        title={t('home.sections.artistNetwork')}
        href="/artists"
        ctaLabel={t('actions.viewMore') ?? undefined}
      />
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {hasArtists ? <ArtistGrid artists={artists} /> : <ArtistSkeletons />}
      </div>
    </section>
  );
}

interface ArtistGridProps {
  artists: HomeArtistSummary[];
}

function ArtistGrid({ artists }: ArtistGridProps) {
  const { t } = useTranslation();

  return (
    <>
      {artists.map((artist) => (
        <Link
          key={artist.id}
          href={`/artists/${artist.id}`}
          className="group flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-primary/40 hover:bg-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
              {artist.avatarUrl ? (
                <Image src={artist.avatarUrl} alt={artist.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/70">
                  {artist.name.slice(0, 2)}
                </div>
              )}
            </div>
            <div>
              <p className="text-base font-semibold text-white group-hover:text-primary">{artist.name}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                {t('artist.directory.projectCount', { count: artist.projectCount })}
              </p>
            </div>
          </div>
          <p className="flex-1 text-sm text-white/70 line-clamp-3">{artist.bio ?? t('artist.profile.emptyBioDetailed')}</p>
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>{t('artist.directory.followerCount', { count: artist.followerCount })}</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-white/70">
              {t('artist.directory.viewProfile')}
            </span>
          </div>
        </Link>
      ))}
    </>
  );
}

function ArtistSkeletons() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`artist-skeleton-${index}`} className="h-56 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
      ))}
    </>
  );
}
