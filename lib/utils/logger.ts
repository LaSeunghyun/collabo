/**
 * 구조화된 로깅 시스템
 * 에러 발생 시 컨텍스트 정보를 포함한 로그를 생성합니다.
 */

export interface LogContext {
    userId?: string;
    projectId?: string;
    sessionId?: string;
    requestId?: string;
    operation?: string;
    [key: string]: unknown;
}

export interface ErrorLogContext extends LogContext {
    error: {
        name: string;
        message: string;
        stack?: string;
    };
    input?: unknown;
    metadata?: Record<string, unknown>;
}

export class Logger {
    private static generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private static formatLog(level: string, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString();
        const requestId = context?.requestId || this.generateRequestId();

        return JSON.stringify({
            timestamp,
            level,
            message,
            requestId,
            ...context,
        });
    }

    static info(message: string, context?: LogContext): void {
        console.log(this.formatLog('INFO', message, context));
    }

    static warn(message: string, context?: LogContext): void {
        console.warn(this.formatLog('WARN', message, context));
    }

    static error(message: string, context?: ErrorLogContext): void {
        console.error(this.formatLog('ERROR', message, context));
    }

    static debug(message: string, context?: LogContext): void {
        if (process.env.NODE_ENV === 'development') {
            console.debug(this.formatLog('DEBUG', message, context));
        }
    }

    /**
     * API 요청 시작 로그
     */
    static apiRequest(method: string, path: string, context?: LogContext): void {
        this.info(`API Request: ${method} ${path}`, {
            ...context,
            operation: 'api_request',
        });
    }

    /**
     * API 요청 완료 로그
     */
    static apiResponse(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
        this.info(`API Response: ${method} ${path} - ${statusCode} (${duration}ms)`, {
            ...context,
            operation: 'api_response',
            statusCode,
            duration,
        });
    }

    /**
     * 데이터베이스 작업 로그
     */
    static dbOperation(operation: string, table: string, context?: LogContext): void {
        this.debug(`DB Operation: ${operation} on ${table}`, {
            ...context,
            operation: 'db_operation',
            table,
        });
    }

    /**
     * 비즈니스 로직 실행 로그
     */
    static businessLogic(operation: string, context?: LogContext): void {
        this.info(`Business Logic: ${operation}`, {
            ...context,
            operation: 'business_logic',
        });
    }

    /**
     * 에러 발생 로그 (구조화된 형태)
     */
    static errorOccurred(error: Error, operation: string, context?: LogContext): void {
        this.error(`Error in ${operation}`, {
            ...context,
            operation,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
        });
    }

    /**
     * 인증 관련 로그
     */
    static authEvent(event: string, context?: LogContext): void {
        this.info(`Auth Event: ${event}`, {
            ...context,
            operation: 'auth_event',
        });
    }

    /**
     * 결제/정산 관련 로그
     */
    static paymentEvent(event: string, context?: LogContext): void {
        this.info(`Payment Event: ${event}`, {
            ...context,
            operation: 'payment_event',
        });
    }
}

/**
 * 에러 핸들링 헬퍼 함수들
 */
export const createErrorContext = (
    operation: string,
    additionalContext?: LogContext
): LogContext => ({
    operation,
    timestamp: new Date().toISOString(),
    ...additionalContext,
});

export const logError = (error: Error, operation: string, context?: LogContext): void => {
    Logger.errorOccurred(error, operation, context);
};

export const logApiError = (
    error: Error,
    method: string,
    path: string,
    context?: LogContext
): void => {
    Logger.errorOccurred(error, `API ${method} ${path}`, {
        ...context,
        operation: 'api_error',
        method,
        path,
    });
};
