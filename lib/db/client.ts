import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';

import { normalizeServerlessConnectionString } from '@/lib/db/connection-string';
import * as schema from '@/lib/db/schema';

// 스키마가 제대로 로드되었는지 확인
if (!schema || typeof schema !== 'object') {
  throw new Error('Failed to load Drizzle schema');
}

neonConfig.fetchConnectionCache = true;
neonConfig.fetchTimeout = 30000; // 30초 타임아웃

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
  try {
    const client = neon(connectionString);
    const db = drizzleNeon(client, {
      schema,
      logger: loggerEnabled(),
    });

    return {
      db,
      kind: 'serverless',
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error('Failed to create serverless instance:', reason);
    
    // Vercel 환경에서 연결 실패 시 더 자세한 로깅
    if (process.env.VERCEL) {
      console.error('Vercel environment detected. Connection string format:', {
        hasUrl: !!connectionString,
        urlLength: connectionString?.length,
        startsWithPostgres: connectionString?.startsWith('postgresql://'),
        containsPooler: connectionString?.includes('pooler'),
      });
    }
    
    return createDisabledInstance(`Serverless instance creation failed: ${reason}`);
  }
};

const createDisabledInstance = (reason: string): DrizzleInstance => {
  const baseReason = reason || 'The Drizzle client could not be initialized.';
  const message = `[db] Database access is disabled: ${baseReason} Set DATABASE_URL in your environment to enable Drizzle.`;

  console.warn(message);

  // 빌드 시에는 더미 스키마로 더미 클라이언트 생성
  const dummyClient = neon('postgresql://dummy:dummy@dummy:5432/dummy');
  const dummyDb = drizzleNeon(dummyClient, {
    schema,
    logger: false,
  });

  const proxy = new Proxy(
    dummyDb,
    {
      get(target, prop) {
        if (prop === Symbol.toStringTag) {
          return 'DrizzleClientStub';
        }

        // Drizzle의 내부 메서드들은 더미 객체에서 처리
        if (typeof prop === 'string' && ['select', 'insert', 'update', 'delete', 'from'].includes(prop)) {
          return () => {
            throw new Error(message);
          };
        }

        return target[prop as keyof typeof target];
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
    // 빌드 시에는 데이터베이스 연결 없이도 스키마만으로 작동할 수 있도록
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      return createDisabledInstance('DATABASE_URL is not set in production environment.');
    }
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
