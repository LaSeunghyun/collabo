import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                return buildApiError('?곗씠??以묐났 ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.', 409, 'DUPLICATE_ENTRY');
            case 'P2025':
                return buildApiError('?붿껌???곗씠?곕? 李얠쓣 ???놁뒿?덈떎.', 404, 'NOT_FOUND');
            case 'P2003':
                return buildApiError('李몄“ 臾닿껐???ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.', 400, 'FOREIGN_KEY_CONSTRAINT');
            default:
                return buildApiError('?곗씠?곕쿋?댁뒪 ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.', 500, 'DATABASE_ERROR');
        }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        return buildApiError('?곗씠??寃利??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.', 400, 'VALIDATION_ERROR');
    }

    if (error instanceof Error) {
        console.error('Unexpected error:', error);
        return buildApiError('?쒕쾭 ?대? ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.', 500, 'INTERNAL_ERROR');
    }

    return buildApiError('?????녿뒗 ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.', 500, 'UNKNOWN_ERROR');
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
