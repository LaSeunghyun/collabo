// Drizzle로 전환: Prisma 클라이언트를 Drizzle 클라이언트로 교체
import { db, getDbClient, isDrizzleAvailable, closeDb } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';

// 기존 코드와의 호환성을 위해 prisma 이름으로 export
export const prisma = db;

// Drizzle 클라이언트를 기본 export로 설정
export default prisma;

// Drizzle 관련 유틸리티 함수들 export
export { getDbClient, isDrizzleAvailable, closeDb, schema };

// Prisma 타입은 더 이상 사용하지 않으므로 빈 타입으로 대체
export type Prisma = any;
