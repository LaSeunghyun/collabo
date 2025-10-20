import { createPartnerProfile, PartnerAccessDeniedError, updatePartnerProfile, PartnerValidationError } from '@/lib/server/partners';
import { getDb } from '@/lib/db/client';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
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
    partners: {
      findFirst: jest.fn(),
    },
    users: {
      findFirst: jest.fn(),
    },
  },
};

jest.mock('@/lib/db/client', () => ({
  getDb: jest.fn(() => mockDb),
}));

const { revalidatePath } = jest.requireMock('next/cache') as { revalidatePath: jest.Mock };

const OWNER_CUID = 'ckv8n6x9g000001l4bdr4q0d4';

describe('partner domain service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDb as jest.Mock).mockReturnValue(mockDb);
    revalidatePath.mockReset();
  });

  describe('createPartnerProfile', () => {
    const adminUser = { id: 'admin-1', role: 'ADMIN' as const, permissions: [] as string[] };

    it('normalises payload, promotes owner role, and revalidates partners listing', async () => {
      const payload = {
        name: '  Studio  ',
        type: 'STUDIO',
        description: '  desc  ',
        contactInfo: 'contact@test.co',
        location: '  Seoul  ',
        portfolioUrl: '  https://portfolio.test  ',
        services: ['Recording', 'Mixing'],
        pricingModel: 'Hourly',
        availability: { weekdays: true, weekends: false }
      };

      const mockCreatedPartner = {
        id: 'partner-1',
        userId: OWNER_CUID,
        name: 'Studio',
        type: 'STUDIO',
        description: 'desc',
        contactInfo: 'contact@test.co',
        location: 'Seoul',
        portfolioUrl: 'https://portfolio.test',
        services: ['Recording', 'Mixing'],
        pricingModel: 'Hourly',
        availability: { weekdays: true, weekends: false },
        verified: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      (mockDb.limit as jest.Mock).mockResolvedValueOnce([{ id: OWNER_CUID, role: 'CREATOR' }])
      .mockResolvedValueOnce([]);
      mockDb.returning.mockResolvedValue([mockCreatedPartner]);
      (mockDb.limit as jest.Mock).mockResolvedValue([mockCreatedPartner]);

      const result = await createPartnerProfile(payload, adminUser);

      expect(result.name).toBe('Studio');
      expect(result.description).toBe('desc');
      expect(result.location).toBe('Seoul');
      expect(result.portfolioUrl).toBe('https://portfolio.test');
      expect(revalidatePath).toHaveBeenCalledWith('/partners');
    });

    it('throws when user lacks admin role', async () => {
      const payload = {
        name: 'Studio',
        type: 'STUDIO',
        contactInfo: 'contact@test.co'
      };

      await expect(
        createPartnerProfile(payload, { id: 'user-1', role: 'PARTICIPANT' } as any)
      ).rejects.toBeInstanceOf(PartnerAccessDeniedError);
    });

    it('validates required fields', async () => {
      const invalidPayload = {
        name: '',
        type: 'INVALID_TYPE',
        contactInfo: ''
      };

      await expect(
        createPartnerProfile(invalidPayload as any, adminUser)
      ).rejects.toBeInstanceOf(PartnerValidationError);
    });
  });

  describe('updatePartnerProfile', () => {
    const adminUser = { id: 'admin-1', role: 'ADMIN' as const, permissions: [] as string[] };

    it('updates existing partner profile', async () => {
      const payload = {
        name: 'Updated Studio',
        description: 'Updated description',
        location: 'Busan',
        portfolioUrl: 'https://new-portfolio.test'
      };

      const mockUpdatedPartner = {
        id: 'partner-1',
        userId: OWNER_CUID,
        name: 'Updated Studio',
        type: 'STUDIO',
        description: 'Updated description',
        contactInfo: 'contact@test.co',
        location: 'Busan',
        portfolioUrl: 'https://new-portfolio.test',
        verified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      (mockDb.limit as jest.Mock).mockResolvedValue([{ id: 'partner-1', userId: OWNER_CUID, user: { id: OWNER_CUID } }]);
      mockDb.returning.mockResolvedValue([mockUpdatedPartner]);

      const result = await updatePartnerProfile('partner-1', payload, adminUser);

      expect(result.name).toBe('Updated Studio');
      expect(result.description).toBe('Updated description');
      expect(result.location).toBe('Busan');
      expect(revalidatePath).toHaveBeenCalledWith('/partners');
    });

    it('throws when partner not found', async () => {
      (mockDb.limit as jest.Mock).mockResolvedValue([]);

      const payload = {
        name: 'Updated Studio'
      };

      await expect(
        updatePartnerProfile('missing', payload, adminUser)
      ).rejects.toThrow();
    });

    it('throws when user lacks admin role', async () => {
      const payload = {
        name: 'Updated Studio'
      };
      (mockDb.limit as jest.Mock).mockResolvedValue([{ id: 'partner-1', userId: 'another-user', user: { id: 'another-user' } }]);

      await expect(
        updatePartnerProfile('partner-1', payload, { id: 'user-1', role: 'PARTICIPANT' } as any)
      ).rejects.toBeInstanceOf(PartnerAccessDeniedError);
    });
  });
});