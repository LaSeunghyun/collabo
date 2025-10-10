import { NextResponse } from 'next/server';
// Prisma ?€???œê±° - Drizzleë¡??„í™˜

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
                return buildApiError('?°ì´??ì¤‘ë³µ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.', 409, 'DUPLICATE_ENTRY');
            case 'P2025':
                return buildApiError('?”ì²­???°ì´?°ë? ì°¾ì„ ???†ìŠµ?ˆë‹¤.', 404, 'NOT_FOUND');
            case 'P2003':
                return buildApiError('?¸ë˜ ???œì•½ ì¡°ê±´ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.', 400, 'FOREIGN_KEY_CONSTRAINT');
            default:
                return buildApiError('?°ì´?°ë² ?´ìŠ¤ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.', 500, 'DATABASE_ERROR');
        }
    }

    if (error && typeof error === 'object' && 'message' in error) {
        return buildApiError('?…ë ¥ ?°ì´??ê²€ì¦??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.', 400, 'VALIDATION_ERROR');
    }

    if (error instanceof Error) {
        console.error('Unexpected error:', error);
        return buildApiError('?ˆìƒì¹?ëª»í•œ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.', 500, 'INTERNAL_ERROR');
    }

    return buildApiError('?????†ëŠ” ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.', 500, 'UNKNOWN_ERROR');
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
