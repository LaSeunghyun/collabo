import { MilestoneStatus, PostType, UserRole } from '@/types/prisma';
import {
  assertProjectOwner,
  createProjectUpdate,
  deleteProjectUpdate,
  listProjectUpdates,
  ProjectUpdateAccessDeniedError,
  ProjectUpdateNotFoundError,
  updateProjectUpdate
} from '@/lib/server/project-updates';
import { type MockPrisma, createPrismaMock } from '../../helpers/prisma-mock';

let mockPrisma: MockPrisma = createPrismaMock();

jest.mock('@/lib/prisma', () => ({
  get prisma() {
    return mockPrisma;
  },
  get default() {
    return mockPrisma;
  }
}));

const basePost = () => ({
  id: 'post-1',
  title: 'Update title',
  content: 'Content body',
  excerpt: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  authorId: 'owner-1',
  projectId: 'project-1',
  type: PostType.UPDATE,
  milestone: { id: 'milestone-1', title: 'Milestone', status: MilestoneStatus.COMPLETED },
  author: { id: 'owner-1', name: 'Owner', avatarUrl: null },
  _count: { likes: 2, comments: 1 }
});

describe('project updates domain service', () => {
  beforeEach(() => {
    mockPrisma = createPrismaMock();
  });

  describe('assertProjectOwner', () => {
    it('throws when user lacks creator/admin role', async () => {
      await expect(
        assertProjectOwner('project-1', { id: 'u1', role: UserRole.PARTICIPANT } as any)
      ).rejects.toBeInstanceOf(ProjectUpdateAccessDeniedError);
    });

    it('returns project info for owner', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-1', ownerId: 'owner-1' });

      const project = await assertProjectOwner(
        'project-1',
        { id: 'owner-1', role: UserRole.CREATOR } as any
      );

      expect(project).toEqual({ id: 'project-1', ownerId: 'owner-1' });
    });
  });

  describe('listProjectUpdates', () => {
    it('throws when project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(listProjectUpdates('project-1')).rejects.toBeInstanceOf(ProjectUpdateNotFoundError);
    });

    it('restricts to public updates when viewer lacks supporter access', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-1', ownerId: 'owner-1' });
      mockPrisma.funding.count.mockResolvedValue(0);
      mockPrisma.userFollow.count.mockResolvedValue(0);
      mockPrisma.post.findMany.mockResolvedValue([basePost()]);
      mockPrisma.postLike.findMany.mockResolvedValue([]);

      const updates = await listProjectUpdates('project-1', null);

      const args = mockPrisma.post.findMany.mock.calls[0][0];
      expect(args.where.visibility).toBe('PUBLIC');
      expect(updates[0]).toMatchObject({
        liked: false,
        canEdit: false,
        likes: 2,
        comments: 1
      });
    });

    it('includes private updates for supporters and marks liked posts', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-1', ownerId: 'owner-1' });
      mockPrisma.funding.count.mockResolvedValue(1);
      mockPrisma.userFollow.count.mockResolvedValue(0);
      mockPrisma.post.findMany.mockResolvedValue([basePost()]);
      mockPrisma.postLike.findMany.mockResolvedValue([{ postId: 'post-1' }]);

      const viewer = { id: 'supporter-1', role: UserRole.PARTICIPANT } as any;
      const updates = await listProjectUpdates('project-1', viewer);

      const args = mockPrisma.post.findMany.mock.calls[0][0];
      expect(args.where.visibility).toBeUndefined();
      expect(args.where).toMatchObject({ projectId: 'project-1', type: PostType.UPDATE });
      expect(updates[0].liked).toBe(true);
    });
  });

  describe('createProjectUpdate', () => {
    it('validates milestone ownership and returns mapped record', async () => {
      mockPrisma.project.findUnique.mockResolvedValueOnce({ id: 'project-1', ownerId: 'owner-1' });
      mockPrisma.projectMilestone.findFirst.mockResolvedValue({ id: 'milestone-1' });
      mockPrisma.post.create.mockResolvedValue(basePost());
      mockPrisma.postLike.findMany.mockResolvedValue([{ postId: 'post-1' }]);

      const record = await createProjectUpdate(
        'project-1',
        { title: 'Update', content: 'Content', milestoneId: 'milestone-1' },
        { id: 'owner-1', role: UserRole.CREATOR } as any
      );

      expect(mockPrisma.post.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'project-1',
          authorId: 'owner-1',
          title: 'Update'
        }),
        include: expect.anything()
      });
      expect(record.liked).toBe(true);
      expect(record.canEdit).toBe(true);
    });
  });

  describe('updateProjectUpdate', () => {
    it('updates existing posts and reuses liked status', async () => {
      mockPrisma.project.findUnique.mockResolvedValueOnce({ id: 'project-1', ownerId: 'owner-1' });
      mockPrisma.post.findFirst.mockResolvedValue({ id: 'post-1' });
      mockPrisma.post.update.mockResolvedValue(basePost());
      mockPrisma.postLike.findMany.mockResolvedValue([]);

      const record = await updateProjectUpdate(
        'project-1',
        'post-1',
        { title: 'Renamed' },
        { id: 'owner-1', role: UserRole.CREATOR } as any
      );

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: expect.objectContaining({ title: 'Renamed' }),
        include: expect.anything()
      });
      expect(record.liked).toBe(false);
    });

    it('throws when post is missing', async () => {
      mockPrisma.project.findUnique.mockResolvedValueOnce({ id: 'project-1', ownerId: 'owner-1' });
      mockPrisma.post.findFirst.mockResolvedValue(null);

      await expect(
        updateProjectUpdate(
          'project-1',
          'missing',
          { title: 'Renamed' },
          { id: 'owner-1', role: UserRole.CREATOR } as any
        )
      ).rejects.toBeInstanceOf(ProjectUpdateNotFoundError);
    });
  });

  describe('deleteProjectUpdate', () => {
    it('removes existing updates', async () => {
      mockPrisma.project.findUnique.mockResolvedValueOnce({ id: 'project-1', ownerId: 'owner-1' });
      mockPrisma.post.findFirst.mockResolvedValue({ id: 'post-1' });

      await deleteProjectUpdate('project-1', 'post-1', {
        id: 'owner-1',
        role: UserRole.CREATOR
      } as any);

      expect(mockPrisma.post.delete).toHaveBeenCalledWith({ where: { id: 'post-1' } });
    });
  });
});

