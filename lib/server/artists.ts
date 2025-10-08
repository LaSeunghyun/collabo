import { cache } from 'react';
import { eq, and, count } from 'drizzle-orm';

import type { SessionUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { 
  users, 
  posts, 
  projects, 
  userFollows, 
  fundings,
  projectMilestones
} from '@/lib/db/schema';
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

const parseSocialLinks = (links: unknown | null): ArtistSocialLink[] => {
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
  try {
    // ������Ʈ ���Ͻ����� �̺�Ʈ�� Ȱ��
    const db = await getDb();
    const milestones = await db
      .select({
        id: projectMilestones.id,
        title: projectMilestones.title,
        dueDate: projectMilestones.dueDate,
        status: projectMilestones.status,
        projectTitle: projects.title
      })
      .from(projectMilestones)
      .innerJoin(projects, eq(projectMilestones.projectId, projects.id))
      .where(eq(projects.ownerId, artistId))
      .orderBy(projectMilestones.dueDate)
      .limit(10);

    return milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      startsAt: milestone.dueDate,
      status: milestone.status,
      location: null,
      url: null
    } satisfies ArtistEventSummary));
  } catch (error) {
    console.warn('Failed to fetch artist events:', error);
    return [];
  }
};

const fetchArtistUpdates = async (artistId: string): Promise<ArtistProjectUpdate[]> => {
  try {
    const db = await getDb();
    const updates = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        excerpt: posts.excerpt,
        createdAt: posts.createdAt,
        projectId: posts.projectId,
        projectTitle: projects.title
      })
      .from(posts)
      .leftJoin(projects, eq(posts.projectId, projects.id))
      .where(and(
        eq(posts.authorId, artistId),
        eq(posts.type, 'UPDATE')
      ))
      .orderBy(posts.createdAt)
      .limit(12);

    return updates.map((update) => ({
      id: update.id,
      title: update.title,
      excerpt: update.excerpt ?? update.content.slice(0, 160),
      createdAt: update.createdAt,
      projectId: update.projectId,
      projectTitle: update.projectTitle ?? null
    } satisfies ArtistProjectUpdate));
  } catch (error) {
    console.warn('Failed to fetch artist updates:', error);
    return [];
  }
};

const fetchArtistStats = async (artistId: string) => {
  try {
    const db = await getDb();
    const [followerCountResult, projectCountResult, distinctBackersResult] = await Promise.all([
      db.select({ count: count() }).from(userFollows).where(eq(userFollows.followingId, artistId)),
      db.select({ count: count() }).from(projects).where(eq(projects.ownerId, artistId)),
      db.select({ userId: fundings.userId })
        .from(fundings)
        .innerJoin(projects, eq(fundings.projectId, projects.id))
        .where(eq(projects.ownerId, artistId))
    ]);

    const followerCount = followerCountResult[0]?.count || 0;
    const projectCount = projectCountResult[0]?.count || 0;
    
    // Get unique backers
    const uniqueBackers = new Set(distinctBackersResult.map(b => b.userId));
    const totalBackers = uniqueBackers.size;

    return {
      followerCount,
      projectCount,
      totalBackers
    };
  } catch (error) {
    console.warn('Failed to fetch artist stats:', error);
    return {
      followerCount: 0,
      projectCount: 0,
      totalBackers: 0
    };
  }
};

const fetchIsFollowing = async (artistId: string, viewer?: SessionUser | null) => {
  if (!viewer?.id || viewer.id === artistId) {
    return false;
  }

  try {
    const db = await getDb();
    const follow = await db
      .select()
      .from(userFollows)
      .where(and(
        eq(userFollows.followerId, viewer.id),
        eq(userFollows.followingId, artistId)
      ))
      .limit(1);

    return Boolean(follow[0]);
  } catch (error) {
    console.warn('Failed to check follow status:', error);
    return false;
  }
};

export const getArtistProfile = cache(async (artistId: string, viewer?: SessionUser | null) => {
  try {
    const db = await getDb();
    const artistResult = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        socialLinks: users.socialLinks,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, artistId))
      .limit(1);

    const artist = artistResult[0];
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
      createdAt: artist.createdAt
    } satisfies ArtistProfile;
  } catch (error) {
    console.error('Failed to get artist profile:', error);
    return null;
  }
});

export type GetArtistProfileResult = NonNullable<Awaited<ReturnType<typeof getArtistProfile>>>;

export const listFeaturedArtists = cache(async (): Promise<ArtistDirectoryEntry[]> => {
  try {
    const db = await getDb();
    const artists = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.role, 'CREATOR'))
      .orderBy(users.createdAt)
      .limit(12);

    // Get follower and project counts for each artist
    const artistsWithCounts = await Promise.all(
      artists.map(async (artist) => {
        const [followerCountResult, projectCountResult] = await Promise.all([
          db.select({ count: count() }).from(userFollows).where(eq(userFollows.followingId, artist.id)),
          db.select({ count: count() }).from(projects).where(eq(projects.ownerId, artist.id))
        ]);

        return {
          id: artist.id,
          name: artist.name,
          avatarUrl: artist.avatarUrl,
          bio: artist.bio,
          followerCount: followerCountResult[0]?.count || 0,
          projectCount: projectCountResult[0]?.count || 0
        } satisfies ArtistDirectoryEntry;
      })
    );

    return artistsWithCounts;
  } catch (error) {
    console.error('Failed to fetch artist directory.', error);
    return [];
  }
});

