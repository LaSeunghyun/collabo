'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ArtistListResponse {
  artists: {
    id: string;
    name: string;
    avatarUrl: string | null;
    bio: string | null;
    followerCount: number;
    projectCount: number;
  }[];
}

export default function ArtistsDirectoryPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useQuery<ArtistListResponse>({
    queryKey: ['artists', 'directory'],
    queryFn: async () => {
      const res = await fetch('/api/artists');
      if (!res.ok) {
        throw new Error('Failed to load artists');
      }
      return (await res.json()) as ArtistListResponse;
    },
    staleTime: 60_000
  });

  const artists = data?.artists ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20">
      <div className="pt-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                <Users className="h-4 w-4" />
                <span>{t('artist.directory.tagline')}</span>
              </p>
              <h1 className="text-4xl font-semibold text-white">{t('artist.directory.title')}</h1>
              <p className="text-sm text-white/70">{t('artist.directory.subtitle')}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-neutral-950/70 p-6 text-right">
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">{t('artist.directory.countLabel')}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{artists.length}</p>
              <p className="text-xs text-white/50">{t('artist.directory.countHint')}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-10">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : isError ? (
          <div className="space-y-4 rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100">
            <p>{t('artist.directory.error')}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full border border-red-300/60 px-4 py-2 text-xs font-semibold text-red-100 transition hover:border-red-200/80 hover:text-white"
            >
              {t('artist.directory.retry')}
            </button>
          </div>
        ) : artists.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center text-sm text-white/60">
            {t('artist.directory.empty')}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.id}`}
                className="group flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-primary/40 hover:bg-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
                    {artist.avatarUrl ? (
                      <Image
                        src={artist.avatarUrl}
                        alt={artist.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white/70">
                        {artist.name.slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white group-hover:text-primary">{artist.name}</h2>
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
          </div>
        )}
      </section>
    </div>
  );
}
