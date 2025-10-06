import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

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
 * API 핸들러 래퍼 - 공통 에러 처리 및 인증
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
        { message: result.message || '요청 처리에 실패했습니다.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 페이지네이션 파라미터 파싱
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
 * 페이지네이션 결과 생성
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
 * 데이터베이스 트랜잭션 래퍼
 */
export async function withTransaction<T>(
  operation: (tx: any) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(operation);
}
