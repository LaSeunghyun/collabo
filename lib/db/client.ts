import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';

import { normalizeServerlessConnectionString } from '@/lib/db/connection-string';
import * as schema from '@/drizzle/schema';

// ?œë²„ ?¬ì´?œì—?œë§Œ postgres ëª¨ë“ˆ???™ì ?¼ë¡œ import
const getPostgres = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('Database client can only be used on the server side');
  }
  const postgres = (await import('postgres')).default;
  return postgres;
};

// ?¤í‚¤ë§ˆê? ?œë?ë¡?ë¡œë“œ?˜ì—ˆ?”ì? ?•ì¸
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

// Node.js ê´€??ì½”ë“œ ?œê±°??- ?œë²„ë¦¬ìŠ¤ ?˜ê²½ë§?ì§€??

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
    
    // Vercel ?˜ê²½?ì„œ ?°ê²° ?¤íŒ¨ ?????ì„¸??ë¡œê¹…
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

  // ?”ë? ê°ì²´ ?ì„± (?¤ì œ postgres ?°ê²° ?†ì´)
  const dummyDb = new Proxy({} as DatabaseClient, {
    get(target, prop) {
      if (prop === Symbol.toStringTag) {
        return 'DrizzleClientStub';
      }
      
      if (typeof prop === 'string') {
        // query ê°ì²´??ê°??Œì´ë¸”ì— ?€??ë©”ì„œ?œë“¤
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
        
        // Drizzle???¤ë¥¸ ë©”ì„œ?œë“¤ - ì²´ì´?ì„ ?„í•œ ?¨ìˆ˜??
        if (['select', 'insert', 'update', 'delete', 'from', 'transaction'].includes(prop)) {
          return () => { throw new Error(message); };
        }
        
        // execute ë©”ì„œ?œëŠ” ?¹ë³„??ì²˜ë¦¬
        if (prop === 'execute') {
          return () => { throw new Error(message); };
        }
        
        // Drizzle ORM ?°ì‚°?ë“¤
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

// Node.js ê´€??ì½”ë“œ ?œê±°??- ?œë²„ë¦¬ìŠ¤ ?˜ê²½ë§?ì§€??

const instantiateDrizzle = async (): Promise<DrizzleInstance> => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    // Vercel ?˜ê²½?ì„œ??ë¹Œë“œ ?œì—ë§?ë¹„í™œ?±í™”, ?°í??„ì—?œëŠ” ?ëŸ¬ ë°œìƒ
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      return createDisabledInstance('DATABASE_URL is not set in production environment.');
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

  // ?œë²„ë¦¬ìŠ¤ ?˜ê²½ë§?ì§€??
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

// topLevelAwait ?œê±° - db export ?œê±°
// ëª¨ë“  ê³³ì—??getDbClient() ?¬ìš©
export const getDb = () => getDbClient();

export const isDrizzleAvailable = async () => {
  const instance = await getDrizzleInstance();
  return instance.kind !== 'disabled';
};

export const closeDb = async () => {
  // ?œë²„ë¦¬ìŠ¤ ?˜ê²½?ì„œ???°ê²° ?•ë¦¬ê°€ ?„ìš”?˜ì? ?ŠìŒ
  return;
};

export { schema, eq };
