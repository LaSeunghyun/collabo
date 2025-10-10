import { randomBytes, createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'default-csrf-secret';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = '__Host-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

// CSRF ? í° ?ì„±
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

// CSRF ? í° ?´ì‹œ ?ì„±
export function generateCSRFHash(token: string): string {
  return createHmac('sha256', CSRF_SECRET)
    .update(token)
    .digest('hex');
}

// CSRF ? í° ê²€ì¦?
export function verifyCSRFToken(token: string, hash: string): boolean {
  const expectedHash = generateCSRFHash(token);
  return hash === expectedHash;
}

// CSRF ? í°??ì¿ í‚¤???¤ì •?˜ëŠ” ?‘ë‹µ ?ì„±
export function setCSRFCookie(response: NextResponse, token: string): NextResponse {
  const hash = generateCSRFHash(token);
  
  response.cookies.set(CSRF_COOKIE_NAME, `${token}.${hash}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 24?œê°„
  });
  
  return response;
}

// ?”ì²­?ì„œ CSRF ? í° ì¶”ì¶œ
export function extractCSRFToken(request: NextRequest): { token: string; hash: string } | null {
  // 1. ?¤ë”?ì„œ ? í° ?•ì¸
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken) {
    const [token, hash] = headerToken.split('.');
    if (token && hash) {
      return { token, hash };
    }
  }
  
  // 2. ì¿ í‚¤?ì„œ ? í° ?•ì¸
  const cookieToken = request.cookies?.get?.(CSRF_COOKIE_NAME)?.value;
  if (cookieToken) {
    const [token, hash] = cookieToken.split('.');
    if (token && hash) {
      return { token, hash };
    }
  }
  
  return null;
}

// CSRF ? í° ê²€ì¦?ë¯¸ë“¤?¨ì–´
export function validateCSRFToken(request: NextRequest): { valid: boolean; error?: string } {
  // GET, HEAD, OPTIONS ?”ì²­?€ CSRF ê²€ì¦??œì™¸
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true };
  }
  
  // API ê²½ë¡œ ì¤?CSRF ê²€ì¦ì´ ?„ìš”??ê²½ë¡œ??
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
    pathname.startsWith(path) && pathname !== path // ?•í™•???¼ì¹˜?˜ì? ?ŠëŠ” ?˜ìœ„ ê²½ë¡œ
  );
  
  if (!isProtectedPath) {
    return { valid: true };
  }
  
  // CSRF ? í° ì¶”ì¶œ ë°?ê²€ì¦?
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

// CSRF ? í°??ë°˜í™˜?˜ëŠ” API ?”ë“œ?¬ì¸??
export function getCSRFToken(request: NextRequest): NextResponse {
  const token = generateCSRFToken();
  const response = NextResponse.json({ 
    csrfToken: token,
    headerName: CSRF_HEADER_NAME
  });
  
  return setCSRFCookie(response, token);
}

// CSRF ê²€ì¦ì´ ?„ìš”??API ?¼ìš°?¸ì— ?ìš©?????ˆëŠ” ?¬í¼
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

// ?´ë¼?´ì–¸?¸ì—???¬ìš©?????ˆëŠ” CSRF ? í° ê°€?¸ì˜¤ê¸??¨ìˆ˜
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

// ?´ë¼?´ì–¸?¸ì—??API ?”ì²­ ??CSRF ? í°???¤ë”??ì¶”ê??˜ëŠ” ?¬í¼
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
