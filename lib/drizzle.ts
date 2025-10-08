// Drizzle 마이그레이션: Prisma 클라이언트를 Drizzle 클라이언트로 교체
import { getDb, getDbClient, isDrizzleAvailable, closeDb } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';

// Drizzle 클라이언트 export
export const drizzle = getDb;

// Drizzle 클라이언트의 기본 export 설정
export default drizzle;

// Drizzle 관련 유틸리티 함수들 export
export { getDbClient, isDrizzleAvailable, closeDb, schema };

// Prisma 호환성을 위한 임시 사용을 위한 타입
export type drizzle = any;