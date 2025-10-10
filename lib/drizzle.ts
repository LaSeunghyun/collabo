// Drizzle 마이그레?�션: Prisma ?�라?�언?��? Drizzle ?�라?�언?�로 교체
import { getDb, getDbClient, isDrizzleAvailable, closeDb } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';

// Drizzle ?�라?�언??export
export const drizzle = getDb;

// Drizzle ?�라?�언?�의 기본 export ?�정
export default drizzle;

// Drizzle 관???�틸리티 ?�수??export
export { getDbClient, isDrizzleAvailable, closeDb, schema };

// Prisma ?�환?�을 ?�한 ?�시 ?�용???�한 ?�??
export type drizzle = any;
