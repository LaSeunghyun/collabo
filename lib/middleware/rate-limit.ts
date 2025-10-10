import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests
  message?: string; // Rate limit exceeded message
  skipSuccessfulRequests?: boolean; // Whether to count successful requests
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Memory-based store (Redis recommended for production)
const store: RateLimitStore = {};

// Default configuration
const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // Maximum 100 requests
  message: 'Too many requests, please try again later.',
  skipSuccessfulRequests: false
};

// IP address extraction function
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

// Rate limiter class
export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.store = store;
  }

  // Check request rate limit
  isAllowed(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowMs = this.config.windowMs;
    const maxRequests = this.config.maxRequests;

    // If no existing record or window has expired
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

    // Check if current window has exceeded request limit
    if (this.store[identifier].count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.store[identifier].resetTime
      };
    }

    // Increment request count
    this.store[identifier].count++;
    
    return {
      allowed: true,
      remaining: maxRequests - this.store[identifier].count,
      resetTime: this.store[identifier].resetTime
    };
  }

  // Create middleware function
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

      // Add headers for successful requests
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

      return null; // Continue processing
    };
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // General API requests
  general: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  }),

  // Post creation
  postCreation: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many post creation attempts, please try again later.'
  }),

  // Login attempts
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts, please try again later.'
  }),

  // Registration
  registration: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many registration attempts, please try again later.'
  }),

  // Comment creation
  comment: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Too many comment attempts, please try again later.'
  })
};

// Map specific paths to rate limiters
export function getRateLimiterForPath(pathname: string): RateLimiter | null {
  // Map API paths to rate limiters
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
  
  // Use general rate limiter by default
  return rateLimiters.general;
}

// Cleanup function (memory leak prevention)
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  Object.keys(store).forEach(key => {
    if (now > store[key].resetTime) {
      delete store[key];
    }
  });
}

// Periodically clean up expired entries (every 5 minutes)
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}