import { PartnerType, UserRole } from '@/types/prisma';

import { PartnerProfileExistsError, createPartnerProfile } from '@/lib/server/partners';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

const { revalidatePath: mockRevalidatePath } = jest.requireMock('next/cache') as {
  revalidatePath: jest.Mock;
};

jest.mock('@/lib/prisma', () => {
  const prismaMocks = {
    userFindUnique: jest.fn(),
    partnerFindUnique: jest.fn(),
    txPartnerCreate: jest.fn(),
    txUserUpdate: jest.fn(),
    transaction: jest.fn()
  };

  (globalThis as unknown as { __prismaMocks?: typeof prismaMocks }).__prismaMocks = prismaMocks;

  return {
    prisma: {
      user: { findUnique: (...args: unknown[]) => prismaMocks.userFindUnique(...args) },
      partner: { findUnique: (...args: unknown[]) => prismaMocks.partnerFindUnique(...args) },
      $transaction: (callback: unknown) => prismaMocks.transaction(callback)
    },
    Prisma: { JsonNull: Symbol('JsonNull') }
  };
});

const {
  userFindUnique: mockUserFindUnique,
  partnerFindUnique: mockPartnerFindUnique,
  txPartnerCreate: mockTxPartnerCreate,
  txUserUpdate: mockTxUserUpdate,
  transaction: mockTransaction
} = (globalThis as unknown as { __prismaMocks: {
  userFindUnique: jest.Mock;
  partnerFindUnique: jest.Mock;
  txPartnerCreate: jest.Mock;
  txUserUpdate: jest.Mock;
  transaction: jest.Mock;
}; }).__prismaMocks;

describe('createPartnerProfile', () => {
  const sessionUser = { id: 'user-1', role: UserRole.PARTICIPANT, permissions: [] } as const;
  const basePayload = {
    name: 'Studio Aurora',
    type: PartnerType.STUDIO,
    contactInfo: 'hello@aurora.studio'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTxPartnerCreate.mockResolvedValue({ id: 'partner-1' });
    mockTxUserUpdate.mockResolvedValue(undefined);
    mockTransaction.mockImplementation(async (callback: any) =>
      callback({
        partner: { create: mockTxPartnerCreate },
        user: { update: mockTxUserUpdate }
      })
    );
  });

  it('updates the owner role to PARTNER after a successful creation', async () => {
    const now = new Date();
    mockUserFindUnique.mockResolvedValue({ id: sessionUser.id, role: UserRole.PARTICIPANT });
    mockPartnerFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'partner-1',
        name: basePayload.name,
        type: basePayload.type,
        verified: false,
        description: null,
        location: null,
        portfolioUrl: null,
        contactInfo: basePayload.contactInfo,
        createdAt: now,
        updatedAt: now,
        user: { id: sessionUser.id, name: null, avatarUrl: null, role: UserRole.PARTNER },
        _count: { matches: 0 }
      });
    const result = await createPartnerProfile(basePayload, sessionUser);

    expect(mockTxUserUpdate).toHaveBeenCalledWith({
      where: { id: sessionUser.id },
      data: { role: UserRole.PARTNER }
    });
    expect(result).toMatchObject({ id: 'partner-1', name: basePayload.name, matchCount: 0 });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/partners');
  });

  it('prevents creating a duplicate partner profile', async () => {
    mockUserFindUnique.mockResolvedValue({ id: sessionUser.id, role: UserRole.PARTNER });
    mockPartnerFindUnique.mockResolvedValue({ id: 'partner-1' });

    await expect(createPartnerProfile(basePayload, sessionUser)).rejects.toBeInstanceOf(
      PartnerProfileExistsError
    );
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
