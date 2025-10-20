/**
 * 성능 측정 및 모니터링 유틸리티
 */

import { PERFORMANCE_THRESHOLDS } from '@/lib/constants/app-config';

interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // 메모리 사용량 제한

  /**
   * API 실행 시간을 측정하고 기록
   */
  async measureApiTime<T>(
    name: string, 
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    let success = true;
    let error: string | undefined;

    try {
      const result = await fn();
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      const duration = Date.now() - start;
      
      // 성능 메트릭 기록
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        success,
        error
      });

      // 느린 API 경고
      if (duration > PERFORMANCE_THRESHOLDS.API.WARNING) {
        console.warn(`⚠️ SLOW API: ${name} took ${duration}ms`);
      }

      // 매우 느린 API 에러
      if (duration > PERFORMANCE_THRESHOLDS.API.ERROR) {
        console.error(`🚨 VERY SLOW API: ${name} took ${duration}ms`);
      }
    }
  }

  /**
   * 쿼리 실행 시간을 측정
   */
  async measureQueryTime<T>(
    queryName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    let success = true;
    let error: string | undefined;

    try {
      const result = await fn();
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      const duration = Date.now() - start;
      
      this.recordMetric({
        name: `query:${queryName}`,
        duration,
        timestamp: Date.now(),
        success,
        error
      });

      // 느린 쿼리 경고
      if (duration > PERFORMANCE_THRESHOLDS.QUERY.WARNING) {
        console.warn(`⚠️ SLOW QUERY: ${queryName} took ${duration}ms`);
      }

      // 매우 느린 쿼리 에러
      if (duration > PERFORMANCE_THRESHOLDS.QUERY.ERROR) {
        console.error(`🚨 VERY SLOW QUERY: ${queryName} took ${duration}ms`);
      }
    }
  }

  /**
   * 메트릭 기록
   */
  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // 메모리 사용량 제한
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * 성능 통계 조회
   */
  getStats(name?: string) {
    const filtered = name 
      ? this.metrics.filter(m => m.name === name)
      : this.metrics;

    if (filtered.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        successRate: 0
      };
    }

    const durations = filtered.map(m => m.duration);
    const successes = filtered.filter(m => m.success).length;

    return {
      count: filtered.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      successRate: (successes / filtered.length) * 100
    };
  }

  /**
   * 느린 API 목록 조회
   */
  getSlowApis(threshold = 1000) {
    return this.metrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration);
  }

  /**
   * 메트릭 초기화
   */
  clear() {
    this.metrics = [];
  }
}

// 싱글톤 인스턴스
export const performanceMonitor = new PerformanceMonitor();

/**
 * API 실행 시간 측정 데코레이터
 */
export function measureApiTime<T>(
  name: string, 
  fn: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measureApiTime(name, fn);
}

/**
 * 쿼리 실행 시간 측정 데코레이터
 */
export function measureQueryTime<T>(
  queryName: string,
  fn: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measureQueryTime(queryName, fn);
}

/**
 * 성능 통계 조회
 */
export function getPerformanceStats(name?: string) {
  return performanceMonitor.getStats(name);
}

/**
 * 느린 API 목록 조회
 */
export function getSlowApis(threshold = 1000) {
  return performanceMonitor.getSlowApis(threshold);
}

/**
 * DB 타임아웃 에러 핸들러
 */
export function handleDatabaseTimeout(error: unknown, operation: string) {
  if (error instanceof Error && error.message.includes('statement timeout')) {
    console.error(`🚨 DATABASE TIMEOUT: ${operation} exceeded ${PERFORMANCE_THRESHOLDS.TIMEOUT.DEFAULT / 1000} second limit`);
    return {
      error: 'Database operation timed out',
      code: 'DB_TIMEOUT',
      operation
    };
  }
  
  if (error instanceof Error && error.message.includes('canceling statement')) {
    console.error(`🚨 QUERY CANCELLED: ${operation} was cancelled due to timeout`);
    return {
      error: 'Query was cancelled due to timeout',
      code: 'QUERY_CANCELLED',
      operation
    };
  }

  return null;
}

/**
 * 쿼리 타임아웃 래퍼
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = PERFORMANCE_THRESHOLDS.TIMEOUT.DEFAULT,
  operation: string = 'unknown'
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation '${operation}' timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const result = await fn();
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}
