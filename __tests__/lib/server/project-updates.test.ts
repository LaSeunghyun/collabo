import {
  assertProjectOwner,
  createProjectUpdate,
  deleteProjectUpdate,
  listProjectUpdates,
  ProjectUpdateAccessDeniedError,
  ProjectUpdateNotFoundError,
  updateProjectUpdate
} from '@/lib/server/project-updates';
import { getDbClient } from '@/lib/db/client';
import { eq, and, desc, inArray } from 'drizzle-orm';

// Drizzle 클라이언트 모킹
jest.mock('@/lib/db/client', () => ({
  getDbClient: jest.fn()
}));

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq,
  and,
  desc,
  inArray
};

const mockGetDbClient = getDbClient as jest.MockedFunction<typeof getDbClient>;

const basePost = () => ({
  id: 'post-1',
  title: 'Update title',
  content: 'Content body',
  excerpt: null,
  createdAt: '2024-01-01T00:00:00Z',
  authorId: 'owner-1',
  projectId: 'project-1',
  type: 'UPDATE',
  milestone: { id: 'milestone-1', title: 'Milestone', status: 'COMPLETED' },
  author: { id: 'owner-1', name: 'Owner', avatarUrl: null },
  likes: 2,
  comments: 1
});

describe('project updates domain service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDbClient.mockResolvedValue(mockDb as any);
  });

  describe('assertProjectOwner', () => {
    it('throws when user lacks creator/admin role', async () => {
      await expect(
        assertProjectOwner('project-1', { id: 'u1', role: 'PARTICIPANT' } as any)
      ).rejects.toBeInstanceOf(ProjectUpdateAccessDeniedError);
    });

    it('returns project info for owner', async () => {
      mockDb.select.mockResolvedValue([{ id: 'project-1', ownerId: 'owner-1' }]);

      const project = await assertProjectOwner(
        'project-1',
        { id: 'owner-1', role: 'CREATOR' } as any
      );

      expect(project).toEqual({ id: 'project-1', ownerId: 'owner-1' });
    });

    it('throws when project not found', async () => {
      mockDb.select.mockResolvedValue([]);

      await expect(
        assertProjectOwner('missing', { id: 'u1', role: 'CREATOR' } as any)
      ).rejects.toBeInstanceOf(ProjectUpdateNotFoundError);
    });
  });

  describe('listProjectUpdates', () => {
    it('throws when project does not exist', async () => {
      mockDb.select.mockResolvedValue([]);

      await expect(listProjectUpdates('project-1')).rejects.toBeInstanceOf(ProjectUpdateNotFoundError);
    });

    it('restricts to public updates when viewer lacks supporter access', async () => {
      mockDb.select
        .mockResolvedValueOnce([{ id: 'project-1', ownerId: 'owner-1' }]) // project check
        .mockResolvedValueOnce([{ count: 0 }]) // funding count
        .mockResolvedValueOnce([basePost()]); // updates

      const updates = await listProjectUpdates('project-1', { id: 'viewer-1', role: 'PARTICIPANT' } as any);

      expect(updates).toHaveLength(1);
      expect(updates[0].id).toBe('post-1');
    });

    it('includes all updates for project owner', async () => {
      mockDb.select
        .mockResolvedValueOnce([{ id: 'project-1', ownerId: 'owner-1' }]) // project check
        .mockResolvedValueOnce([basePost()]); // updates

      const updates = await listProjectUpdates('project-1', { id: 'owner-1', role: 'CREATOR' } as any);

      expect(updates).toHaveLength(1);
      expect(updates[0].id).toBe('post-1');
    });
  });

  describe('createProjectUpdate', () => {
    it('creates update with valid data', async () => {
      const mockCreatedPost = {
        id: 'post-1',
        title: 'New Update',
        content: 'Content',
        excerpt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        authorId: 'owner-1',
        projectId: 'project-1',
        type: 'UPDATE',
        milestoneId: null,
        author: { id: 'owner-1', name: 'Owner', avatarUrl: null },
        likes: 0,
        comments: 0
      };

      mockDb.select.mockResolvedValue([{ id: 'project-1', ownerId: 'owner-1' }]);
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreatedPost])
        })
      });

      const result = await createProjectUpdate(
        'project-1',
        {
          title: 'New Update',
          content: 'Content',
          milestoneId: null,
          attachments: []
        },
        { id: 'owner-1', role: 'CREATOR', permissions: [] as string[] } as any
      );

      expect(result.id).toBe('post-1');
      expect(result.title).toBe('New Update');
    });

    it('throws when project not found', async () => {
      mockDb.select.mockResolvedValue([]);

      await expect(
        createProjectUpdate(
          'missing',
          { title: 'Update', content: 'Content', milestoneId: null, attachments: [] },
          { id: 'owner-1', role: 'CREATOR', permissions: [] as string[] } as any
        )
      ).rejects.toBeInstanceOf(ProjectUpdateNotFoundError);
    });
  });

  describe('updateProjectUpdate', () => {
    it('updates existing post', async () => {
      const mockUpdatedPost = {
        id: 'post-1',
        title: 'Updated Title',
        content: 'Updated Content',
        excerpt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        authorId: 'owner-1',
        projectId: 'project-1',
        type: 'UPDATE',
        milestoneId: null,
        author: { id: 'owner-1', name: 'Owner', avatarUrl: null },
        likes: 0,
        comments: 0
      };

      mockDb.select
        .mockResolvedValueOnce([{ id: 'project-1', ownerId: 'owner-1' }]) // project check
        .mockResolvedValueOnce([{ id: 'post-1', authorId: 'owner-1' }]); // post check

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdatedPost])
          })
        })
      });

      const result = await updateProjectUpdate(
        'project-1',
        'post-1',
        {
          title: 'Updated Title',
          content: 'Updated Content',
          milestoneId: null,
          attachments: []
        },
        { id: 'owner-1', role: 'CREATOR', permissions: [] as string[] } as any
      );

      expect(result.id).toBe('post-1');
      expect(result.title).toBe('Updated Title');
    });

    it('throws when post not found', async () => {
      mockDb.select
        .mockResolvedValueOnce([{ id: 'project-1', ownerId: 'owner-1' }]) // project check
        .mockResolvedValueOnce([]); // post check

      await expect(
        updateProjectUpdate(
          'project-1',
          'missing',
          { title: 'Update', content: 'Content', milestoneId: null, attachments: [] },
          { id: 'owner-1', role: 'CREATOR', permissions: [] as string[] } as any
        )
      ).rejects.toBeInstanceOf(ProjectUpdateNotFoundError);
    });
  });

  describe('deleteProjectUpdate', () => {
    it('deletes existing post', async () => {
      mockDb.select
        .mockResolvedValueOnce([{ id: 'project-1', ownerId: 'owner-1' }]) // project check
        .mockResolvedValueOnce([{ id: 'post-1', authorId: 'owner-1' }]); // post check

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue([{ id: 'post-1' }])
      });

      await deleteProjectUpdate('project-1', 'post-1', { id: 'owner-1', role: 'CREATOR', permissions: [] } as any);

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('throws when post not found', async () => {
      mockDb.select
        .mockResolvedValueOnce([{ id: 'project-1', ownerId: 'owner-1' }]) // project check
        .mockResolvedValueOnce([]); // post check

      await expect(
        deleteProjectUpdate('project-1', 'missing', { id: 'owner-1', role: 'CREATOR', permissions: [] } as any)
      ).rejects.toBeInstanceOf(ProjectUpdateNotFoundError);
    });
  });
});