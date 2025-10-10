// Drizzle mock을 위한 타입 정의
export type MockDrizzle = ReturnType<typeof createDrizzleMock>;

export const createDrizzleMock = () => {
  const mock = {
    // Drizzle query builder methods
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    
    // Insert operations
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    onConflictDoNothing: jest.fn().mockReturnThis(),
    onConflictDoUpdate: jest.fn().mockReturnThis(),
    
    // Update operations
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    
    // Delete operations
    delete: jest.fn().mockReturnThis(),
    
    // Transaction support
    transaction: jest.fn(),
    $transaction: jest.fn(),
    
    // Prisma 호환성을 위한 mock 메서드들
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
    postDislike: {
      findMany: jest.fn()
    },
    visitLog: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    milestone: {
      findUnique: jest.fn()
    },
    notification: {
      createMany: jest.fn()
    },
    moderationReport: {
      findMany: jest.fn(),
      groupBy: jest.fn()
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
  (mock.transaction as jest.Mock).mockImplementation(async (callback: any) => callback(mock));

  return mock;
};

const resetMocksRecursively = (input: unknown) => {
  if (!input) {
    return;
  }

  if (typeof input === 'function' && 'mockReset' in input && typeof (input as jest.Mock).mockReset === 'function') {
    (input as jest.Mock).mockReset();
    return;
  }

  if (typeof input === 'object') {
    for (const value of Object.values(input as Record<string, unknown>)) {
      resetMocksRecursively(value);
    }
  }
};

export const resetDrizzleMock = (mock: MockDrizzle) => {
  resetMocksRecursively(mock);
};

// 호환성을 위한 별칭
export const resetPrismaMock = resetDrizzleMock;
export const createPrismaMock = createDrizzleMock;
export type MockPrisma = MockDrizzle;