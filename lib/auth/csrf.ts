import { randomBytes, createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'default-csrf-secret';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = '__Host-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

// CSRF 토큰 생성
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

// CSRF 토큰 해시 생성
export function generateCSRFHash(token: string): string {
  return createHmac('sha256', CSRF_SECRET)
    .update(token)
    .digest('hex');
}

// CSRF 토큰 검증
export function verifyCSRFToken(token: string, hash: string): boolean {
  const expectedHash = generateCSRFHash(token);
  return hash === expectedHash;
}

// CSRF 토큰을 쿠키에 설정하는 응답 생성
export function setCSRFCookie(response: NextResponse, token: string): NextResponse {
  const hash = generateCSRFHash(token);
  
  response.cookies.set(CSRF_COOKIE_NAME, `${token}.${hash}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 24시간
  });
  
  return response;
}

// 요청에서 CSRF 토큰 추출
export function extractCSRFToken(request: NextRequest): { token: string; hash: string } | null {
  // 1. 헤더에서 토큰 확인
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken) {
    const [token, hash] = headerToken.split('.');
    if (token && hash) {
      return { token, hash };
    }
  }
  
  // 2. 쿠키에서 토큰 확인
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (cookieToken) {
    const [token, hash] = cookieToken.split('.');
    if (token && hash) {
      return { token, hash };
    }
  }
  
  return null;
}

// CSRF 토큰 검증 미들웨어
export function validateCSRFToken(request: NextRequest): { valid: boolean; error?: string } {
  // GET, HEAD, OPTIONS 요청은 CSRF 검증 제외
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true };
  }
  
  // API 경로 중 CSRF 검증이 필요한 경로들
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
  
  const pathname = request.nextUrl.pathname;
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path) && pathname !== path // 정확히 일치하지 않는 하위 경로
  );
  
  if (!isProtectedPath) {
    return { valid: true };
  }
  
  // CSRF 토큰 추출 및 검증
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

// CSRF 토큰을 반환하는 API 엔드포인트
export function getCSRFToken(request: NextRequest): NextResponse {
  const token = generateCSRFToken();
  const response = NextResponse.json({ 
    csrfToken: token,
    headerName: CSRF_HEADER_NAME
  });
  
  return setCSRFCookie(response, token);
}

// CSRF 검증이 필요한 API 라우트에 적용할 수 있는 헬퍼
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

// 클라이언트에서 사용할 수 있는 CSRF 토큰 가져오기 함수
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

// 클라이언트에서 API 요청 시 CSRF 토큰을 헤더에 추가하는 헬퍼
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
