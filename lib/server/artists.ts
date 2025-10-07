import { randomUUID } from 'crypto';
import { cache } from 'react';
import { Prisma } from '@prisma/client';
import { PostType, UserRole } from '@/types/auth';

import type { SessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { getProjectSummaries } from '@/lib/server/projects';

export interface ArtistSocialLink {
  label: string;
  url: string;
}

export interface ArtistProjectUpdate {
  id: string;
  title: string;
  excerpt: string;
  createdAt: string;
  projectId?: string | null;
  projectTitle?: string | null;
}

export interface ArtistEventSummary {
  id: string;
  title: string;
  startsAt?: string | null;
  status?: string | null;
  location?: string | null;
  url?: string | null;
}

export interface ArtistProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  followerCount: number;
  totalBackers: number;
  projectCount: number;
  projects: Awaited<ReturnType<typeof getProjectSummaries>>;
  socialLinks: ArtistSocialLink[];
  updates: ArtistProjectUpdate[];
  events: ArtistEventSummary[];
  isFollowing: boolean;
  createdAt: string;
}

export interface ArtistDirectoryEntry {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  followerCount: number;
  projectCount: number;
}

const parseSocialLinks = (links: Prisma.JsonValue | null): ArtistSocialLink[] => {
  if (!links) {
    return [];
  }

  if (Array.isArray(links)) {
    return links
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const label = 'label' in item && typeof item.label === 'string' ? item.label : null;
        const url = 'url' in item && typeof item.url === 'string' ? item.url : null;

        if (!label || !url) {
          return null;
        }

        return { label, url } satisfies ArtistSocialLink;
      })
      .filter((item): item is ArtistSocialLink => Boolean(item));
  }

  if (typeof links === 'object') {
    return Object.entries(links as Record<string, unknown>)
      .map(([label, value]) => {
        if (typeof value !== 'string' || !value.trim()) {
          return null;
        }

        return { label, url: value } satisfies ArtistSocialLink;
      })
      .filter((item): item is ArtistSocialLink => Boolean(item));
  }

  return [];
};

const fetchArtistEvents = async (artistId: string): Promise<ArtistEventSummary[]> => {
  const eventClient = (prisma as unknown as {
    eventRegistration?: {
      findMany: (args: { where?: Record<string, unknown>; orderBy?: Record<string, unknown> }) => Promise<unknown[]>;
    };
  }).eventRegistration;

  if (!eventClient) {
    return [];
  }

  try {
    const events = await eventClient.findMany({
      where: {
        OR: [
          { artistId },
          { userId: artistId },
          { ownerId: artistId }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    return events.map((event: any) => {
      const title =
        typeof event?.title === 'string'
          ? event.title
          : typeof event?.name === 'string'
            ? event.name
            : 'Untitled event';

      return {
        id: String(event?.id ?? randomUUID()),
        title,
        startsAt:
          typeof event?.startsAt === 'string'
            ? event.startsAt
            : event?.startsAt instanceof Date
              ? event.startsAt.toISOString()
              : null,
        status: typeof event?.status === 'string' ? event.status : null,
        location: typeof event?.location === 'string' ? event.location : null,
        url: typeof event?.url === 'string' ? event.url : null
      } satisfies ArtistEventSummary;
    });
  } catch (error) {
    console.warn('EventRegistration lookup failed, returning empty array.', error);
    return [];
  }
};

const fetchArtistUpdates = async (artistId: string): Promise<ArtistProjectUpdate[]> => {
  const updates = await prisma.post.findMany({
    where: { authorId: artistId, type: PostType.UPDATE },
    include: { project: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
    take: 12
  });

  return updates.map((update) => ({
    id: update.id,
    title: update.title,
    excerpt: update.excerpt ?? update.content.slice(0, 160),
    createdAt: update.createdAt.toISOString(),
    projectId: update.projectId,
    projectTitle: update.project?.title ?? null
  } satisfies ArtistProjectUpdate));
};

const fetchArtistStats = async (artistId: string) => {
    const [followerCount, projectCount, distinctBackers] = await Promise.all([
      prisma.userFollow.count({ where: { followingId: artistId } }),
      prisma.project.count({ where: { ownerId: artistId } }),
      prisma.funding.findMany({
        where: { project: { ownerId: artistId } },
        distinct: ['userId'],
        select: { userId: true }
      })
    ]);

    const normalizedBackers = Array.isArray(distinctBackers) ? distinctBackers : [];

    return {
      followerCount,
      projectCount,
      totalBackers: normalizedBackers.length
    };
  };

const fetchIsFollowing = async (artistId: string, viewer?: SessionUser | null) => {
  if (!viewer?.id || viewer.id === artistId) {
    return false;
  }

  const follow = await prisma.userFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId: viewer.id,
        followingId: artistId
      }
    }
  });

  return Boolean(follow);
};

export const getArtistProfile = cache(async (artistId: string, viewer?: SessionUser | null) => {
  const artist = await prisma.user.findUnique({
    where: { id: artistId },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
      socialLinks: true,
      createdAt: true
    }
  });

  if (!artist) {
    return null;
  }

  const [projects, stats, updates, events, isFollowing] = await Promise.all([
    getProjectSummaries({ ownerId: artistId }),
    fetchArtistStats(artistId),
    fetchArtistUpdates(artistId),
    fetchArtistEvents(artistId),
    fetchIsFollowing(artistId, viewer)
  ]);

  return {
    id: artist.id,
    name: artist.name,
    avatarUrl: artist.avatarUrl ?? null,
    bio: artist.bio ?? null,
    followerCount: stats.followerCount,
    totalBackers: stats.totalBackers,
    projectCount: stats.projectCount,
    projects,
    socialLinks: parseSocialLinks(artist.socialLinks),
    updates,
    events,
    isFollowing,
    createdAt: artist.createdAt.toISOString()
  } satisfies ArtistProfile;
});

export type GetArtistProfileResult = NonNullable<Awaited<ReturnType<typeof getArtistProfile>>>;

export const listFeaturedArtists = cache(async (): Promise<ArtistDirectoryEntry[]> => {
  try {
    const artists = await prisma.user.findMany({
      where: { role: UserRole.CREATOR },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        _count: {
          select: {
            followers: true,
            projects: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 12
    });

    return artists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      avatarUrl: artist.avatarUrl,
      bio: artist.bio,
      followerCount: artist._count.followers,
      projectCount: artist._count.projects
    } satisfies ArtistDirectoryEntry));
  } catch (error) {
    console.error('Failed to fetch artist directory.', error);
    return [];
  }
});

