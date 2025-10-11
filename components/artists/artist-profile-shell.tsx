'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useTranslation } from 'react-i18next';

import type { GetArtistProfileResult } from '@/lib/server/artists';
import { FollowButton } from '@/components/artists/follow-button';
import { ArtistMetrics } from '@/components/artists/artist-metrics';
import { ArtistProjectUpdates } from '@/components/artists/project-updates';
import { ExternalLinksGrid } from '@/components/artists/external-links-grid';
import { LinkedEvents } from '@/components/artists/linked-events';
import { ProjectCard } from '@/components/ui/cards/project-card';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1521119989659-a83eee488004';

const joinedFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

interface ArtistProfileShellProps {
  profile: GetArtistProfileResult;
  viewerId: string | null;
}

export function ArtistProfileShell({ profile, viewerId }: ArtistProfileShellProps) {
  const { t } = useTranslation();
  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const canEdit = viewerId === profile.id;
  const isAuthenticated = Boolean(viewerId);

  const tabs = useMemo(
    () => [
      { value: 'overview', label: t('artist.tabs.overview') },
      { value: 'projects', label: t('artist.tabs.projects') },
      { value: 'updates', label: t('artist.tabs.updates') },
      { value: 'portfolio', label: t('artist.tabs.portfolio') }
    ],
    [t]
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20">
      <header className="pt-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/20">
              <Image
                src={profile.avatarUrl ?? DEFAULT_AVATAR}
                alt={t('artist.profile.avatarAlt', { name: profile.name })}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white">{profile.name}</h1>
              <p className="mt-2 text-sm text-white/60">
                {profile.bio ?? t('artist.profile.emptyBio')}
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/40">
                {t('artist.profile.joined', { date: joinedFormatter.format(new Date(profile.createdAt)) })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canEdit ? (
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-primary/40 hover:text-primary"
              >
                {t('artist.actions.editProfile')}
              </Link>
            ) : (
              <FollowButton
                artistId={profile.id}
                initialIsFollowing={profile.isFollowing}
                isAuthenticated={isAuthenticated}
                onFollowerChange={setFollowerCount}
              />
            )}
          </div>
        </div>
      </header>

      <ArtistMetrics followerCount={followerCount} totalBackers={profile.totalBackers} projectCount={profile.projectCount} />

      <Tabs.Root defaultValue="overview" className="space-y-6">
        <Tabs.List className="flex flex-wrap gap-2 rounded-full bg-white/5 p-2">
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="rounded-full px-4 py-2 text-sm font-medium text-white/70 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="overview" className="space-y-8">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            {profile.bio ?? t('artist.profile.emptyBioDetailed')}
          </section>
          <section className="space-y-4">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{t('artist.events.title')}</h2>
              {canEdit && profile.events.length > 0 ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-primary transition hover:text-primary/80"
                >
                  {t('artist.events.manageCta')}
                </button>
              ) : null}
            </header>
            <LinkedEvents events={profile.events} canEdit={canEdit} />
          </section>
          <section className="space-y-4">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{t('artist.links.title')}</h2>
              {canEdit && profile.socialLinks.length > 0 ? (
                <Link
                  href="/profile"
                  className="text-xs font-semibold text-primary transition hover:text-primary/80"
                >
                  {t('artist.links.manageCta')}
                </Link>
              ) : null}
            </header>
            <ExternalLinksGrid links={profile.socialLinks} canEdit={canEdit} />
          </section>
        </Tabs.Content>

        <Tabs.Content value="projects" className="space-y-6">
          {profile.projects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-white/60">
              {t('artist.projects.empty')}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {profile.projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="updates">
          <ArtistProjectUpdates updates={profile.updates} />
        </Tabs.Content>


        <Tabs.Content value="portfolio">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            {canEdit ? t('artist.portfolio.editablePlaceholder') : t('artist.portfolio.placeholder')}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
