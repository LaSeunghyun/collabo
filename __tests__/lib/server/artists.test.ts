jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    cache: (fn: any) => fn
  };
});

import { UserRole } from '@/types/shared';
import { getArtistProfile, listFeaturedArtists } from '@/lib/server/artists';
import { getDbClient } from '@/lib/db/client';
import { eq, and, count } from 'drizzle-orm';

// Drizzle Ŭ���̾�Ʈ ��ŷ
jest.mock('@/lib/db/client', () => ({
  getDbClient: jest.fn()
}));

jest.mock('@/lib/server/projects', () => ({
  getProjectSummaries: jest.fn()
}));

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  eq,
  and,
  count
};

const mockGetDbClient = getDbClient as jest.MockedFunction<typeof getDbClient>;
const { getProjectSummaries } = jest.requireMock('@/lib/server/projects') as {
  getProjectSummaries: jest.Mock;
};

const viewer = { id: 'viewer-1', role: UserRole.PARTICIPANT, permissions: [] as string[] };

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
    jest.clearAllMocks();
    mockGetDbClient.mockResolvedValue(mockDb as any);
    getProjectSummaries.mockReset();
  });

  describe('getArtistProfile', () => {
    it('returns null when artist does not exist', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await getArtistProfile('missing');

      expect(result).toBeNull();
    });

    it('resolves composite profile with stats, updates, and follow state', async () => {
      // Mock artist data
      // Mock artist lookup
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([artistRecord])
          })
        })
      });
      
      // Mock other queries
      mockDb.select
        .mockResolvedValueOnce([{ count: 12 }]) // follower count
        .mockResolvedValueOnce([{ count: 3 }]) // project count
        .mockResolvedValueOnce([{ userId: 'backer-1' }, { userId: 'backer-2' }]) // backers
        .mockResolvedValueOnce([{ id: 'follow-1' }]) // follow check
        .mockResolvedValueOnce([ // updates
          {
            id: 'post-1',
            title: 'Update',
            content: 'Detailed update content that is long enough',
            excerpt: null,
            createdAt: new Date('2024-02-01T00:00:00Z'),
            projectId: 'project-1',
            projectTitle: 'Project'
          }
        ])
        .mockResolvedValueOnce([ // events (milestones)
          {
            id: 'milestone-1',
            title: 'Showcase',
            dueDate: new Date('2024-03-01T12:00:00Z'),
            status: 'PLANNED',
            projectTitle: 'Project'
          }
        ]);

      getProjectSummaries.mockResolvedValue([{ id: 'project-1', title: 'Project' }]);

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
        id: 'milestone-1',
        title: 'Showcase'
      });
      expect(profile?.socialLinks).toEqual([
        { label: 'Instagram', url: 'https://instagram.com/artist' }
      ]);
      expect(profile?.isFollowing).toBe(true);
    });
  });

  describe('listFeaturedArtists', () => {
    it('maps drizzle records into directory entries', async () => {
      const artists = [
        {
          id: 'artist-1',
          name: 'Artist One',
          avatarUrl: null,
          bio: 'Bio',
          createdAt: new Date('2024-01-01T00:00:00Z')
        }
      ];

      // Mock artists query
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(artists)
            })
          })
        })
      });
      
      // Mock follower and project counts
      mockDb.select
        .mockResolvedValueOnce([{ count: 2 }]) // follower count for artist-1
        .mockResolvedValueOnce([{ count: 1 }]); // project count for artist-1

      const result = await listFeaturedArtists();

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

    it('returns empty array when database throws', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      mockDb.select.mockRejectedValue(new Error('db error'));

      const result = await listFeaturedArtists();

      expect(result).toEqual([]);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});
