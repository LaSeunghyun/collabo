import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool, type PoolConfig } from 'pg';

import { normalizeServerlessConnectionString } from '@/lib/db/connection-string';
import * as schema from '@/lib/db/schema';

neonConfig.fetchConnectionCache = true;

export type DrizzleNodeClient = NodePgDatabase<typeof schema>;
export type DrizzleHttpClient = NeonHttpDatabase<typeof schema>;
export type DatabaseClient = DrizzleNodeClient | DrizzleHttpClient;

type InstanceKind = 'node' | 'serverless' | 'disabled';

interface DrizzleInstance {
  db: DatabaseClient;
  kind: InstanceKind;
  pool?: Pool;
  reason?: string;
}

const globalForDrizzle = globalThis as unknown as {
  drizzle?: DrizzleInstance;
};

const loggerEnabled = () => process.env.NODE_ENV === 'development';

const createPgPool = (connectionString: string) => {
  const poolConfig: PoolConfig = {
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? '5'),
    idleTimeoutMillis: Number(process.env.DATABASE_POOL_IDLE_TIMEOUT ?? '0'),
  };

  try {
    const url = new URL(connectionString);
    const isLocalhost = ['localhost', '127.0.0.1'].includes(url.hostname);

    if (!isLocalhost) {
      poolConfig.ssl = {
        rejectUnauthorized: false,
      };
    }
  } catch (error) {
    console.warn('[db] Failed to parse connection string for SSL configuration.', error);
  }

  const pool = new Pool(poolConfig);

  pool.on('error', (error) => {
    console.error('[db] Unexpected error on idle client', error);
  });

  return pool;
};

const createNodeInstance = (connectionString: string): DrizzleInstance => {
  const pool = createPgPool(connectionString);
  const db = drizzlePg(pool, {
    schema,
    logger: loggerEnabled(),
  });

  return {
    db,
    kind: 'node',
    pool,
  };
};

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

const installLifecycleHooks = (instance: DrizzleInstance) => {
  if (instance.kind !== 'node' || !instance.pool) {
    return;
  }

  if (typeof window !== 'undefined') {
    return;
  }

  if (typeof process === 'undefined' || typeof process.on !== 'function') {
    return;
  }

  process.on('beforeExit', async () => {
    try {
      await instance.pool?.end();
    } catch (error) {
      console.warn('[db] Failed to gracefully close the Postgres pool.', error);
    }
  });
};

const instantiateDrizzle = (): DrizzleInstance => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set.');
  }

  console.log('[db] DATABASE_URL found:', databaseUrl.substring(0, 50) + '...');

  const normalizedUrl = normalizeServerlessConnectionString(databaseUrl);

  if (normalizedUrl.startsWith('prisma://')) {
    throw new Error('Prisma Data Proxy URLs are not supported by Drizzle.');
  }

  const preferHttpDriver =
    process.env.DRIZZLE_DRIVER === 'http' || process.env.NEXT_RUNTIME === 'edge';

  console.log('[db] Using driver:', preferHttpDriver ? 'http' : 'node');

  const instance = preferHttpDriver
    ? createServerlessInstance(normalizedUrl)
    : createNodeInstance(normalizedUrl);

  installLifecycleHooks(instance);

  return instance;
};

const getDrizzleInstance = (): DrizzleInstance => {
  if (!globalForDrizzle.drizzle) {
    try {
      globalForDrizzle.drizzle = instantiateDrizzle();
    } catch (error) {
      console.error('[db] Error instantiating Drizzle:', error);
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
  const instance = getDrizzleInstance();

  if (instance.kind === 'node' && instance.pool) {
    await instance.pool.end();
  }
};

export { schema, eq };
