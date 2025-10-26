#!/usr/bin/env tsx

/**
 * 방문통계 시스템 종합 테스트 스크립트
 * 전체 방문통계 플로우를 테스트하여 시스템이 정상 동작하는지 확인합니다.
 */

import { config } from 'dotenv';
import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';
import { getDbClient } from '../lib/db/client';
import { visitLogs } from '../lib/db/schema';
import { recordVisit, getAnalyticsOverview } from '../lib/server/analytics';

// 환경 변수 로드
config({ path: '.env.local' });

// 환경 변수가 제대로 로드되었는지 확인
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL이 설정되지 않았습니다.');
  console.log('현재 환경 변수:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? '설정됨' : '설정되지 않음'
  });
  process.exit(1);
}

const formatDate = (date: Date) => {
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  duration?: number;
}

class VisitTrackingTester {
  private results: TestResult[] = [];
  
  private addResult(result: TestResult) {
    this.results.push(result);
    const status = result.success ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${status} ${result.name}: ${result.message}${duration}`);
  }
  
  async testDatabaseConnection(): Promise<void> {
    const startTime = Date.now();
    try {
      const db = await getDbClient();
      await db.execute(sql`SELECT 1`);
      const duration = Date.now() - startTime;
      this.addResult({
        name: '데이터베이스 연결',
        success: true,
        message: '데이터베이스 연결 성공',
        duration
      });
    } catch (error) {
      this.addResult({
        name: '데이터베이스 연결',
        success: false,
        message: `연결 실패: ${error instanceof Error ? error.message : String(error)}`
      });
      throw error;
    }
  }
  
  async testRecordVisit(): Promise<void> {
    const startTime = Date.now();
    try {
      const testSessionId = `test-${randomUUID()}`;
      const testIpAddress = '192.168.1.100';
      
      // 방문 기록 전 데이터 확인
      const db = await getDbClient();
      const beforeCount = await db.select({ count: sql<number>`count(*)` }).from(visitLogs);
      
      // 방문 기록 생성
      await recordVisit({
        sessionId: testSessionId,
        ipAddress: testIpAddress
      });
      
      // 방문 기록 후 데이터 확인
      const afterCount = await db.select({ count: sql<number>`count(*)` }).from(visitLogs);
      const newRecord = await db.select()
        .from(visitLogs)
        .where(sql`${visitLogs.sessionId} = ${testSessionId}`)
        .limit(1);
      
      const duration = Date.now() - startTime;
      
      if (afterCount[0].count > beforeCount[0].count && newRecord.length > 0) {
        this.addResult({
          name: '방문 기록 저장',
          success: true,
          message: `테스트 세션 ${testSessionId.slice(-8)} 방문 기록 저장 성공`,
          duration
        });
      } else {
        this.addResult({
          name: '방문 기록 저장',
          success: false,
          message: '방문 기록이 저장되지 않았습니다'
        });
      }
    } catch (error) {
      this.addResult({
        name: '방문 기록 저장',
        success: false,
        message: `저장 실패: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
  
  async testAnalyticsOverview(): Promise<void> {
    const startTime = Date.now();
    try {
      const overview = await getAnalyticsOverview();
      const duration = Date.now() - startTime;
      
      // 기본 필드 존재 확인
      const requiredFields = [
        'timestamp', 'totalVisits', 'uniqueSessions', 'uniqueUsers',
        'activeUsers', 'recentSignups', 'recentPosts', 'dailyVisits'
      ];
      
      const missingFields = requiredFields.filter(field => !(field in overview));
      
      if (missingFields.length === 0) {
        this.addResult({
          name: '통계 집계',
          success: true,
          message: `통계 생성 성공 - 총 방문: ${overview.totalVisits}, 고유 세션: ${overview.uniqueSessions}`,
          duration
        });
      } else {
        this.addResult({
          name: '통계 집계',
          success: false,
          message: `필수 필드 누락: ${missingFields.join(', ')}`
        });
      }
    } catch (error) {
      this.addResult({
        name: '통계 집계',
        success: false,
        message: `집계 실패: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
  
  async testApiEndpoint(): Promise<void> {
    const startTime = Date.now();
    try {
      const testSessionId = `api-test-${randomUUID()}`;
      const testPath = '/test-page';
      
      // API 엔드포인트 테스트를 위한 fetch 요청 시뮬레이션
      const response = await fetch('http://localhost:3000/api/analytics/visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: testSessionId,
          path: testPath
        })
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          this.addResult({
            name: 'API 엔드포인트',
            success: true,
            message: `API 호출 성공 (${response.status})`,
            duration
          });
        } else {
          this.addResult({
            name: 'API 엔드포인트',
            success: false,
            message: `API 응답 오류: ${JSON.stringify(data)}`
          });
        }
      } else {
        this.addResult({
          name: 'API 엔드포인트',
          success: false,
          message: `HTTP 오류: ${response.status} ${response.statusText}`
        });
      }
    } catch (error) {
      this.addResult({
        name: 'API 엔드포인트',
        success: false,
        message: `API 호출 실패: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
  
  async testDataConsistency(): Promise<void> {
    const startTime = Date.now();
    try {
      const db = await getDbClient();
      
      // 최근 1시간 내 방문 기록 확인
      const recentVisits = await db.select({
        sessionId: visitLogs.sessionId,
        userId: visitLogs.userId,
        occurredAt: visitLogs.occurredAt
      })
      .from(visitLogs)
      .where(sql`${visitLogs.occurredAt} >= current_timestamp - interval '1 hour'`)
      .orderBy(sql`${visitLogs.occurredAt} desc`)
      .limit(10);
      
      const duration = Date.now() - startTime;
      
      if (recentVisits.length > 0) {
        // 데이터 일관성 검증
        const hasValidTimestamps = recentVisits.every(v => 
          new Date(v.occurredAt).getTime() <= Date.now()
        );
        const hasValidSessionIds = recentVisits.every(v => 
          v.sessionId && v.sessionId.length > 0
        );
        
        if (hasValidTimestamps && hasValidSessionIds) {
          this.addResult({
            name: '데이터 일관성',
            success: true,
            message: `최근 방문 ${recentVisits.length}건 데이터 정상`,
            duration
          });
        } else {
          this.addResult({
            name: '데이터 일관성',
            success: false,
            message: '데이터 일관성 문제 발견'
          });
        }
      } else {
        this.addResult({
          name: '데이터 일관성',
          success: true,
          message: '최근 방문 기록 없음 (정상)',
          duration
        });
      }
    } catch (error) {
      this.addResult({
        name: '데이터 일관성',
        success: false,
        message: `일관성 검증 실패: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
  
  async testPerformance(): Promise<void> {
    const startTime = Date.now();
    try {
      // 대량 데이터 처리 성능 테스트
      const testSessionIds = Array.from({ length: 10 }, () => `perf-test-${randomUUID()}`);
      
      const recordStartTime = Date.now();
      await Promise.all(testSessionIds.map(sessionId => 
        recordVisit({ sessionId, ipAddress: '192.168.1.100' })
      ));
      const recordDuration = Date.now() - recordStartTime;
      
      const overviewStartTime = Date.now();
      await getAnalyticsOverview();
      const overviewDuration = Date.now() - overviewStartTime;
      
      const totalDuration = Date.now() - startTime;
      
      this.addResult({
        name: '성능 테스트',
        success: true,
        message: `10건 기록: ${recordDuration}ms, 통계 집계: ${overviewDuration}ms`,
        duration: totalDuration
      });
    } catch (error) {
      this.addResult({
        name: '성능 테스트',
        success: false,
        message: `성능 테스트 실패: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
  
  async runAllTests(): Promise<void> {
    console.log('🧪 방문통계 시스템 종합 테스트 시작...\n');
    
    try {
      await this.testDatabaseConnection();
      await this.testRecordVisit();
      await this.testAnalyticsOverview();
      await this.testDataConsistency();
      await this.testPerformance();
      
      // API 테스트는 서버가 실행 중일 때만 수행
      try {
        await this.testApiEndpoint();
      } catch (error) {
        this.addResult({
          name: 'API 엔드포인트',
          success: false,
          message: '서버가 실행되지 않음 (npm run dev로 서버 시작 후 재테스트)'
        });
      }
      
    } catch (error) {
      console.error('❌ 테스트 실행 중 오류:', error);
    }
    
    this.printSummary();
  }
  
  private printSummary(): void {
    console.log('\n📊 === 테스트 결과 요약 ===');
    
    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    const successRate = Math.round((successCount / totalCount) * 100);
    
    console.log(`총 테스트: ${totalCount}개`);
    console.log(`성공: ${successCount}개`);
    console.log(`실패: ${totalCount - successCount}개`);
    console.log(`성공률: ${successRate}%`);
    
    const failedTests = this.results.filter(r => !r.success);
    if (failedTests.length > 0) {
      console.log('\n❌ 실패한 테스트:');
      failedTests.forEach(test => {
        console.log(`  - ${test.name}: ${test.message}`);
      });
    }
    
    if (successRate >= 80) {
      console.log('\n🎉 방문통계 시스템이 정상적으로 동작하고 있습니다!');
    } else if (successRate >= 60) {
      console.log('\n⚠️ 방문통계 시스템에 일부 문제가 있습니다.');
    } else {
      console.log('\n🚨 방문통계 시스템에 심각한 문제가 있습니다.');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  const tester = new VisitTrackingTester();
  tester.runAllTests()
    .then(() => {
      console.log('\n✅ 테스트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 테스트 실행 실패:', error);
      process.exit(1);
    });
}

export { VisitTrackingTester };
