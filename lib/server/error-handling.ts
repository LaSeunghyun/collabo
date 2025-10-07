import { NextResponse } from 'next/server';
// Prisma 타입 제거됨 - Drizzle로 전환

export interface ApiError {
    message: string;
    code?: string;
    status: number;
    details?: any;
}

export class FundingSettlementError extends Error {
    public readonly code: string;
    public readonly status: number;
    public readonly details?: any;

    constructor(message: string, code: string, status: number = 500, details?: any) {
        super(message);
        this.name = 'FundingSettlementError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

export function buildApiError(message: string, status = 400, code?: string, details?: any) {
    return NextResponse.json(
        {
            error: message,
            code,
            details
        },
        { status }
    );
}

export function handleFundingSettlementError(error: unknown): NextResponse {
    if (error instanceof FundingSettlementError) {
        return buildApiError(error.message, error.status, error.code, error.details);
    }

    if (error && typeof error === 'object' && 'code' in error) {
        switch (error.code) {
            case 'P2002':
                return buildApiError('데이터 중복 오류가 발생했습니다.', 409, 'DUPLICATE_ENTRY');
            case 'P2025':
                return buildApiError('요청한 데이터를 찾을 수 없습니다.', 404, 'NOT_FOUND');
            case 'P2003':
                return buildApiError('참조 무결성 오류가 발생했습니다.', 400, 'FOREIGN_KEY_CONSTRAINT');
            default:
                return buildApiError('데이터베이스 오류가 발생했습니다.', 500, 'DATABASE_ERROR');
        }
    }

    if (error && typeof error === 'object' && 'message' in error) {
        return buildApiError('데이터 검증 오류가 발생했습니다.', 400, 'VALIDATION_ERROR');
    }

    if (error instanceof Error) {
        console.error('Unexpected error:', error);
        return buildApiError('예상치 못한 오류가 발생했습니다.', 500, 'INTERNAL_ERROR');
    }

    return buildApiError('알 수 없는 오류가 발생했습니다.', 500, 'UNKNOWN_ERROR');
}

export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    errorHandler?: (error: unknown) => NextResponse
): Promise<T | NextResponse> {
    try {
        return await operation();
    } catch (error) {
        if (errorHandler) {
            return errorHandler(error);
        }
        return handleFundingSettlementError(error);
    }
}

export function createTransactionWrapper<T extends any[], R>(
    operation: (...args: T) => Promise<R>
) {
    return async (...args: T): Promise<R | NextResponse> => {
        return withErrorHandling(async () => {
            return await operation(...args);
        });
    };
}
