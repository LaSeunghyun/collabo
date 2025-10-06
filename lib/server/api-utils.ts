import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/drizzle';

import { ApiResponse } from './api-responses';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * API ?¸ë“¤???˜í¼ - ê³µí†µ ?ëŸ¬ ì²˜ë¦¬ ë°??¸ì¦
 */
export async function withAuth<T>(
  handler: (user: any, request: NextRequest, params?: any) => Promise<ApiResponse<T>>,
  request: NextRequest,
  params?: any
): Promise<NextResponse> {
  try {
    const user = await requireApiUser({}, { headers: request.headers });
    const result = await handler(user, request, params);

    if (result.success) {
      return NextResponse.json(result.data, { status: 200 });
    } else {
      return NextResponse.json(
        { message: result.message || '?”ì²­ ì²˜ë¦¬???¤íŒ¨?ˆìŠµ?ˆë‹¤.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('API ?ëŸ¬:', error);
    return NextResponse.json(
      { message: '?œë²„ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.' },
      { status: 500 }
    );
  }
}

/**
 * ?˜ì´ì§€?¤ì´???Œë¼ë¯¸í„° ?Œì‹±
 */
export function parsePaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url);

  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
    sort: searchParams.get('sort') || 'createdAt',
    search: searchParams.get('search') || undefined,
  };
}

/**
 * ?˜ì´ì§€?¤ì´??ê²°ê³¼ ?ì„±
 */
export function createPaginationResult(
  page: number,
  limit: number,
  total: number
): PaginationResult {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
}

/**
 * ?°ì´?°ë² ?´ìŠ¤ ?¸ëœ??…˜ ?˜í¼
 */
export async function withTransaction<T>(
  operation: (tx: any) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(operation);
}
