#!/usr/bin/env tsx

/**
 * 비로그인 → 로그인 방문자 카운트 로직 테스트
 */

import { config } from 'dotenv';
import { sql } from 'drizzle-orm';
import { getDbClient } from '../lib/db/client';
import { visitLogs, users } from '../lib/db/schema';

// 환경 변수 로드
config({ path: '.env.local' });

interface TestScenario {
  name: string;
  sessionId: string;
  visits: Array<{
    isLoggedIn: boolean;
    userId?: string;
    timestamp: Date;
  }>;
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

async function analyzeCurrentBehavior() {
  console.log('🔍 현재 시스템 동작 분석...\n');
  
  try {
    const db = await getDbClient();
    
    // 최근 10건의 방문 기록 조회
    const recentVisits = await db.select({
      id: visitLogs.id,
      sessionId: visitLogs.sessionId,
      userId: visitLogs.userId,
      occurredAt: visitLogs.occurredAt
    })
    .from(visitLogs)
    .orderBy(sql`${visitLogs.occurredAt} desc`)
    .limit(50);
    
    console.log(`📊 최근 50건의 방문 기록 분석:\n`);
    
    // 세션별 방문 패턴 분석
    const sessionPatterns = new Map<string, {
      totalVisits: number;
      beforeLogin: number;
      afterLogin: number;
      userIds: Set<string>;
      firstVisit: Date;
      lastVisit: Date;
    }>();
    
    for (const visit of recentVisits) {
      const sessionId = visit.sessionId;
      if (!sessionPatterns.has(sessionId)) {
        sessionPatterns.set(sessionId, {
          totalVisits: 0,
          beforeLogin: 0,
          afterLogin: 0,
          userIds: new Set(),
          firstVisit: new Date(visit.occurredAt),
          lastVisit: new Date(visit.occurredAt)
        });
      }
      
      const pattern = sessionPatterns.get(sessionId)!;
      pattern.totalVisits++;
      
      const visitTime = new Date(visit.occurredAt);
      if (visitTime < pattern.firstVisit) {
        pattern.firstVisit = visitTime;
      }
      if (visitTime > pattern.lastVisit) {
        pattern.lastVisit = visitTime;
      }
      
      if (visit.userId) {
        pattern.userIds.add(visit.userId);
        pattern.afterLogin++;
      } else {
        pattern.beforeLogin++;
      }
    }
    
    // 로그인 전환 패턴이 있는 세션 찾기
    const sessionsWithLogin = Array.from(sessionPatterns.entries())
      .filter(([_, pattern]) => pattern.beforeLogin > 0 && pattern.afterLogin > 0)
      .sort((a, b) => b[1].totalVisits - a[1].totalVisits);
    
    console.log(`\n🔄 로그인 전환 패턴이 있는 세션: ${sessionsWithLogin.length}개\n`);
    
    if (sessionsWithLogin.length > 0) {
      console.log('상위 5개 세션:');
      sessionsWithLogin.slice(0, 5).forEach(([sessionId, pattern], index) => {
        console.log(`\n${index + 1}. 세션 ${sessionId.slice(-8)}`);
        console.log(`   전체 방문: ${pattern.totalVisits}회`);
        console.log(`   비로그인: ${pattern.beforeLogin}회`);
        console.log(`   로그인 후: ${pattern.afterLogin}회`);
        console.log(`   연관 사용자: ${pattern.userIds.size}명`);
        console.log(`   시간 범위: ${formatDate(pattern.firstVisit)} ~ ${formatDate(pattern.lastVisit)}`);
        
        // 이 세션의 상세 방문 기록
        const sessionVisits = recentVisits.filter(v => v.sessionId === sessionId);
        console.log(`   방문 내역:`);
        sessionVisits.forEach((visit, i) => {
          const userInfo = visit.userId ? `[로그인]` : `[익명]`;
          console.log(`      ${i + 1}. ${userInfo} ${formatDate(new Date(visit.occurredAt))}`);
        });
      });
    } else {
      console.log('⚠️ 로그인 전환 패턴을 찾을 수 없습니다.');
      console.log('이는 다음을 의미할 수 있습니다:');
      console.log('  1. 사용자들이 로그인하지 않고 방문함');
      console.log('  2. 로그인 후 즉시 새 세션으로 시작함');
      console.log('  3. 데이터가 부족함\n');
    }
    
    // 통계 집계 방식 확인
    console.log('\n📈 통계 집계 방식 분석:\n');
    
    const uniqueSessions = new Set(recentVisits.map(v => v.sessionId));
    const uniqueUsers = new Set(recentVisits.filter(v => v.userId).map(v => v.userId!));
    const anonymousVisits = recentVisits.filter(v => !v.userId).length;
    const authenticatedVisits = recentVisits.filter(v => v.userId).length;
    
    console.log(`총 방문 기록: ${recentVisits.length}건`);
    console.log(`고유 세션: ${uniqueSessions.size}개`);
    console.log(`고유 사용자: ${uniqueUsers.size}명`);
    console.log(`익명 방문: ${anonymousVisits}건`);
    console.log(`로그인 방문: ${authenticatedVisits}건`);
    
    console.log('\n💡 현재 동작 방식:');
    console.log('  - uniqueSessions: sessionId 기준 (비로그인 방문 1회, 로그인 후 방문 1회 = 총 2회)');
    console.log('  - uniqueUsers: userId 기준 (로그인 후에만 카운트)');
    console.log('  - 비로그인 방문 후 로그인: 세션 2회, 사용자 1명으로 카운트');
    
    console.log('\n⚠️ 문제점:');
    console.log('  - 같은 사용자가 비로그인과 로그인 상태로 방문하면 세션은 2개로 카운트됨');
    console.log('  - 하지만 실제로는 같은 사용자의 방문이므로 중복 카운트 가능');
    console.log('\n✅ 개선 방안:');
    console.log('  - userId가 있는 세션의 첫 방문만 카운트 (중복 방지)');
    console.log('  - 또는 userId 기준으로 통계 집계');
    
  } catch (error) {
    console.error('❌ 분석 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  analyzeCurrentBehavior()
    .then(() => {
      console.log('\n✅ 분석 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export { analyzeCurrentBehavior };

