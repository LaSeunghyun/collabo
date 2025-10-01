jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    cache: (fn: any) => fn
  };
});

import { UserRole } from '@/types/prisma';
import { getArtistProfile, listFeaturedArtists } from '@/lib/server/artists';
import { type MockPrisma, createPrismaMock } from '../../helpers/prisma-mock';

jest.mock('@/lib/server/projects', () => ({
  getProjectSummaries: jest.fn()
}));

let mockPrisma: MockPrisma = createPrismaMock();

jest.mock('@/lib/prisma', () => ({
  get prisma() {
    return mockPrisma;
  },
  get default() {
    return mockPrisma;
  }
}));

const { getProjectSummaries } = jest.requireMock('@/lib/server/projects') as {
  getProjectSummaries: jest.Mock;
};

const viewer = { id: 'viewer-1', role: UserRole.PARTICIPANT } as const;

const artistRecord = {
  id: 'artist-1',
  name: 'Artist',
  avatarUrl: 'https://avatar.test/img.png',
  bio: 'Bio',
  socialLinks: [
    { label: 'Instagram', url: 'https://instagram.com/artist' },
    { label: '', url: 'https://invalid' },
    { notValid: true }
  ],
  createdAt: new Date('2024-01-01T00:00:00Z')
};

describe('artist domain service', () => {
  beforeEach(() => {
    mockPrisma = createPrismaMock();
    getProjectSummaries.mockReset();
  });

  describe('getArtistProfile', () => {
    it('returns null when artist does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await getArtistProfile('missing');

      expect(result).toBeNull();
    });

    it('resolves composite profile with stats, updates, and follow state', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(artistRecord);
      getProjectSummaries.mockResolvedValue([{ id: 'project-1', title: 'Project' }]);
      mockPrisma.userFollow.count.mockResolvedValue(12);
      mockPrisma.project.count.mockResolvedValue(3);
      mockPrisma.funding.findMany.mockResolvedValue([{ userId: 'backer-1' }, { userId: 'backer-2' }]);
      mockPrisma.post.findMany.mockResolvedValue([
        {
          id: 'post-1',
          title: 'Update',
          content: 'Detailed update content that is long enough',
          excerpt: null,
          createdAt: new Date('2024-02-01T00:00:00Z'),
          projectId: 'project-1',
          project: { id: 'project-1', title: 'Project' }
        }
      ]);
      mockPrisma.eventRegistration.findMany.mockResolvedValue([
        {
          id: 'event-1',
          title: 'Showcase',
          startsAt: new Date('2024-03-01T12:00:00Z'),
          status: 'UPCOMING',
          location: 'Seoul',
          url: 'https://events.test/showcase'
        }
      ]);
      mockPrisma.userFollow.findUnique.mockResolvedValue({ id: 'follow-1' });

      const profile = await getArtistProfile(artistRecord.id, viewer);

      expect(profile).not.toBeNull();
      expect(profile?.id).toBe('artist-1');
      expect(profile?.projects).toEqual([{ id: 'project-1', title: 'Project' }]);
      expect(profile?.followerCount).toBe(12);
      expect(profile?.totalBackers).toBe(2);
      expect(profile?.updates[0]).toMatchObject({
        id: 'post-1',
        projectTitle: 'Project'
      });
      expect(profile?.events[0]).toMatchObject({
        id: 'event-1',
        title: 'Showcase'
      });
      expect(profile?.socialLinks).toEqual([
        { label: 'Instagram', url: 'https://instagram.com/artist' }
      ]);
      expect(profile?.isFollowing).toBe(true);
    });
  });

  describe('listFeaturedArtists', () => {
    it('maps prisma records into directory entries', async () => {
      const artists = [
        {
          id: 'artist-1',
          name: 'Artist One',
          avatarUrl: null,
          bio: 'Bio',
          _count: { followers: 2, projects: 1 }
        }
      ];
      mockPrisma.user.findMany.mockResolvedValue(artists);

      const result = await listFeaturedArtists();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: UserRole.CREATOR },
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          bio: true,
          _count: { select: { followers: true, projects: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 12
      });
      expect(result).toEqual([
        {
          id: 'artist-1',
          name: 'Artist One',
          avatarUrl: null,
          bio: 'Bio',
          followerCount: 2,
          projectCount: 1
        }
      ]);
    });

    it('returns empty array when prisma throws', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      mockPrisma.user.findMany.mockRejectedValue(new Error('db error'));

      const result = await listFeaturedArtists();

      expect(result).toEqual([]);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});
