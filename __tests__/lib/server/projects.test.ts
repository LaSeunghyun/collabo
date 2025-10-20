import { ProjectStatus, UserRole } from '@/types/prisma';
import { getDb } from '@/lib/db/client';
import {
  createProject,
  deleteProject,
  getProjectSummaries,
  ProjectAccessDeniedError,
  ProjectNotFoundError,
  ProjectValidationError,
  updateProject,
} from '@/lib/server/projects';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  insert: jest.fn(function() {
    return this;
  }),
  update: jest.fn(function() {
    return this;
  }),
  delete: jest.fn(function() {
    return this;
  }),
  transaction: jest.fn().mockImplementation(async (callback) => await callback(mockDb)),
  query: {
    projects: {
      findMany: jest.fn(),
    },
    auditLogs: {
      create: jest.fn(),
    },
  },
};

jest.mock('@/lib/db/client', () => ({
  getDb: jest.fn(() => mockDb),
}));

const { revalidatePath } = jest.requireMock('next/cache') as {
  revalidatePath: jest.Mock;
};

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
  fundings: [{ id: 'funding-1' }, { id: 'funding-2' }, { id: 'funding-3' }],
});

describe('project domain service', () => {
  let nowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    jest.clearAllMocks();
    (getDb as jest.Mock).mockReturnValue(mockDb);

    nowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2024-01-10T00:00:00Z').getTime());
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  describe('getProjectSummaries', () => {
    it('maps database projects into summaries with default thumbnail', async () => {
      const mockProjects = [sampleSummaryRecord()];
      (mockDb.limit as jest.Mock).mockResolvedValue(mockProjects);

      const summaries = await getProjectSummaries();

      expect(mockDb.select).toHaveBeenCalled();
      expect(summaries).toHaveLength(1);
      expect(summaries[0]).toMatchObject({
        id: 'project-1',
        thumbnail: expect.stringContaining('images.unsplash.com'),
        participants: 3,
        remainingDays: expect.any(Number),
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
        ownerId: OWNER_CUID,
      };
      mockDb.returning.mockResolvedValue([{ id: 'project-1' }]);
      (mockDb.limit as jest.Mock).mockResolvedValue([sampleSummaryRecord()]);

      const summary = await createProject(input, adminUser);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: OWNER_CUID, status: ProjectStatus.DRAFT })
      );

      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(revalidatePath).toHaveBeenCalledWith('/projects');
      expect(revalidatePath).toHaveBeenCalledWith('/projects/project-1');
      expect(summary?.id).toBe('project-1');
    });

    it('throws validation error before hitting db when payload is invalid', async () => {
      await expect(createProject({}, adminUser)).rejects.toBeInstanceOf(
        ProjectValidationError
      );
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('updateProject', () => {
    const owner = { id: OWNER_CUID, role: UserRole.CREATOR } as const;

    it('updates fields and records audit for owner', async () => {
      (mockDb.limit as jest.Mock).mockResolvedValue([{ ownerId: OWNER_CUID }]);
      mockDb.returning.mockResolvedValue([sampleSummaryRecord()]);

      const updatedSummary = await updateProject(
        'project-1',
        { title: 'Updated' },
        owner
      );

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated' })
      );
      expect(mockDb.where).toHaveBeenCalled();

      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(revalidatePath).toHaveBeenCalledWith('/projects');
      expect(revalidatePath).toHaveBeenCalledWith('/projects/project-1');
      expect(updatedSummary?.id).toBe('project-1');
    });

    it('throws when user tries to edit someone else project', async () => {
      (mockDb.limit as jest.Mock).mockResolvedValue([{ ownerId: 'other' }]);

      await expect(
        updateProject('project-1', { title: 'Updated' }, owner)
      ).rejects.toBeInstanceOf(ProjectAccessDeniedError);
    });

    it('returns summary directly when no changes detected', async () => {
      (mockDb.limit as jest.Mock).mockResolvedValueOnce([{ ownerId: OWNER_CUID }]);
      (mockDb.limit as jest.Mock).mockResolvedValueOnce([sampleSummaryRecord()]);

      const summary = await updateProject('project-1', {}, owner);

      expect(mockDb.update).not.toHaveBeenCalled();
      expect(summary?.id).toBe('project-1');
    });

    it('raises when project is missing', async () => {
      (mockDb.limit as jest.Mock).mockResolvedValue([]);

      await expect(
        updateProject('missing', { title: 'X' }, owner)
      ).rejects.toBeInstanceOf(ProjectNotFoundError);
    });
  });

  describe('deleteProject', () => {
    const owner = { id: OWNER_CUID, role: UserRole.CREATOR } as const;

    it('removes project and writes audit entry', async () => {
      (mockDb.limit as jest.Mock).mockResolvedValue([{ ownerId: OWNER_CUID }]);
      mockDb.returning.mockResolvedValue([{}]);

      await deleteProject('project-1', owner);

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();

      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(revalidatePath).toHaveBeenCalledWith('/projects');
      expect(revalidatePath).toHaveBeenCalledWith('/projects/project-1');
    });
  });
});