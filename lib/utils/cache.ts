/**
 * 메모리 기반 캐싱 유틸리티
 * 자주 조회되는 데이터의 캐싱을 위한 간단한 캐시 시스템
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

class MemoryCache {
    private cache = new Map<string, CacheEntry<unknown>>();
    private maxSize: number;
    private defaultTtl: number;

    constructor(maxSize = 1000, defaultTtl = 5 * 60 * 1000) { // 5분 기본 TTL
        this.maxSize = maxSize;
        this.defaultTtl = defaultTtl;
    }

    set<T>(key: string, data: T, ttl?: number): void {
        // 캐시 크기 제한
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl ?? this.defaultTtl,
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // TTL 체크
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);

        if (!entry) {
            return false;
        }

        // TTL 체크
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    size(): number {
        return this.cache.size;
    }

    // 캐시 통계
    getStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;

        for (const entry of this.cache.values()) {
            if (now - entry.timestamp > entry.ttl) {
                expiredEntries++;
            } else {
                validEntries++;
            }
        }

        return {
            total: this.cache.size,
            valid: validEntries,
            expired: expiredEntries,
            maxSize: this.maxSize,
        };
    }
}

// 전역 캐시 인스턴스
export const cache = new MemoryCache();

/**
 * 캐시 키 생성 헬퍼
 */
export const createCacheKey = (prefix: string, ...parts: (string | number)[]): string => {
    return `${prefix}:${parts.join(':')}`;
};

/**
 * 캐시된 데이터를 가져오거나 생성하는 고차 함수
 */
export async function withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
): Promise<T> {
    const cached = cache.get<T>(key);

    if (cached !== null) {
        return cached;
    }

    const data = await fetcher();
    cache.set(key, data, ttl);

    return data;
}

/**
 * 캐시 무효화 헬퍼
 */
export function invalidateCache(pattern: string): void {
    const keys = Array.from(cache['cache'].keys());
    const regex = new RegExp(pattern);

    for (const key of keys) {
        if (regex.test(key)) {
            cache.delete(key);
        }
    }
}

/**
 * 특정 캐시 키들을 무효화
 */
export function invalidateCacheKeys(keys: string[]): void {
    for (const key of keys) {
        cache.delete(key);
    }
}

/**
 * 캐시 TTL 상수들
 */
export const CACHE_TTL = {
    SHORT: 1 * 60 * 1000,    // 1분
    MEDIUM: 5 * 60 * 1000,   // 5분
    LONG: 30 * 60 * 1000,    // 30분
    VERY_LONG: 2 * 60 * 60 * 1000, // 2시간
} as const;

/**
 * 캐시 키 상수들
 */
export const CACHE_KEYS = {
    PROJECT: (id: string) => createCacheKey('project', id),
    PROJECTS: (filters?: string) => createCacheKey('projects', filters || 'all'),
    USER: (id: string) => createCacheKey('user', id),
    ARTIST: (id: string) => createCacheKey('artist', id),
    ARTISTS: (filters?: string) => createCacheKey('artists', filters || 'all'),
    SETTLEMENT: (id: string) => createCacheKey('settlement', id),
    ANALYTICS: (type: string) => createCacheKey('analytics', type),
} as const;
