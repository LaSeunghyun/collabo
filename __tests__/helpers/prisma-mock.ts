export type MockPrisma = ReturnType<typeof createPrismaMock>;

export const createPrismaMock = () => {
  const mock = {
    $transaction: jest.fn(),
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    projectMilestone: {
      findFirst: jest.fn()
    },
    funding: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn()
    },
    paymentTransaction: {
      create: jest.fn(),
      upsert: jest.fn()
    },
    settlement: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn()
    },
    settlementPayout: {
      create: jest.fn(),
      createMany: jest.fn()
    },
    auditLog: {
      create: jest.fn()
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn()
    },
    userFollow: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn()
    },
    partner: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    partnerMatch: {
      findMany: jest.fn()
    },
    projectCollaborator: {
      findMany: jest.fn()
    },
    post: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    postLike: {
      findMany: jest.fn()
    },
    milestone: {
      findUnique: jest.fn()
    },
    notification: {
      createMany: jest.fn()
    },
    moderationReport: {
      findMany: jest.fn()
    },
    settlementAudit: {
      create: jest.fn()
    },
    announcement: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    announcementRead: {
      upsert: jest.fn()
    },
    eventRegistration: {
      findMany: jest.fn()
    }
  } as const;

  (mock.$transaction as jest.Mock).mockImplementation(async (callback: any) => callback(mock));

  return mock;
};
