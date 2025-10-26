import { createHash, randomUUID } from 'crypto';
import { gte, sql, inArray } from 'drizzle-orm';

import { getDbClient } from '@/lib/db/client';
import { visitLogs, users, posts } from '@/lib/db/schema';
import { evaluateAuthorization } from '@/lib/auth/session';

export const VISIT_LOOKBACK_DAYS = 30;
export const SIGNUP_LOOKBACK_DAYS = 30;
export const ACTIVE_USER_WINDOW_DAYS = 7;

interface VisitRecordInput {
  sessionId: string;
  ipAddress?: string | null;
  authorization?: string | null;
}

// 유저 정보 타입 정의
export interface RegisteredUser {
  type: 'registered';
  email: string;
}

export interface AnonymousUser {
  type: 'anonymous';
  sessionId: string;
  displayNumber: number;
}

export type UserInfo = RegisteredUser | AnonymousUser;

export interface AnalyticsOverview {
  timestamp: string;
  totalVisits: number;
  uniqueSessions: number;
  uniqueUsers: number;
  activeUsers: number;
  recentSignups: number;        // 최근 7일 회원가입 수
  recentPosts: number;           // 최근 7일 게시글 작성 수
  dailyVisits: Array<{
    date: string;
    visits: number;
    uniqueSessions: number;
    uniqueUsers: number;
    userList: UserInfo[];  // 해당 날짜 방문한 유저 목록
  }>;
  signupTrend: Array<{
    date: string;
    signups: number;
  }>;
  dailySignups: Array<{          // 일별 회원가입 (차트용)
    date: string;
    signups: number;
  }>;
  dailyPosts: Array<{            // 일별 게시글 작성 (차트용)
    date: string;
    posts: number;
  }>;
}

const todayKey = (date: Date) => date.toISOString().slice(0, 10);

const hashIp = (ip: string | null | undefined) => {
  if (!ip) {
    return null;
  }

  try {
    return createHash('sha256').update(ip.trim()).digest('hex');
  } catch (error) {
    console.warn('Failed to hash IP address for analytics', error);
    return null;
  }
};

export const recordVisit = async ({
  sessionId,
  ipAddress,
  authorization
}: VisitRecordInput) => {
  const normalizedSessionId = sessionId.trim();

  if (!normalizedSessionId) {
    throw new Error('Session identifier is required.');
  }

  try {
    let userId: string | null = null;
    
    // 인증 시도 (실패해도 방문 로그는 기록)
    try {
      const { user } = await evaluateAuthorization(
        {},
        authorization ? { authorization } : undefined
      );
      userId = user?.id ?? null;
    } catch (authError) {
      // 인증 실패는 로그만 남기고 계속 진행
      console.warn('Failed to authenticate user for visit log:', {
        error: authError instanceof Error ? authError.message : String(authError),
        sessionId: normalizedSessionId
      });
    }

    const db = await getDbClient();
    await db.insert(visitLogs).values({
      id: randomUUID(),
      sessionId: normalizedSessionId,
      userId,
      ipHash: hashIp(ipAddress),
      occurredAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to record visit analytics', error);
    throw error;
  }
};

type VisitBucket = {
  date: string;
  visits: number;
  uniqueSessions: Set<string>;
  uniqueUsers: Set<string>;
  userList: UserInfo[];
};

type SignupBucket = {
  date: string;
  signups: number;
};

const ensureDayBucket = <T extends { date: string }>(
  buckets: Map<string, T>,
  date: string,
  factory: () => T
) => {
  if (!buckets.has(date)) {
    buckets.set(date, factory());
  }
  return buckets.get(date)!;
};

export const getAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
  const now = new Date();
  const visitSince = new Date(now);
  visitSince.setDate(visitSince.getDate() - VISIT_LOOKBACK_DAYS);

  const signupSince = new Date(now);
  signupSince.setDate(signupSince.getDate() - SIGNUP_LOOKBACK_DAYS);

  const activeSince = new Date(now);
  activeSince.setDate(activeSince.getDate() - ACTIVE_USER_WINDOW_DAYS);

  const recentPostsSince = new Date(now);
  recentPostsSince.setDate(recentPostsSince.getDate() - 7);

  const db = await getDbClient();
  const [visitLogsData, recentUsersData, recentPostsData] = await Promise.all([
    db.select({
      occurredAt: visitLogs.occurredAt,
      sessionId: visitLogs.sessionId,
      userId: visitLogs.userId
    }).from(visitLogs).where(gte(visitLogs.occurredAt, visitSince.toISOString())),
    db.select({
      createdAt: users.createdAt
    }).from(users).where(gte(users.createdAt, signupSince.toISOString())),
    db.select({
      createdAt: posts.createdAt
    }).from(posts).where(gte(posts.createdAt, recentPostsSince.toISOString()))
  ]);

  // 유저 이메일 정보를 가져오기 위한 추가 쿼리
  const userIds = [...new Set(visitLogsData.filter(log => log.userId).map(log => log.userId!))];
  const userEmails = userIds.length > 0 
    ? await db.select({
        id: users.id,
        email: users.email
      }).from(users).where(inArray(users.id, userIds))
    : [];
  
  const userEmailMap = new Map(userEmails.map(user => [user.id, user.email]));

  const totalVisits = visitLogsData.length;
  const uniqueSessionSet = new Set<string>();
  const uniqueUserSet = new Set<string>();
  
  // 세션별 userId 추적 (중복 카운트 방지)
  const sessionToUser = new Map<string, string | null>();

  const dailyBuckets = new Map<string, VisitBucket>();
  const sessionToAnonymousNumber = new Map<string, number>();
  let anonymousCounter = 1;

  for (const log of visitLogsData) {
    const dateKey = todayKey(new Date(log.occurredAt));
    const bucket = ensureDayBucket(dailyBuckets, dateKey, () => ({
      date: dateKey,
      visits: 0,
      uniqueSessions: new Set<string>(),
      uniqueUsers: new Set<string>(),
      userList: []
    }));

    bucket.visits += 1;
    
    // 세션이 처음 나타날 때만 카운트 (중복 방지)
    if (!uniqueSessionSet.has(log.sessionId)) {
      uniqueSessionSet.add(log.sessionId);
      bucket.uniqueSessions.add(log.sessionId);
    }
    
    // userId 추적 (나중에 로그인한 경우를 위해)
    const prevUserId = sessionToUser.get(log.sessionId);
    if (log.userId) {
      sessionToUser.set(log.sessionId, log.userId);
    } else if (prevUserId === undefined) {
      sessionToUser.set(log.sessionId, null);
    }

    if (log.userId) {
      bucket.uniqueUsers.add(log.userId);
      uniqueUserSet.add(log.userId);
      
      // 로그인 유저 정보 추가
      const email = userEmailMap.get(log.userId);
      if (email) {
        bucket.userList.push({
          type: 'registered',
          email: email
        });
      }
    } else {
      // 익명 유저 처리
      if (!sessionToAnonymousNumber.has(log.sessionId)) {
        sessionToAnonymousNumber.set(log.sessionId, anonymousCounter++);
      }
      
      bucket.userList.push({
        type: 'anonymous',
        sessionId: log.sessionId,
        displayNumber: sessionToAnonymousNumber.get(log.sessionId)!
      });
    }
  }

  const activeUserSet = new Set<string>();
  for (const log of visitLogsData) {
    if (log.userId && new Date(log.occurredAt) >= activeSince) {
      activeUserSet.add(log.userId);
    }
  }

  const dailyVisits = Array.from(dailyBuckets.values())
    .map((bucket) => ({
      date: bucket.date,
      visits: bucket.visits,
      uniqueSessions: bucket.uniqueSessions.size,
      uniqueUsers: bucket.uniqueUsers.size,
      userList: bucket.userList
    }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const signupBuckets = new Map<string, SignupBucket>();
  for (const user of recentUsersData) {
    const dateKey = todayKey(new Date(user.createdAt));
    const bucket = ensureDayBucket(signupBuckets, dateKey, () => ({ date: dateKey, signups: 0 }));
    bucket.signups += 1;
  }

  const signupTrend = Array.from(signupBuckets.values()).sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0
  );

  // 일별 게시글 집계
  const postBuckets = new Map<string, number>();
  for (const post of recentPostsData) {
    const dateKey = todayKey(new Date(post.createdAt));
    postBuckets.set(dateKey, (postBuckets.get(dateKey) || 0) + 1);
  }

  const dailyPosts = Array.from(postBuckets.entries())
    .map(([date, posts]) => ({ date, posts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 최근 7일 회원가입 합계
  const recentSignups = signupTrend
    .filter(s => new Date(s.date) >= recentPostsSince)
    .reduce((sum, s) => sum + s.signups, 0);

  // 최근 7일 게시글 작성 수
  const recentPosts = recentPostsData.length;

  return {
    timestamp: now.toISOString(),
    totalVisits,
    uniqueSessions: uniqueSessionSet.size,
    uniqueUsers: uniqueUserSet.size,
    activeUsers: activeUserSet.size,
    recentSignups: Number(recentSignups) || 0,
    recentPosts: Number(recentPosts) || 0,
    dailyVisits,
    signupTrend,
    dailySignups: signupTrend,
    dailyPosts
  };
};
