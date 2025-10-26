#!/usr/bin/env tsx

/**
 * 방문통계 데이터베이스 상세 분석 스크립트
 * VisitLog 테이블의 데이터를 분석하여 방문통계 시스템 상태를 확인합니다.
 */

import { config } from 'dotenv';
import { sql } from 'drizzle-orm';
import { getDbClient } from '../lib/db/client';
import { visitLogs, users } from '../lib/db/schema';

// 환경 변수 로드
config({ path: '.env.local' });

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

const formatDateOnly = (date: Date) => {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

async function analyzeVisitStats() {
  console.log('🔍 방문통계 데이터베이스 분석 시작...\n');
  
  try {
    const db = await getDbClient();
    
    // 1. 전체 데이터 통계
    console.log('📊 === 전체 데이터 통계 ===');
    const totalStats = await db.select({
      totalRecords: sql<number>`count(*)`,
      uniqueSessions: sql<number>`count(distinct ${visitLogs.sessionId})`,
      uniqueUsers: sql<number>`count(distinct ${visitLogs.userId})`,
      anonymousVisits: sql<number>`count(*) filter (where ${visitLogs.userId} is null)`,
      authenticatedVisits: sql<number>`count(*) filter (where ${visitLogs.userId} is not null)`,
      earliestVisit: sql<string>`min(${visitLogs.occurredAt})`,
      latestVisit: sql<string>`max(${visitLogs.occurredAt})`
    }).from(visitLogs);
    
    const stats = totalStats[0];
    console.log(`총 방문 기록: ${stats.totalRecords.toLocaleString()}건`);
    console.log(`고유 세션 수: ${stats.uniqueSessions.toLocaleString()}개`);
    console.log(`고유 사용자 수: ${stats.uniqueUsers.toLocaleString()}명`);
    console.log(`익명 방문: ${stats.anonymousVisits.toLocaleString()}건`);
    console.log(`로그인 방문: ${stats.authenticatedVisits.toLocaleString()}건`);
    console.log(`최초 방문: ${stats.earliestVisit ? formatDate(new Date(stats.earliestVisit)) : '없음'}`);
    console.log(`최근 방문: ${stats.latestVisit ? formatDate(new Date(stats.latestVisit)) : '없음'}`);
    
    // 2. 일별 방문 추이 (최근 30일)
    console.log('\n📈 === 일별 방문 추이 (최근 30일) ===');
    const dailyStats = await db.select({
      date: sql<string>`date(${visitLogs.occurredAt})`,
      visits: sql<number>`count(*)`,
      uniqueSessions: sql<number>`count(distinct ${visitLogs.sessionId})`,
      uniqueUsers: sql<number>`count(distinct ${visitLogs.userId})`
    })
    .from(visitLogs)
    .where(sql`${visitLogs.occurredAt} >= current_date - interval '30 days'`)
    .groupBy(sql`date(${visitLogs.occurredAt})`)
    .orderBy(sql`date(${visitLogs.occurredAt}) desc`);
    
    if (dailyStats.length === 0) {
      console.log('❌ 최근 30일간 방문 기록이 없습니다.');
    } else {
      dailyStats.forEach(day => {
        console.log(`${day.date}: 방문 ${day.visits}건, 세션 ${day.uniqueSessions}개, 사용자 ${day.uniqueUsers}명`);
      });
    }
    
    // 3. 시간별 방문 패턴 (최근 7일)
    console.log('\n🕐 === 시간별 방문 패턴 (최근 7일) ===');
    const hourlyStats = await db.select({
      hour: sql<number>`extract(hour from ${visitLogs.occurredAt})`,
      visits: sql<number>`count(*)`
    })
    .from(visitLogs)
    .where(sql`${visitLogs.occurredAt} >= current_date - interval '7 days'`)
    .groupBy(sql`extract(hour from ${visitLogs.occurredAt})`)
    .orderBy(sql`extract(hour from ${visitLogs.occurredAt})`);
    
    const hourlyMap = new Map(hourlyStats.map(h => [h.hour, h.visits]));
    for (let hour = 0; hour < 24; hour++) {
      const visits = hourlyMap.get(hour) || 0;
      const bar = '█'.repeat(Math.min(Math.floor(visits / 5), 20));
      console.log(`${hour.toString().padStart(2, '0')}시: ${visits.toString().padStart(3)}건 ${bar}`);
    }
    
    // 4. 사용자별 방문 패턴 (상위 10명)
    console.log('\n👥 === 사용자별 방문 패턴 (상위 10명) ===');
    const userStats = await db.select({
      userId: visitLogs.userId,
      email: users.email,
      visitCount: sql<number>`count(*)`,
      lastVisit: sql<string>`max(${visitLogs.occurredAt})`
    })
    .from(visitLogs)
    .leftJoin(users, sql`${visitLogs.userId} = ${users.id}`)
    .where(sql`${visitLogs.userId} is not null`)
    .groupBy(visitLogs.userId, users.email)
    .orderBy(sql`count(*) desc`)
    .limit(10);
    
    if (userStats.length === 0) {
      console.log('❌ 로그인 사용자 방문 기록이 없습니다.');
    } else {
      userStats.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email || 'Unknown'}: ${user.visitCount}회 방문 (최근: ${formatDate(new Date(user.lastVisit))})`);
      });
    }
    
    // 5. 최근 방문 기록 샘플 (최근 20건)
    console.log('\n📝 === 최근 방문 기록 샘플 (최근 20건) ===');
    const recentVisits = await db.select({
      id: visitLogs.id,
      sessionId: visitLogs.sessionId,
      userId: visitLogs.userId,
      email: users.email,
      occurredAt: visitLogs.occurredAt,
      ipHash: visitLogs.ipHash
    })
    .from(visitLogs)
    .leftJoin(users, sql`${visitLogs.userId} = ${users.id}`)
    .orderBy(sql`${visitLogs.occurredAt} desc`)
    .limit(20);
    
    if (recentVisits.length === 0) {
      console.log('❌ 방문 기록이 없습니다.');
    } else {
      recentVisits.forEach((visit, index) => {
        const userInfo = visit.email ? `[${visit.email}]` : `[익명-${visit.sessionId.slice(-8)}]`;
        const ipInfo = visit.ipHash ? `IP:${visit.ipHash.slice(0, 8)}...` : 'IP:없음';
        console.log(`${index + 1}. ${userInfo} ${formatDate(new Date(visit.occurredAt))} ${ipInfo}`);
      });
    }
    
    // 6. 데이터 무결성 검증
    console.log('\n🔍 === 데이터 무결성 검증 ===');
    
    // 중복 ID 체크
    const duplicateIds = await db.select({
      id: visitLogs.id,
      count: sql<number>`count(*)`
    })
    .from(visitLogs)
    .groupBy(visitLogs.id)
    .having(sql`count(*) > 1`);
    
    if (duplicateIds.length > 0) {
      console.log(`❌ 중복 ID 발견: ${duplicateIds.length}개`);
    } else {
      console.log('✅ ID 중복 없음');
    }
    
    // NULL sessionId 체크
    const nullSessionIds = await db.select({
      count: sql<number>`count(*)`
    })
    .from(visitLogs)
    .where(sql`${visitLogs.sessionId} is null`);
    
    if (nullSessionIds[0].count > 0) {
      console.log(`❌ NULL sessionId 발견: ${nullSessionIds[0].count}건`);
    } else {
      console.log('✅ sessionId NULL 없음');
    }
    
    // 잘못된 날짜 체크
    const invalidDates = await db.select({
      count: sql<number>`count(*)`
    })
    .from(visitLogs)
    .where(sql`${visitLogs.occurredAt} > current_timestamp + interval '1 day' or ${visitLogs.occurredAt} < '2020-01-01'`);
    
    if (invalidDates[0].count > 0) {
      console.log(`❌ 잘못된 날짜 발견: ${invalidDates[0].count}건`);
    } else {
      console.log('✅ 날짜 데이터 정상');
    }
    
    // 7. 시스템 상태 요약
    console.log('\n📋 === 시스템 상태 요약 ===');
    const hasData = stats.totalRecords > 0;
    const hasRecentData = dailyStats.length > 0;
    const hasUserData = userStats.length > 0;
    
    console.log(`데이터 존재: ${hasData ? '✅' : '❌'}`);
    console.log(`최근 활동: ${hasRecentData ? '✅' : '❌'}`);
    console.log(`사용자 활동: ${hasUserData ? '✅' : '❌'}`);
    
    if (hasData && hasRecentData) {
      console.log('\n🎉 방문통계 시스템이 정상적으로 동작하고 있습니다!');
    } else {
      console.log('\n⚠️ 방문통계 시스템에 문제가 있을 수 있습니다.');
      if (!hasData) {
        console.log('   - 방문 기록이 전혀 없습니다. 프론트엔드 트래킹을 확인하세요.');
      }
      if (!hasRecentData) {
        console.log('   - 최근 방문 기록이 없습니다. API 엔드포인트를 확인하세요.');
      }
    }
    
  } catch (error) {
    console.error('❌ 분석 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  analyzeVisitStats()
    .then(() => {
      console.log('\n✅ 분석 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export { analyzeVisitStats };
