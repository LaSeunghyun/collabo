/**
 * NextAuth 환경 변수 검증 유틸리티
 * 
 * JWT 복호화 오류를 방지하기 위해 필수 환경 변수들을 검증합니다.
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * NextAuth 관련 환경 변수들을 검증합니다.
 */
export function validateAuthEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // NEXTAUTH_SECRET 검증
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const authJwtSecret = process.env.AUTH_JWT_SECRET;
  const hasAnySecret = nextAuthSecret || authJwtSecret;

  if (!hasAnySecret) {
    errors.push(
      'NEXTAUTH_SECRET 또는 AUTH_JWT_SECRET 환경 변수가 설정되지 않았습니다. ' +
      'JWT 토큰 복호화가 실패할 수 있습니다. ' +
      '자세한 설정 방법은 docs/vercel-env-setup.md를 참조하세요.'
    );
  } else {
    // 사용 중인 시크릿 검증
    const activeSecret = authJwtSecret || nextAuthSecret!;
    
    if (activeSecret.length < 32) {
      warnings.push(
        `JWT 시크릿이 너무 짧습니다 (${activeSecret.length}자). ` +
        '보안을 위해 최소 32자 이상을 권장합니다. ' +
        '새로운 시크릿 생성: openssl rand -base64 32'
      );
    }

    // Base64 형식 검증 (선택적)
    if (activeSecret.length >= 32) {
      try {
        // Base64 디코딩 시도
        Buffer.from(activeSecret, 'base64');
      } catch {
        warnings.push(
          'JWT 시크릿이 Base64 형식이 아닐 수 있습니다. ' +
          'openssl rand -base64 32로 생성된 시크릿을 사용하는 것을 권장합니다.'
        );
      }
    }
  }

  // NEXTAUTH_URL 검증 (선택적)
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (!nextAuthUrl) {
    warnings.push(
      'NEXTAUTH_URL이 설정되지 않았습니다. ' +
      'Vercel에서는 자동 감지되지만, 명시적 설정을 권장합니다.'
    );
  } else if (nextAuthUrl === 'http://localhost:3000' && process.env.NODE_ENV === 'production') {
    errors.push(
      '프로덕션 환경에서 localhost URL을 사용하고 있습니다. ' +
      '올바른 프로덕션 도메인으로 설정하세요.'
    );
  }

  // 환경별 검증 수준 조정
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';

  if (isProduction && isVercel) {
    // Vercel 프로덕션에서는 더 엄격한 검증
    if (warnings.length > 0) {
      console.warn('⚠️ [AUTH-ENV] 프로덕션 환경에서 경고가 발견되었습니다:', warnings);
    }
  }

  const result: ValidationResult = {
    isValid: errors.length === 0,
    errors,
    warnings
  };

  // 결과 출력
  if (errors.length > 0) {
    console.error('❌ [AUTH-ENV] 환경 변수 검증 실패:');
    errors.forEach(error => console.error(`   - ${error}`));
  }

  if (warnings.length > 0) {
    console.warn('⚠️ [AUTH-ENV] 환경 변수 경고:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  if (result.isValid && warnings.length === 0) {
    console.log('✅ [AUTH-ENV] 환경 변수 검증 완료');
  }

  return result;
}

/**
 * 개발 환경에서만 실행되는 경량 검증
 */
export function validateAuthEnvDev(): void {
  if (process.env.NODE_ENV === 'development') {
    validateAuthEnv();
  }
}

/**
 * 프로덕션 환경에서만 실행되는 엄격한 검증
 */
export function validateAuthEnvProd(): void {
  if (process.env.NODE_ENV === 'production') {
    const result = validateAuthEnv();
    if (!result.isValid) {
      throw new Error(
        '프로덕션 환경에서 필수 환경 변수가 누락되었습니다. ' +
        '자세한 내용은 위의 에러 메시지를 확인하세요.'
      );
    }
  }
}
