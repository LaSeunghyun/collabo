import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';

import { normalizeServerlessConnectionString } from '@/lib/db/connection-string';
import * as schema from '@/drizzle/schema';

// 서버 사이드에서만 postgres 모듈을 동적으로 import
const getPostgres = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('Database client can only be used on the server side');
  }
  const postgres = (await import('postgres')).default;
  return postgres;
};

// 스키마가 제대로 로드되었는지 확인
if (!schema || typeof schema !== 'object') {
  throw new Error('Failed to load Drizzle schema');
}

export type DatabaseClient = ReturnType<typeof drizzle>;

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

const createServerlessInstance = async (connectionString: string): Promise<DrizzleInstance> => {
  try {
    const postgres = await getPostgres();
    const client = postgres(connectionString, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    const db = drizzle(client, {
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

  // 더미 객체 생성 (실제 postgres 연결 없이)
  const dummyDb = new Proxy({} as DatabaseClient, {
    get(target, prop) {
      if (prop === Symbol.toStringTag) {
        return 'DrizzleClientStub';
      }
      
      if (typeof prop === 'string') {
        // query 객체의 각 테이블에 대한 메서드들
        if (prop === 'query') {
          return new Proxy({}, {
            get(target, tableName) {
              if (typeof tableName === 'string') {
                return {
                  findFirst: () => { throw new Error(message); },
                  findMany: () => { throw new Error(message); },
                  insert: () => { throw new Error(message); },
                  update: () => { throw new Error(message); },
                  delete: () => { throw new Error(message); },
                };
              }
              return target[tableName as keyof typeof target];
            }
          });
        }
        
        // Drizzle의 다른 메서드들 - 체이닝을 위한 함수들
        if (['select', 'insert', 'update', 'delete', 'from', 'transaction'].includes(prop)) {
          return () => { throw new Error(message); };
        }
        
        // execute 메서드는 특별히 처리
        if (prop === 'execute') {
          return () => { throw new Error(message); };
        }
        
        // Drizzle ORM 연산자들
        if (['eq', 'and', 'or', 'not', 'like', 'inArray', 'notInArray', 'desc', 'asc', 'count', 'sql'].includes(prop)) {
          return () => { throw new Error(message); };
        }
      }
      
      return target[prop as keyof typeof target];
    }
  });

  return {
    db: dummyDb,
    kind: 'disabled',
    reason: baseReason,
  };
};

// Node.js 관련 코드 제거됨 - 서버리스 환경만 지원

const instantiateDrizzle = async (): Promise<DrizzleInstance> => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    // Vercel 환경에서는 빌드 시에만 비활성화, 런타임에서는 에러 발생
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL && process.env.VERCEL_ENV === 'preview') {
      return createDisabledInstance('DATABASE_URL is not set in preview environment.');
    }
    if (process.env.NODE_ENV === 'development') {
      return createDisabledInstance('DATABASE_URL is not set in development environment.');
    }
    throw new Error('DATABASE_URL is not set.');
  }

  const normalizedUrl = normalizeServerlessConnectionString(databaseUrl);

  if (normalizedUrl.startsWith('prisma://')) {
    throw new Error('Prisma Data Proxy URLs are not supported by Drizzle.');
  }

  // 서버리스 환경만 지원
  const instance = await createServerlessInstance(normalizedUrl);

  return instance;
};

const getDrizzleInstance = async (): Promise<DrizzleInstance> => {
  if (!globalForDrizzle.drizzle) {
    try {
      globalForDrizzle.drizzle = await instantiateDrizzle();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      globalForDrizzle.drizzle = createDisabledInstance(reason);
    }
  }

  return globalForDrizzle.drizzle;
};

export const getDbClient = async (): Promise<DatabaseClient> => {
  const instance = await getDrizzleInstance();
  return instance.db;
};

// topLevelAwait 제거 - db export 제거
// 모든 곳에서 getDbClient() 사용
export const getDb = () => getDbClient();

export const isDrizzleAvailable = async () => {
  const instance = await getDrizzleInstance();
  return instance.kind !== 'disabled';
};

export const closeDb = async () => {
  // 서버리스 환경에서는 연결 정리가 필요하지 않음
  return;
};

export { schema, eq };
