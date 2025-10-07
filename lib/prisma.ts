import { PrismaClient } from '@prisma/client';

import { normalizeServerlessConnectionString } from '@/lib/db/connection-string';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

type PrismaStubMetadata = {
  __isPrismaStub: true;
  __stubReason: string;
};

const createDisabledPrismaClient = (reason: string) => {
  const baseReason = reason || 'The Prisma client could not be initialized.';
  const message = `[prisma] Database access is disabled: ${baseReason} Set DATABASE_URL in your environment to enable Prisma.`;

  console.warn(message);

  const noop = async () => undefined;

  const fallbackResolvers = new Map<string, (args: unknown[]) => unknown>([
    ['findMany', () => []],
    ['findUnique', () => null],
    ['findFirst', () => null],
    ['count', () => 0],
    ['aggregate', () => ({})],
    ['groupBy', () => []],
    ['findRaw', () => []],
    ['runCommandRaw', () => ({})]
  ]);

  const fallbackUsage = new Set<string>();

  const describePath = (path: PropertyKey[]) =>
    path
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .join('.');

  const createMethodProxy = (path: PropertyKey[]): unknown =>
    new Proxy(noop, {
      apply(_target, _thisArg, args) {
        const method = path[path.length - 1];

        if (typeof method === 'string') {
          const resolver = fallbackResolvers.get(method);

          if (resolver) {
            const key = describePath(path);

            if (key && !fallbackUsage.has(key)) {
              console.warn(
                `[prisma] Returning fallback result for ${key} because the database is disabled.`
              );
              fallbackUsage.add(key);
            }

            try {
              return Promise.resolve(resolver(args));
            } catch (error) {
              throw error;
            }
          }
        }

        throw new Error(message);
      },
      get(_target, prop) {
        if (prop === Symbol.toStringTag) {
          return 'PrismaClientStubMethod';
        }

        if (prop === 'then') {
          return undefined;
        }

        return createMethodProxy([...path, prop]);
      }
    });

  const stubTarget = {
    $disconnect: noop,
    $connect: noop,
    $use: () => undefined,
    $on: () => undefined,
    __isPrismaStub: true as const,
    __stubReason: baseReason
  } as unknown as PrismaClient & PrismaStubMetadata & {
    $extends?: () => PrismaClient & PrismaStubMetadata;
  };

  const client = new Proxy(stubTarget, {
    get(target, prop) {
      if (prop in target) {
        return (target as Record<PropertyKey, unknown>)[prop];
      }

      if (prop === Symbol.toStringTag) {
        return 'PrismaClientStub';
      }

      return createMethodProxy([prop]);
    }
  }) as PrismaClient & PrismaStubMetadata;

  (stubTarget as { $extends: () => PrismaClient & PrismaStubMetadata }).$extends = () => client;

  return client;
};

const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set.');
  }

  const datasourceUrl = normalizeServerlessConnectionString(databaseUrl);

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: datasourceUrl
      }
    }
  });
};

const instantiatePrisma = () => {
  try {
    return createPrismaClient();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return createDisabledPrismaClient(reason);
  }
};

export const prisma = globalForPrisma.prisma ?? instantiatePrisma();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 서버리스 환경에서 연결 정리
if (typeof window === 'undefined' && typeof process !== 'undefined' && typeof process.on === 'function') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

// Prisma shim을 위한 타입 재export
export type { Prisma } from '@prisma/client';
export default prisma;
