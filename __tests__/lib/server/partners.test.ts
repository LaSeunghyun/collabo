import { createPartnerProfile, PartnerAccessDeniedError, updatePartnerProfile } from '@/lib/server/partners';
import { getDbClient } from '@/lib/db/client';
import { eq, and, or, like, desc, count, inArray, not } from 'drizzle-orm';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

// Drizzle Ŭ���̾�Ʈ ��ŷ
jest.mock('@/lib/db/client', () => ({
  getDbClient: jest.fn()
}));

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  eq,
  and,
  or,
  like,
  desc,
  count,
  inArray,
  not
};

const mockGetDbClient = getDbClient as jest.MockedFunction<typeof getDbClient>;
const { revalidatePath } = jest.requireMock('next/cache') as { revalidatePath: jest.Mock };

const OWNER_CUID = 'ckv8n6x9g000001l4bdr4q0d4';

// const partnerSummaryRecord = () => ({
//   id: 'partner-1',
//   name: 'Studio',
//   type: 'STUDIO',
//   verified: true,
//   description: 'desc',
//   location: 'Seoul',
//   portfolioUrl: 'https://portfolio.test',
//   contactInfo: 'contact@test.co',
//   matchCount: 2,
//   user: { id: OWNER_CUID, name: 'Creator', avatarUrl: null, role: 'PARTNER' },
//   createdAt: '2024-01-01T00:00:00Z',
//   updatedAt: '2024-01-02T00:00:00Z'
// });

describe('partner domain service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDbClient.mockResolvedValue(mockDb as any);
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

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreatedPartner])
        })
      });

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
      ).rejects.toThrow();
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

      // Mock partner lookup
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ 
                id: 'partner-1', 
                userId: OWNER_CUID,
                user: {
                  id: OWNER_CUID,
                  name: 'Owner',
                  avatarUrl: null,
                  role: 'ADMIN'
                }
              }])
            })
          })
        })
      });
      
      // Mock partner update
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdatedPartner])
          })
        })
      });

      const result = await updatePartnerProfile('partner-1', payload, adminUser);

      expect(result.name).toBe('Updated Studio');
      expect(result.description).toBe('Updated description');
      expect(result.location).toBe('Busan');
      expect(revalidatePath).toHaveBeenCalledWith('/partners');
    });

    it('throws when partner not found', async () => {
      mockDb.select.mockResolvedValue([]);

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

      await expect(
        updatePartnerProfile('partner-1', payload, { id: 'user-1', role: 'PARTICIPANT' } as any)
      ).rejects.toBeInstanceOf(PartnerAccessDeniedError);
    });
  });
});
