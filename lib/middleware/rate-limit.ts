import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // ?�간 ?�도??(밀리초)
  maxRequests: number; // 최�? ?�청 ??
  message?: string; // ?�한 초과 ??메시지
  skipSuccessfulRequests?: boolean; // ?�공???�청??카운?�할지 ?��?
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// 메모�?기반 ?�?�소 (?�로?�션?�서??Redis ?�용 권장)
const store: RateLimitStore = {};

// 기본 ?�정
const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1�?
  maxRequests: 100, // 최�? 100 ?�청
  message: 'Too many requests, please try again later.',
  skipSuccessfulRequests: false
};

// IP 주소 추출 ?�수
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

// ?�이??리�????�래??
export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.store = store;
  }

  // ?�청 ?�한 ?�인
  isAllowed(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowMs = this.config.windowMs;
    const maxRequests = this.config.maxRequests;

    // 기존 기록???�거???�도?��? 만료??경우
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

    // ?�재 ?�도???�에???�청 ???�인
    if (this.store[identifier].count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.store[identifier].resetTime
      };
    }

    // ?�청 ??증�?
    this.store[identifier].count++;
    
    return {
      allowed: true,
      remaining: maxRequests - this.store[identifier].count,
      resetTime: this.store[identifier].resetTime
    };
  }

  // 미들?�어 ?�수 ?�성
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

      // ?�공??경우 ?�더 추�?
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

      return null; // 계속 진행
    };
  }
}

// ?�전 ?�의???�이??리�??�들
export const rateLimiters = {
  // ?�반 API ?�청
  general: new RateLimiter({
    windowMs: 60 * 1000, // 1�?
    maxRequests: 100
  }),

  // 게시글 ?�성
  postCreation: new RateLimiter({
    windowMs: 60 * 1000, // 1�?
    maxRequests: 10,
    message: 'Too many post creation attempts, please try again later.'
  }),

  // 로그???�도
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15�?
    maxRequests: 5,
    message: 'Too many login attempts, please try again later.'
  }),

  // ?�원가??
  registration: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1?�간
    maxRequests: 3,
    message: 'Too many registration attempts, please try again later.'
  }),

  // ?��? ?�성
  comment: new RateLimiter({
    windowMs: 60 * 1000, // 1�?
    maxRequests: 20,
    message: 'Too many comment attempts, please try again later.'
  })
};

// ?�정 경로???�???�이??리�???매핑
export function getRateLimiterForPath(pathname: string): RateLimiter | null {
  // API 경로�??�이??리�???매핑
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
  
  // 기본?�으�??�반 ?�이??리�????�용
  return rateLimiters.general;
}

// ?�리 ?�수 (메모�??�수 방�?)
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  Object.keys(store).forEach(key => {
    if (now > store[key].resetTime) {
      delete store[key];
    }
  });
}

// 주기?�으�?만료????�� ?�리 (5분마??
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
