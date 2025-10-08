import { createHash } from 'crypto';
import { gte } from 'drizzle-orm';

import { getDb } from '@/lib/db/client';
import { visitLogs, users } from '@/lib/db/schema';
import { evaluateAuthorization } from '@/lib/auth/session';

export const VISIT_LOOKBACK_DAYS = 30;
export const SIGNUP_LOOKBACK_DAYS = 30;
export const ACTIVE_USER_WINDOW_DAYS = 7;

interface VisitRecordInput {
  sessionId: string;
  ipAddress?: string | null;
  authorization?: string | null;
}

export interface AnalyticsOverview {
  timestamp: string;
  totalVisits: number;
  uniqueSessions: number;
  uniqueUsers: number;
  activeUsers: number;
  dailyVisits: Array<{
    date: string;
    visits: number;
    uniqueSessions: number;
    uniqueUsers: number;
  }>;
  signupTrend: Array<{
    date: string;
    signups: number;
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
    const { user } = await evaluateAuthorization(
      {},
      authorization ? { authorization } : undefined
    );

    const db = await getDb();
    await db.insert(visitLogs).values({
      id: crypto.randomUUID(),
      sessionId: normalizedSessionId,
      userId: user?.id ?? null,
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

  const [visitLogsData, recentUsersData] = await Promise.all([
    db.select({
      occurredAt: visitLogs.occurredAt,
      sessionId: visitLogs.sessionId,
      userId: visitLogs.userId
    }).from(visitLogs).where(gte(visitLogs.occurredAt, visitSince.toISOString())),
    db.select({
      createdAt: users.createdAt
    }).from(users).where(gte(users.createdAt, signupSince.toISOString()))
  ]);

  const totalVisits = visitLogsData.length;
  const uniqueSessionSet = new Set<string>();
  const uniqueUserSet = new Set<string>();

  const dailyBuckets = new Map<string, VisitBucket>();

  for (const log of visitLogsData) {
    const dateKey = todayKey(new Date(log.occurredAt));
    const bucket = ensureDayBucket(dailyBuckets, dateKey, () => ({
      date: dateKey,
      visits: 0,
      uniqueSessions: new Set<string>(),
      uniqueUsers: new Set<string>()
    }));

    bucket.visits += 1;
    bucket.uniqueSessions.add(log.sessionId);
    uniqueSessionSet.add(log.sessionId);

    if (log.userId) {
      bucket.uniqueUsers.add(log.userId);
      uniqueUserSet.add(log.userId);
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
      uniqueUsers: bucket.uniqueUsers.size
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

  return {
    timestamp: now.toISOString(),
    totalVisits,
    uniqueSessions: uniqueSessionSet.size,
    uniqueUsers: uniqueUserSet.size,
    activeUsers: activeUserSet.size,
    dailyVisits,
    signupTrend
  };
};
