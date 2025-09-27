'use client';

import { CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ArtistEventSummary } from '@/lib/server/artists';

interface LinkedEventsProps {
  events: ArtistEventSummary[];
  canEdit: boolean;
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export function LinkedEvents({ events, canEdit }: LinkedEventsProps) {
  const { t } = useTranslation();

  if (events.length === 0) {
    return (
      <div className="flex flex-col gap-4 rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-white/60">
        <p>{t('artist.events.empty')}</p>
        {canEdit ? (
          <button
            type="button"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            {t('artist.events.createCta')}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <article key={event.id} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-10 w-10 text-primary" aria-hidden />
            <div>
              <h3 className="text-base font-semibold text-white">{event.title}</h3>
              <p className="text-xs text-white/50">
                {event.startsAt ? dateTimeFormatter.format(new Date(event.startsAt)) : t('artist.events.tbd')}
              </p>
              {event.location ? <p className="text-xs text-white/50">{event.location}</p> : null}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {event.status ? (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
                {event.status}
              </span>
            ) : null}
            {event.url ? (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                {t('artist.events.viewDetails')}
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
