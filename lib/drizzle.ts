// Drizzle ë§ˆì´ê·¸ë ˆ?´ì…˜: Prisma ?´ë¼?´ì–¸?¸ë? Drizzle ?´ë¼?´ì–¸?¸ë¡œ êµì²´
import { getDb, getDbClient, isDrizzleAvailable, closeDb } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';

// Drizzle ?´ë¼?´ì–¸??export
export const drizzle = getDb;

// Drizzle ?´ë¼?´ì–¸?¸ì˜ ê¸°ë³¸ export ?¤ì •
export default drizzle;

// Drizzle ê´€??? í‹¸ë¦¬í‹° ?¨ìˆ˜??export
export { getDbClient, isDrizzleAvailable, closeDb, schema };

// Prisma ?¸í™˜?±ì„ ?„í•œ ?„ì‹œ ?¬ìš©???„í•œ ?€??
export type drizzle = any;
