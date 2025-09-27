'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ArtistProjectUpdate } from '@/lib/server/artists';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium'
});

interface ProjectUpdatesProps {
  updates: ArtistProjectUpdate[];
}

export function ArtistProjectUpdates({ updates }: ProjectUpdatesProps) {
  const { t } = useTranslation();
  const sorted = useMemo(
    () => [...updates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [updates]
  );

  if (sorted.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-white/60">
        {t('artist.updates.empty')}
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {sorted.map((update) => (
        <li key={update.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{update.title}</h3>
              <p className="mt-2 text-sm text-white/70">{update.excerpt}</p>
              {update.projectTitle ? (
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/40">
                  {t('artist.updates.projectLabel', { title: update.projectTitle })}
                </p>
              ) : null}
            </div>
            <time className="text-xs text-white/50" dateTime={update.createdAt}>
              {dateFormatter.format(new Date(update.createdAt))}
            </time>
          </div>
        </li>
      ))}
    </ul>
  );
}
