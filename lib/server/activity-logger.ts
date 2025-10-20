/**
 * 사용자 활동 로깅 시스템
 * 
 * 접속, 회원가입, 게시글 작성, 로그인, 페이지 이동 등 사용자 활동을 추적합니다.
 */

import { randomUUID } from 'crypto';
import { getDbClient } from '@/lib/db/client';
import { auditLogs } from '@/lib/db/schema';

export type ActivityType = 
  | 'user.login'
  | 'user.logout'
  | 'user.signup'
  | 'user.profile_update'
  | 'post.create'
  | 'post.update'
  | 'post.delete'
  | 'post.view'
  | 'comment.create'
  | 'comment.update'
  | 'comment.delete'
  | 'project.create'
  | 'project.update'
  | 'project.delete'
  | 'project.view'
  | 'project.fund'
  | 'page.visit'
  | 'api.call'
  | 'error.occurred'
  | 'admin.action';

export interface ActivityContext {
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  userRole?: string | null;
  sessionId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  path?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  metadata?: Record<string, any>;
}

export interface ActivityData {
  activity: ActivityType;
  entity?: string;
  entityId?: string;
  description: string;
  context: ActivityContext;
}

/**
 * 활동 로그를 데이터베이스에 기록합니다.
 */
export async function logActivity(data: ActivityData): Promise<void> {
  try {
    const db = await getDbClient();
    
    // 사용자 식별 정보 구성
    const userInfo = data.context.userId ? {
      userId: data.context.userId,
      userEmail: data.context.userEmail,
      userName: data.context.userName,
      userRole: data.context.userRole
    } : {
      userId: null,
      userEmail: null,
      userName: null,
      userRole: null
    };

    await db.insert(auditLogs).values({
      id: randomUUID(),
      userId: data.context.userId,
      entity: data.entity || 'system',
      entityId: data.entityId || 'unknown',
      action: data.activity,
      data: {
        description: data.description,
        path: data.context.path,
        method: data.context.method,
        statusCode: data.context.statusCode,
        responseTime: data.context.responseTime,
        sessionId: data.context.sessionId,
        userInfo,
        ...data.context.metadata
      },
      ipAddress: data.context.ipAddress,
      userAgent: data.context.userAgent,
      metadata: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
      }
    });

    // 콘솔 로그 출력 (모든 환경에서)
    const userDisplay = data.context.userId 
      ? `${data.context.userName || 'Unknown'} (${data.context.userEmail || data.context.userId}) [${data.context.userRole || 'Unknown Role'}]`
      : 'Anonymous User';
    
    console.log(`📝 [ACTIVITY] ${data.activity}: ${data.description}`, {
      user: userDisplay,
      entity: data.entity,
      entityId: data.entityId,
      path: data.context.path,
      sessionId: data.context.sessionId
    });
  } catch (error) {
    console.error('Failed to log activity:', {
      activity: data.activity,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * 로그인 활동 로깅
 */
export async function logUserLogin(
  userId: string,
  userEmail: string,
  userName: string,
  userRole: string,
  context: Omit<ActivityContext, 'userId' | 'userEmail' | 'userName' | 'userRole'>
): Promise<void> {
  await logActivity({
    activity: 'user.login',
    entity: 'user',
    entityId: userId,
    description: `${userName} (${userEmail}) 로그인 - ${userRole} 역할`,
    context: { 
      ...context, 
      userId, 
      userEmail, 
      userName, 
      userRole 
    }
  });
}

/**
 * 회원가입 활동 로깅
 */
export async function logUserSignup(
  userId: string,
  userEmail: string,
  userName: string,
  context: Omit<ActivityContext, 'userId' | 'userEmail' | 'userName'>
): Promise<void> {
  await logActivity({
    activity: 'user.signup',
    entity: 'user',
    entityId: userId,
    description: `새 사용자 회원가입: ${userName} (${userEmail})`,
    context: { 
      ...context, 
      userId, 
      userEmail, 
      userName,
      userRole: 'PARTICIPANT' // 기본 역할
    }
  });
}

/**
 * 로그아웃 활동 로깅
 */
export async function logUserLogout(
  userId: string,
  userEmail: string,
  userName: string,
  userRole: string,
  context: Omit<ActivityContext, 'userId' | 'userEmail' | 'userName' | 'userRole'>
): Promise<void> {
  await logActivity({
    activity: 'user.logout',
    entity: 'user',
    entityId: userId,
    description: `${userName} (${userEmail}) 로그아웃 - ${userRole} 역할`,
    context: { 
      ...context, 
      userId, 
      userEmail, 
      userName, 
      userRole 
    }
  });
}

/**
 * 게시글 작성 활동 로깅
 */
export async function logPostCreate(
  postId: string,
  userId: string,
  userEmail: string,
  userName: string,
  userRole: string,
  postTitle: string,
  context: Omit<ActivityContext, 'userId' | 'userEmail' | 'userName' | 'userRole'>
): Promise<void> {
  await logActivity({
    activity: 'post.create',
    entity: 'post',
    entityId: postId,
    description: `${userName} (${userEmail}) 게시글 작성: "${postTitle}"`,
    context: { 
      ...context, 
      userId, 
      userEmail, 
      userName, 
      userRole 
    }
  });
}

/**
 * 게시글 조회 활동 로깅
 */
export async function logPostView(
  postId: string,
  userId: string | null,
  context: Omit<ActivityContext, 'userId'>
): Promise<void> {
  await logActivity({
    activity: 'post.view',
    entity: 'post',
    entityId: postId,
    description: `게시글 조회: ${postId}`,
    context: { ...context, userId }
  });
}

/**
 * 페이지 방문 활동 로깅
 */
export async function logPageVisit(
  path: string,
  context: ActivityContext
): Promise<void> {
  const userDisplay = context.userId 
    ? `${context.userName || 'Unknown'} (${context.userEmail || context.userId}) [${context.userRole || 'Unknown Role'}]`
    : 'Anonymous User';
  
  await logActivity({
    activity: 'page.visit',
    entity: 'page',
    entityId: path,
    description: `${userDisplay} 페이지 방문: ${path}`,
    context
  });
}

/**
 * API 호출 활동 로깅
 */
export async function logApiCall(
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  context: ActivityContext
): Promise<void> {
  const userDisplay = context.userId 
    ? `${context.userName || 'Unknown'} (${context.userEmail || context.userId}) [${context.userRole || 'Unknown Role'}]`
    : 'Anonymous User';
  
  await logActivity({
    activity: 'api.call',
    entity: 'api',
    entityId: endpoint,
    description: `${userDisplay} API 호출: ${method} ${endpoint} (${statusCode})`,
    context: {
      ...context,
      method,
      statusCode,
      responseTime
    }
  });
}

/**
 * 에러 발생 활동 로깅
 */
export async function logError(
  error: Error,
  context: ActivityContext
): Promise<void> {
  await logActivity({
    activity: 'error.occurred',
    entity: 'error',
    entityId: error.name,
    description: `에러 발생: ${error.message}`,
    context: {
      ...context,
      metadata: {
        errorName: error.name,
        errorStack: error.stack,
        ...context.metadata
      }
    }
  });
}

/**
 * 프로젝트 펀딩 활동 로깅
 */
export async function logProjectFund(
  projectId: string,
  userId: string,
  amount: number,
  context: Omit<ActivityContext, 'userId'>
): Promise<void> {
  await logActivity({
    activity: 'project.fund',
    entity: 'project',
    entityId: projectId,
    description: `프로젝트 펀딩: ${projectId} (${amount}원)`,
    context: {
      ...context,
      userId,
      metadata: {
        amount,
        ...context.metadata
      }
    }
  });
}

/**
 * 관리자 활동 로깅
 */
export async function logAdminAction(
  action: string,
  adminUserId: string,
  targetEntity?: string,
  targetId?: string,
  context?: Omit<ActivityContext, 'userId'>
): Promise<void> {
  await logActivity({
    activity: 'admin.action',
    entity: targetEntity || 'system',
    entityId: targetId || 'unknown',
    description: `관리자 활동: ${action}`,
    context: {
      ...context,
      userId: adminUserId,
      metadata: {
        adminAction: action,
        ...context?.metadata
      }
    }
  });
}
