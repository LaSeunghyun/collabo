/**
 * API 응답을 위한 공통 타입
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * 표준화된 API 응답을 생성하는 팩토리 함수 모음
 */
export const responses = {
  /**
   * 성공 응답을 생성합니다.
   * @param data 전송할 데이터
   * @param message 선택적 성공 메시지
   */
  success: <T>(data: T, message?: string): ApiResponse<T> => ({
    success: true,
    data,
    message,
  }),

  /**
   * 일반적인 에러 응답을 생성합니다.
   * @param message 에러 메시지
   * @param statusCode HTTP 상태 코드 (기본값: 400)
   */
  error: (message: string, statusCode: number = 400): ApiResponse<never> => ({
    success: false,
    message,
    statusCode,
  }),

  /**
   * "찾을 수 없음" (404) 에러 응답을 생성합니다.
   * @param resource 찾을 수 없는 리소스의 이름 (기본값: '리소스')
   */
  notFound: (resource: string = '리소스'): ApiResponse<never> => ({
    success: false,
    message: `${resource}을(를) 찾을 수 없습니다.`,
    statusCode: 404,
  }),

  /**
   * "인증 필요" (401) 에러 응답을 생성합니다.
   */
  unauthorized: (): ApiResponse<never> => ({
    success: false,
    message: '인증이 필요합니다.',
    statusCode: 401,
  }),

  /**
   * "접근 금지" (403) 에러 응답을 생성합니다.
   */
  forbidden: (): ApiResponse<never> => ({
    success: false,
    message: '접근 권한이 없습니다.',
    statusCode: 403,
  }),
};
