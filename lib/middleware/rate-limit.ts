import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // 시간 윈도우 (밀리초)
  maxRequests: number; // 최대 요청 수
  message?: string; // 제한 초과 시 메시지
  skipSuccessfulRequests?: boolean; // 성공한 요청도 카운트할지 여부
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// 메모리 기반 저장소 (프로덕션에서는 Redis 사용 권장)
const store: RateLimitStore = {};

// 기본 설정
const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1분
  maxRequests: 100, // 최대 100 요청
  message: 'Too many requests, please try again later.',
  skipSuccessfulRequests: false
};

// IP 주소 추출 함수
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// 레이트 리미터 클래스
export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.store = store;
  }

  // 요청 제한 확인
  isAllowed(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowMs = this.config.windowMs;
    const maxRequests = this.config.maxRequests;

    // 기존 기록이 없거나 윈도우가 만료된 경우
    if (!this.store[identifier] || now > this.store[identifier].resetTime) {
      this.store[identifier] = {
        count: 1,
        resetTime: now + windowMs
      };
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: this.store[identifier].resetTime
      };
    }

    // 현재 윈도우 내에서 요청 수 확인
    if (this.store[identifier].count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.store[identifier].resetTime
      };
    }

    // 요청 수 증가
    this.store[identifier].count++;
    
    return {
      allowed: true,
      remaining: maxRequests - this.store[identifier].count,
      resetTime: this.store[identifier].resetTime
    };
  }

  // 미들웨어 함수 생성
  middleware() {
    return (request: NextRequest): NextResponse | null => {
      const identifier = getClientIP(request);
      const result = this.isAllowed(identifier);

      if (!result.allowed) {
        return new NextResponse(
          JSON.stringify({
            error: this.config.message,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': this.config.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
            }
          }
        );
      }

      // 성공한 경우 헤더 추가
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

      return null; // 계속 진행
    };
  }
}

// 사전 정의된 레이트 리미터들
export const rateLimiters = {
  // 일반 API 요청
  general: new RateLimiter({
    windowMs: 60 * 1000, // 1분
    maxRequests: 100
  }),

  // 게시글 작성
  postCreation: new RateLimiter({
    windowMs: 60 * 1000, // 1분
    maxRequests: 10,
    message: 'Too many post creation attempts, please try again later.'
  }),

  // 로그인 시도
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15분
    maxRequests: 5,
    message: 'Too many login attempts, please try again later.'
  }),

  // 회원가입
  registration: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1시간
    maxRequests: 3,
    message: 'Too many registration attempts, please try again later.'
  }),

  // 댓글 작성
  comment: new RateLimiter({
    windowMs: 60 * 1000, // 1분
    maxRequests: 20,
    message: 'Too many comment attempts, please try again later.'
  })
};

// 특정 경로에 대한 레이트 리미터 매핑
export function getRateLimiterForPath(pathname: string): RateLimiter | null {
  // API 경로별 레이트 리미터 매핑
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
    return rateLimiters.auth;
  }
  
  if (pathname.startsWith('/api/auth/register')) {
    return rateLimiters.registration;
  }
  
  if (pathname === '/api/community' && pathname.includes('POST')) {
    return rateLimiters.postCreation;
  }
  
  if (pathname.includes('/comments') && pathname.includes('POST')) {
    return rateLimiters.comment;
  }
  
  // 기본적으로 일반 레이트 리미터 적용
  return rateLimiters.general;
}

// 정리 함수 (메모리 누수 방지)
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  Object.keys(store).forEach(key => {
    if (now > store[key].resetTime) {
      delete store[key];
    }
  });
}

// 주기적으로 만료된 항목 정리 (5분마다)
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
