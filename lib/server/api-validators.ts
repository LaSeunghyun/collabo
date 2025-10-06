/**
 * API 요청 데이터 검증을 위한 유효성 검사 함수 모음
 */
export const validators = {
  /**
   * 값이 비어있지 않은지 확인합니다.
   * @param value 검사할 값
   * @param fieldName 필드 이름 (에러 메시지에 사용)
   */
  required: (value: any, fieldName: string) => {
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      throw new Error(`${fieldName}은(는) 필수입니다.`);
    }
  },

  /**
   * 문자열의 최소 길이를 확인합니다.
   * @param value 검사할 문자열
   * @param min 최소 길이
   * @param fieldName 필드 이름
   */
  minLength: (value: string, min: number, fieldName: string) => {
    if (value.length < min) {
      throw new Error(`${fieldName}은(는) ${min}자 이상이어야 합니다.`);
    }
  },

  /**
   * 문자열의 최대 길이를 확인합니다.
   * @param value 검사할 문자열
   * @param max 최대 길이
   * @param fieldName 필드 이름
   */
  maxLength: (value: string, max: number, fieldName: string) => {
    if (value.length > max) {
      throw new Error(`${fieldName}은(는) ${max}자 이하여야 합니다.`);
    }
  },

  /**
   * 유효한 이메일 형식인지 확인합니다.
   * @param value 검사할 이메일 문자열
   */
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('유효한 이메일 주소를 입력해주세요.');
    }
  },

  /**
   * 값이 양수인지 확인합니다.
   * @param value 검사할 숫자
   * @param fieldName 필드 이름
   */
  positiveNumber: (value: number, fieldName: string) => {
    if (value <= 0) {
      throw new Error(`${fieldName}은(는) 양수여야 합니다.`);
    }
  },
};
