'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import type { ArtistSocialLink } from '@/lib/server/artists';

interface ExternalLinksGridProps {
  links: ArtistSocialLink[];
  canEdit: boolean;
}

export function ExternalLinksGrid({ links, canEdit }: ExternalLinksGridProps) {
  const { t } = useTranslation();

  if (links.length === 0) {
    return (
      <div className="flex flex-col gap-4 rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-white/60">
        <p>{t('artist.links.empty')}</p>
        {canEdit ? (
          <Link
            href="/profile"
            className="inline-flex w-fit items-center justify-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            {t('artist.links.addLink')}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {links.map((link) => (
        <Link
          key={`${link.label}-${link.url}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-primary/40 hover:bg-primary/10"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">{link.label}</p>
          <p className="mt-2 text-sm font-semibold text-white group-hover:text-primary">{link.url}</p>
        </Link>
      ))}
    </div>
  );
}
