import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // ?œê°„ ?ˆë„??(ë°€ë¦¬ì´ˆ)
  maxRequests: number; // ìµœë? ?”ì²­ ??
  message?: string; // ?œí•œ ì´ˆê³¼ ??ë©”ì‹œì§€
  skipSuccessfulRequests?: boolean; // ?±ê³µ???”ì²­??ì¹´ìš´?¸í• ì§€ ?¬ë?
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// ë©”ëª¨ë¦?ê¸°ë°˜ ?€?¥ì†Œ (?„ë¡œ?•ì…˜?ì„œ??Redis ?¬ìš© ê¶Œì¥)
const store: RateLimitStore = {};

// ê¸°ë³¸ ?¤ì •
const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1ë¶?
  maxRequests: 100, // ìµœë? 100 ?”ì²­
  message: 'Too many requests, please try again later.',
  skipSuccessfulRequests: false
};

// IP ì£¼ì†Œ ì¶”ì¶œ ?¨ìˆ˜
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

// ?ˆì´??ë¦¬ë????´ë˜??
export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.store = store;
  }

  // ?”ì²­ ?œí•œ ?•ì¸
  isAllowed(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowMs = this.config.windowMs;
    const maxRequests = this.config.maxRequests;

    // ê¸°ì¡´ ê¸°ë¡???†ê±°???ˆë„?°ê? ë§Œë£Œ??ê²½ìš°
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

    // ?„ì¬ ?ˆë„???´ì—???”ì²­ ???•ì¸
    if (this.store[identifier].count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.store[identifier].resetTime
      };
    }

    // ?”ì²­ ??ì¦ê?
    this.store[identifier].count++;
    
    return {
      allowed: true,
      remaining: maxRequests - this.store[identifier].count,
      resetTime: this.store[identifier].resetTime
    };
  }

  // ë¯¸ë“¤?¨ì–´ ?¨ìˆ˜ ?ì„±
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

      // ?±ê³µ??ê²½ìš° ?¤ë” ì¶”ê?
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

      return null; // ê³„ì† ì§„í–‰
    };
  }
}

// ?¬ì „ ?•ì˜???ˆì´??ë¦¬ë??°ë“¤
export const rateLimiters = {
  // ?¼ë°˜ API ?”ì²­
  general: new RateLimiter({
    windowMs: 60 * 1000, // 1ë¶?
    maxRequests: 100
  }),

  // ê²Œì‹œê¸€ ?‘ì„±
  postCreation: new RateLimiter({
    windowMs: 60 * 1000, // 1ë¶?
    maxRequests: 10,
    message: 'Too many post creation attempts, please try again later.'
  }),

  // ë¡œê·¸???œë„
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15ë¶?
    maxRequests: 5,
    message: 'Too many login attempts, please try again later.'
  }),

  // ?Œì›ê°€??
  registration: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1?œê°„
    maxRequests: 3,
    message: 'Too many registration attempts, please try again later.'
  }),

  // ?“ê? ?‘ì„±
  comment: new RateLimiter({
    windowMs: 60 * 1000, // 1ë¶?
    maxRequests: 20,
    message: 'Too many comment attempts, please try again later.'
  })
};

// ?¹ì • ê²½ë¡œ???€???ˆì´??ë¦¬ë???ë§¤í•‘
export function getRateLimiterForPath(pathname: string): RateLimiter | null {
  // API ê²½ë¡œë³??ˆì´??ë¦¬ë???ë§¤í•‘
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
  
  // ê¸°ë³¸?ìœ¼ë¡??¼ë°˜ ?ˆì´??ë¦¬ë????ìš©
  return rateLimiters.general;
}

// ?•ë¦¬ ?¨ìˆ˜ (ë©”ëª¨ë¦??„ìˆ˜ ë°©ì?)
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  Object.keys(store).forEach(key => {
    if (now > store[key].resetTime) {
      delete store[key];
    }
  });
}

// ì£¼ê¸°?ìœ¼ë¡?ë§Œë£Œ????ª© ?•ë¦¬ (5ë¶„ë§ˆ??
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
