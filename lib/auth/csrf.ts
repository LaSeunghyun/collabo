import { randomBytes, createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'default-csrf-secret';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = '__Host-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

// CSRF ?�큰 ?�성
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

// CSRF ?�큰 ?�시 ?�성
export function generateCSRFHash(token: string): string {
  return createHmac('sha256', CSRF_SECRET)
    .update(token)
    .digest('hex');
}

// CSRF ?�큰 검�?
export function verifyCSRFToken(token: string, hash: string): boolean {
  const expectedHash = generateCSRFHash(token);
  return hash === expectedHash;
}

// CSRF ?�큰??쿠키???�정?�는 ?�답 ?�성
export function setCSRFCookie(response: NextResponse, token: string): NextResponse {
  const hash = generateCSRFHash(token);
  
  response.cookies.set(CSRF_COOKIE_NAME, `${token}.${hash}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 24?�간
  });
  
  return response;
}

// ?�청?�서 CSRF ?�큰 추출
export function extractCSRFToken(request: NextRequest): { token: string; hash: string } | null {
  // 1. ?�더?�서 ?�큰 ?�인
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken) {
    const [token, hash] = headerToken.split('.');
    if (token && hash) {
      return { token, hash };
    }
  }
  
  // 2. 쿠키?�서 ?�큰 ?�인
  const cookieToken = request.cookies?.get?.(CSRF_COOKIE_NAME)?.value;
  if (cookieToken) {
    const [token, hash] = cookieToken.split('.');
    if (token && hash) {
      return { token, hash };
    }
  }
  
  return null;
}

// CSRF ?�큰 검�?미들?�어
export function validateCSRFToken(request: NextRequest): { valid: boolean; error?: string } {
  // GET, HEAD, OPTIONS ?�청?� CSRF 검�??�외
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true };
  }
  
  // API 경로 �?CSRF 검증이 ?�요??경로??
  const protectedPaths = [
    '/api/community',
    '/api/projects',
    '/api/partners',
    '/api/funding',
    '/api/settlement',
    '/api/payments',
    '/api/orders',
    '/api/wallet',
    '/api/announcements',
    '/api/permissions',
    '/api/users',
    '/api/artists'
  ];
  
  const pathname = request.nextUrl?.pathname || new URL(request.url).pathname;
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path) && pathname !== path // ?�확???�치?��? ?�는 ?�위 경로
  );
  
  if (!isProtectedPath) {
    return { valid: true };
  }
  
  // CSRF ?�큰 추출 �?검�?
  const csrfData = extractCSRFToken(request);
  if (!csrfData) {
    return { 
      valid: false, 
      error: 'CSRF token is required for this request' 
    };
  }
  
  const { token, hash } = csrfData;
  if (!verifyCSRFToken(token, hash)) {
    return { 
      valid: false, 
      error: 'Invalid CSRF token' 
    };
  }
  
  return { valid: true };
}

// CSRF ?�큰??반환?�는 API ?�드?�인??
export function getCSRFToken(request: NextRequest): NextResponse {
  const token = generateCSRFToken();
  const response = NextResponse.json({ 
    csrfToken: token,
    headerName: CSRF_HEADER_NAME
  });
  
  return setCSRFCookie(response, token);
}

// CSRF 검증이 ?�요??API ?�우?�에 ?�용?????�는 ?�퍼
export function withCSRFProtection(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validation = validateCSRFToken(request);
    
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'CSRF validation failed',
          details: validation.error 
        },
        { status: 403 }
      );
    }
    
    return handler(request);
  };
}

// ?�라?�언?�에???�용?????�는 CSRF ?�큰 가?�오�??�수
export async function fetchCSRFToken(): Promise<{ csrfToken: string; headerName: string }> {
  const response = await fetch('/api/csrf-token', {
    method: 'GET',
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token');
  }
  
  return response.json();
}

// ?�라?�언?�에??API ?�청 ??CSRF ?�큰???�더??추�??�는 ?�퍼
export async function withCSRFHeader(requestInit: RequestInit = {}): Promise<RequestInit> {
  try {
    const { csrfToken, headerName } = await fetchCSRFToken();
    
    return {
      ...requestInit,
      headers: {
        ...requestInit.headers,
        [headerName]: csrfToken
      }
    };
  } catch (error) {
    console.warn('Failed to add CSRF token to request:', error);
    return requestInit;
  }
}
