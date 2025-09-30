import { PartnerType, UserRole } from '@/types/prisma';
import { createPartnerProfile, PartnerAccessDeniedError, updatePartnerProfile } from '@/lib/server/partners';
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

const OWNER_CUID = 'ckv8n6x9g000001l4bdr4q0d4';

const partnerSummaryRecord = () => ({
  id: 'partner-1',
  name: 'Studio',
  type: PartnerType.STUDIO,
  verified: true,
  description: 'desc',
  location: 'Seoul',
  portfolioUrl: 'https://portfolio.test',
  contactInfo: 'contact@test.co',
  _count: { matches: 2 },
  user: { id: OWNER_CUID, name: 'Creator', avatarUrl: null, role: UserRole.PARTNER },
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z')
});

describe('partner domain service', () => {
  beforeEach(() => {
    mockPrisma = createPrismaMock();
    revalidatePath.mockReset();
  });

  describe('createPartnerProfile', () => {
    const adminUser = { id: 'admin-1', role: UserRole.ADMIN } as const;

    it('normalises payload, promotes owner role, and revalidates partners listing', async () => {
      const payload = {
        name: '  Studio  ',
        type: PartnerType.STUDIO,
        description: '  desc  ',
        contactInfo: 'contact@test.co',
        services: ['Design', 'Design '],
        pricingModel: '  hourly ',
        location: ' Seoul ',
        availability: {
          timezone: '  Asia/Seoul ',
          slots: [
            { day: ' Mon ', start: '09:00', end: '18:00', note: '  remote ' }
          ]
        },
        portfolioUrl: 'https://portfolio.test',
        ownerId: OWNER_CUID,
        verified: true
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: OWNER_CUID, role: UserRole.CREATOR });
      mockPrisma.partner.findUnique.mockResolvedValueOnce(null);
      mockPrisma.partner.create.mockResolvedValue({ id: 'partner-1' });
      mockPrisma.user.update.mockResolvedValue(undefined);
      mockPrisma.partner.findUnique.mockResolvedValueOnce(partnerSummaryRecord());

      const summary = await createPartnerProfile(payload, adminUser);

      const createArgs = mockPrisma.partner.create.mock.calls[0][0].data;
      expect(createArgs).toMatchObject({
        name: 'Studio',
        type: PartnerType.STUDIO,
        verified: true,
        services: ['Design'],
        location: 'Seoul'
      });
      expect(createArgs.availability).toMatchObject({
        timezone: 'Asia/Seoul',
        slots: [
          { day: 'Mon', start: '09:00', end: '18:00', note: 'remote' }
        ]
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: OWNER_CUID },
        data: { role: UserRole.PARTNER }
      });
      expect(revalidatePath).toHaveBeenCalledWith('/partners');
      expect(summary?.id).toBe('partner-1');
    });

    it('ignores verified flag when caller is not admin', async () => {
      const creator = { id: OWNER_CUID, role: UserRole.CREATOR } as const;
      const payload = {
        name: 'Studio',
        type: PartnerType.STUDIO,
        contactInfo: 'contact@test.co',
        ownerId: OWNER_CUID,
        verified: true
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: OWNER_CUID, role: UserRole.CREATOR });
      mockPrisma.partner.findUnique.mockResolvedValueOnce(null);
      mockPrisma.partner.create.mockResolvedValue({ id: 'partner-1' });
      mockPrisma.user.update.mockResolvedValue(undefined);
      mockPrisma.partner.findUnique.mockResolvedValueOnce(partnerSummaryRecord());

      await createPartnerProfile(payload, creator);

      const createArgs = mockPrisma.partner.create.mock.calls[0][0].data;
      expect(createArgs.verified).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: OWNER_CUID },
        data: { role: UserRole.PARTNER }
      });
      expect(revalidatePath).toHaveBeenCalledWith('/partners');
    });
  });

  describe('updatePartnerProfile', () => {
    const basePartner = {
      ...partnerSummaryRecord(),
      services: ['Design'],
      availability: null,
      pricingModel: null,
      rating: null,
      contactInfo: 'contact@test.co'
    };

    it('allows owner to update basic fields', async () => {
      const owner = { id: OWNER_CUID, role: UserRole.CREATOR } as const;
      mockPrisma.partner.findUnique.mockResolvedValueOnce({
        ...basePartner,
        user: { id: OWNER_CUID, name: 'Creator', avatarUrl: null, role: UserRole.PARTNER }
      });
      mockPrisma.partner.update.mockResolvedValue({ id: 'partner-1' });
      mockPrisma.partner.findUnique.mockResolvedValueOnce(partnerSummaryRecord());

      await updatePartnerProfile('partner-1', { services: ['Design', 'Consulting'] }, owner);

      const updateArgs = mockPrisma.partner.update.mock.calls[0][0].data;
      expect(updateArgs.services).toEqual(['Design', 'Consulting']);
      expect(updateArgs.verified).toBeUndefined();
      expect(revalidatePath).toHaveBeenCalledWith('/partners');
    });

    it('rejects verification changes from non-admin users', async () => {
      mockPrisma.partner.findUnique.mockResolvedValueOnce({
        ...basePartner,
        user: { id: OWNER_CUID, name: 'Creator', avatarUrl: null, role: UserRole.PARTNER }
      });

      await expect(
        updatePartnerProfile('partner-1', { verified: true }, { id: OWNER_CUID, role: UserRole.CREATOR })
      ).rejects.toBeInstanceOf(PartnerAccessDeniedError);
    });

    it('allows admin to toggle verification', async () => {
      const admin = { id: 'admin-1', role: UserRole.ADMIN } as const;
      mockPrisma.partner.findUnique.mockResolvedValueOnce({
        ...basePartner,
        user: { id: OWNER_CUID, name: 'Creator', avatarUrl: null, role: UserRole.PARTNER }
      });
      mockPrisma.partner.update.mockResolvedValue({ id: 'partner-1' });
      mockPrisma.partner.findUnique.mockResolvedValueOnce(partnerSummaryRecord());

      await updatePartnerProfile('partner-1', { verified: true }, admin);

      const updateArgs = mockPrisma.partner.update.mock.calls[0][0].data;
      expect(updateArgs.verified).toBe(true);
    });

    it('blocks updates from unrelated users', async () => {
      mockPrisma.partner.findUnique.mockResolvedValueOnce({
        ...basePartner,
        user: { id: OWNER_CUID, name: 'Creator', avatarUrl: null, role: UserRole.PARTNER }
      });

      await expect(
        updatePartnerProfile('partner-1', { name: 'Other' }, { id: 'intruder', role: UserRole.CREATOR })
      ).rejects.toBeInstanceOf(PartnerAccessDeniedError);
    });
  });
});





