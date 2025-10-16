import { ProjectStatus, UserRole } from '@/types/prisma';
import { type MockPrisma, createPrismaMock } from '../../helpers/prisma-mock';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
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

const { revalidatePath } = jest.requireMock('next/cache') as { revalidatePath: jest.Mock };

import {
  createProject,
  deleteProject,
  getProjectSummaries,
  ProjectAccessDeniedError,
  ProjectNotFoundError,
  ProjectValidationError,
  updateProject
} from '@/lib/server/projects';

const OWNER_CUID = 'ckvcreatorowner0000000000001';

const sampleSummaryRecord = () => ({
  id: 'project-1',
  title: 'Sample',
  description: 'Desc',
  category: 'Music',
  thumbnail: null,
  targetAmount: 1000,
  currentAmount: 400,
  status: ProjectStatus.DRAFT,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  owner: { id: OWNER_CUID, name: 'Owner', avatarUrl: null },
  _count: { fundings: 3 }
});

describe('project domain service', () => {
  let nowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    mockPrisma = createPrismaMock();
    revalidatePath.mockReset();
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-10T00:00:00Z').getTime());
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  describe('getProjectSummaries', () => {
    it('maps database projects into summaries with default thumbnail', async () => {
      mockPrisma.project.findMany.mockResolvedValue([sampleSummaryRecord()]);

      const summaries = await getProjectSummaries();

      expect(mockPrisma.project.findMany).toHaveBeenCalled();
      expect(summaries).toHaveLength(1);
      expect(summaries[0]).toMatchObject({
        id: 'project-1',
        thumbnail: expect.stringContaining('images.unsplash.com'),
        participants: 3,
        remainingDays: expect.any(Number)
      });
      expect(summaries[0].remainingDays).toBeGreaterThan(0);
    });
  });

  describe('createProject', () => {
    const adminUser = { id: 'admin-1', role: UserRole.ADMIN } as const;

    it('persists a project using provided owner when user is admin', async () => {
      const input = {
        title: 'Project',
        description: 'A project',
        category: 'music',
        targetAmount: 1000,
        currency: 'KRW',
        ownerId: OWNER_CUID
      };
      mockPrisma.project.create.mockResolvedValue({ id: 'project-1' });
      mockPrisma.auditLog.create.mockResolvedValue(undefined);
      mockPrisma.project.findUnique.mockResolvedValue(sampleSummaryRecord());

      const summary = await createProject(input, adminUser);

      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ownerId: OWNER_CUID, status: ProjectStatus.DRAFT })
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'admin-1',
          action: 'PROJECT_CREATED',
          entityId: 'project-1'
        })
      });
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(revalidatePath).toHaveBeenCalledWith('/projects');
      expect(revalidatePath).toHaveBeenCalledWith('/projects/project-1');
      expect(summary?.id).toBe('project-1');
    });

    it('throws validation error before hitting prisma when payload is invalid', async () => {
      await expect(createProject({}, adminUser)).rejects.toBeInstanceOf(ProjectValidationError);
      expect(mockPrisma.project.create).not.toHaveBeenCalled();
    });
  });

  describe('updateProject', () => {
    const owner = { id: OWNER_CUID, role: UserRole.CREATOR } as const;

    it('updates fields and records audit for owner', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ ownerId: OWNER_CUID });
      mockPrisma.project.update.mockResolvedValue(undefined);
      mockPrisma.auditLog.create.mockResolvedValue(undefined);
      mockPrisma.project.findUnique.mockResolvedValueOnce({ ownerId: OWNER_CUID });
      mockPrisma.project.findUnique.mockResolvedValueOnce(sampleSummaryRecord());

      const updatedSummary = await updateProject('project-1', { title: 'Updated' }, owner);

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: expect.objectContaining({ title: 'Updated' })
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: OWNER_CUID,
          action: 'PROJECT_UPDATED'
        })
      });
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(revalidatePath).toHaveBeenCalledWith('/projects');
      expect(revalidatePath).toHaveBeenCalledWith('/projects/project-1');
      expect(updatedSummary?.id).toBe('project-1');
    });

    it('throws when user tries to edit someone else project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ ownerId: 'other' });

      await expect(updateProject('project-1', { title: 'Updated' }, owner)).rejects.toBeInstanceOf(
        ProjectAccessDeniedError
      );
    });

    it('returns summary directly when no changes detected', async () => {
      mockPrisma.project.findUnique.mockResolvedValueOnce({ ownerId: OWNER_CUID });
      mockPrisma.project.findUnique.mockResolvedValueOnce(sampleSummaryRecord());

      const summary = await updateProject('project-1', {}, owner);

      expect(mockPrisma.project.update).not.toHaveBeenCalled();
      expect(summary?.id).toBe('project-1');
    });

    it('raises when project is missing', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(updateProject('missing', { title: 'X' }, owner)).rejects.toBeInstanceOf(
        ProjectNotFoundError
      );
    });
  });

  describe('deleteProject', () => {
    const owner = { id: OWNER_CUID, role: UserRole.CREATOR } as const;

    it('removes project and writes audit entry', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ ownerId: OWNER_CUID });
      mockPrisma.project.delete.mockResolvedValue(undefined);
      mockPrisma.auditLog.create.mockResolvedValue(undefined);

      await deleteProject('project-1', owner);

      expect(mockPrisma.project.delete).toHaveBeenCalledWith({ where: { id: 'project-1' } });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'PROJECT_DELETED', entityId: 'project-1' })
      });
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(revalidatePath).toHaveBeenCalledWith('/projects');
      expect(revalidatePath).toHaveBeenCalledWith('/projects/project-1');
    });
  });
});
