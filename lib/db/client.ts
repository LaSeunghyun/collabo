import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';

import { normalizeServerlessConnectionString } from '@/lib/db/connection-string';
import * as schema from '@/lib/db/schema';

neonConfig.fetchConnectionCache = true;

export type DrizzleHttpClient = NeonHttpDatabase<typeof schema>;
export type DatabaseClient = DrizzleHttpClient;

type InstanceKind = 'serverless' | 'disabled';

interface DrizzleInstance {
  db: DatabaseClient;
  kind: InstanceKind;
  reason?: string;
}

const globalForDrizzle = globalThis as unknown as {
  drizzle?: DrizzleInstance;
};

const loggerEnabled = () => process.env.NODE_ENV === 'development';

// Node.js 관련 코드 제거됨 - 서버리스 환경만 지원

const createServerlessInstance = (connectionString: string): DrizzleInstance => {
  const client = neon(connectionString);
  const db = drizzleNeon(client, {
    schema,
    logger: loggerEnabled(),
  });

  return {
    db,
    kind: 'serverless',
  };
};

const createDisabledInstance = (reason: string): DrizzleInstance => {
  const baseReason = reason || 'The Drizzle client could not be initialized.';
  const message = `[db] Database access is disabled: ${baseReason} Set DATABASE_URL in your environment to enable Drizzle.`;

  console.warn(message);

  const proxy = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === Symbol.toStringTag) {
          return 'DrizzleClientStub';
        }

        return () => {
          throw new Error(message);
        };
      },
    },
  ) as DatabaseClient;

  return {
    db: proxy,
    kind: 'disabled',
    reason: baseReason,
  };
};

// Node.js 관련 코드 제거됨 - 서버리스 환경만 지원

const instantiateDrizzle = (): DrizzleInstance => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set.');
  }

  const normalizedUrl = normalizeServerlessConnectionString(databaseUrl);

  if (normalizedUrl.startsWith('prisma://')) {
    throw new Error('Prisma Data Proxy URLs are not supported by Drizzle.');
  }

  // 서버리스 환경만 지원
  const instance = createServerlessInstance(normalizedUrl);

  return instance;
};

const getDrizzleInstance = (): DrizzleInstance => {
  if (!globalForDrizzle.drizzle) {
    try {
      globalForDrizzle.drizzle = instantiateDrizzle();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      globalForDrizzle.drizzle = createDisabledInstance(reason);
    }
  }

  return globalForDrizzle.drizzle;
};

export const getDbClient = (): DatabaseClient => getDrizzleInstance().db;

export const db = getDbClient();

export const isDrizzleAvailable = () => getDrizzleInstance().kind !== 'disabled';

export const closeDb = async () => {
  // 서버리스 환경에서는 연결 정리가 필요하지 않음
  return;
};

export { schema, eq };
