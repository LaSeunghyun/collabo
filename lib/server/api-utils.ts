import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

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
    search: searchParams.get('search') || undefined
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
    pages: Math.ceil(total / limit)
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

/**
 * 공통 검증 함수들
 */
export const validators = {
  required: (value: any, fieldName: string) => {
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      throw new Error(`${fieldName}은(는) 필수입니다.`);
    }
  },
  
  minLength: (value: string, min: number, fieldName: string) => {
    if (value.length < min) {
      throw new Error(`${fieldName}은(는) ${min}자 이상이어야 합니다.`);
    }
  },
  
  maxLength: (value: string, max: number, fieldName: string) => {
    if (value.length > max) {
      throw new Error(`${fieldName}은(는) ${max}자 이하여야 합니다.`);
    }
  },
  
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('유효한 이메일 주소를 입력해주세요.');
    }
  },
  
  positiveNumber: (value: number, fieldName: string) => {
    if (value <= 0) {
      throw new Error(`${fieldName}은(는) 양수여야 합니다.`);
    }
  }
};

/**
 * 공통 응답 생성기
 */
export const responses = {
  success: <T>(data: T, message?: string) => ({
    success: true,
    data,
    message
  }),
  
  error: (message: string, statusCode: number = 400) => ({
    success: false,
    message,
    statusCode
  }),
  
  notFound: (resource: string = '리소스') => ({
    success: false,
    message: `${resource}을(를) 찾을 수 없습니다.`,
    statusCode: 404
  }),
  
  unauthorized: () => ({
    success: false,
    message: '인증이 필요합니다.',
    statusCode: 401
  }),
  
  forbidden: () => ({
    success: false,
    message: '접근 권한이 없습니다.',
    statusCode: 403
  })
};
