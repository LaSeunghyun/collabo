# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **데이터베이스 스키마 체계화**
  - PostStatus enum 추가 (DRAFT, PUBLISHED, ARCHIVED)
  - Post 테이블에 status 필드 추가
  - Announcement 테이블 마이그레이션 적용
  - 마이그레이션 파일 명명 규칙 표준화

- **타입 안전성 강화**
  - `types/database.ts`에 모든 테이블 타입 정의
  - Drizzle 스키마에서 자동 타입 추출
  - 쿼리 빌더 래퍼 함수 (`lib/db/queries/`)
  - 엄격한 TypeScript 타입 체크

- **서버/클라이언트 아키텍처 명확화**
  - 서버 전용 코드: `lib/server/`, `lib/db/queries/`
  - 클라이언트 전용 코드: `lib/api/`
  - 공유 타입: `types/database.ts`
  - Store API 서버/클라이언트 분리

- **테스트 및 검증 자동화**
  - 스모크 테스트 (`tests/smoke/database.test.ts`)
  - 마이그레이션 검증 스크립트 (`scripts/verify-migrations.mjs`)
  - CI/CD 파이프라인에 DB 체크 추가
  - 스키마 드리프트 감지

- **개발자 도구 및 문서**
  - 데이터베이스 스키마 변경 가이드
  - PR 체크리스트 및 DoD 정의
  - 마이그레이션 검증 명령어 추가
  - 정기 건강 검진 프로세스

### Fixed
- Announcement 테이블 누락 오류 해결
- Post status 필드 누락으로 인한 쿼리 오류 해결
- Store API 상대 URL 문제 해결
- 마이그레이션 파일 중복 번호 문제 해결

### Changed
- `lib/server/community.ts`: 쿼리 빌더 래퍼 함수 사용
- `lib/server/announcements.ts`: 쿼리 빌더 래퍼 함수 사용
- `app/page.tsx`: 서버 사이드 Store 로직 사용
- 마이그레이션 파일명을 설명적으로 변경

### Added
- **구조화된 로깅 시스템** (`lib/utils/logger.ts`)
  - 컨텍스트 정보를 포함한 에러 로깅
  - API 요청/응답 로깅
  - 인증 이벤트 로깅
  - 비즈니스 로직 실행 로깅

- **메모리 캐싱 시스템** (`lib/utils/cache.ts`)
  - 자주 조회되는 데이터의 메모리 캐싱
  - TTL(Time To Live) 기반 캐시 만료
  - 캐시 무효화 기능
  - 캐시 통계 및 모니터링

- **타입 안정성 개선**
  - `any` 타입을 구체적인 타입으로 교체
  - 인터페이스 정의 추가
  - 타입 가드 함수 개선

### Changed
- **Drizzle ORM 마이그레이션**
  - Prisma에서 Drizzle로 완전 전환
  - 새로운 스키마 구조 적용
  - 쿼리 최적화

- **인증 시스템 개선**
  - 세션 기반 인증으로 전환
  - 권한 관리 시스템 강화
  - 토큰 기반 인증 지원

- **성능 최적화**
  - 프로젝트 조회에 캐싱 적용
  - N+1 쿼리 문제 해결
  - Promise.all을 활용한 병렬 처리

### Fixed
- **에러 처리 개선**
  - 구조화된 에러 로깅
  - API 에러 컨텍스트 정보 추가
  - 에러 추적성 향상

- **타입 안정성**
  - `any` 타입 사용 최소화
  - 명시적 타입 정의 추가
  - 타입 안전성 향상

### Documentation
- **비즈니스 로직 문서화**
  - 정산 계산 로직 상세 주석
  - 펀딩 처리 과정 문서화
  - API 함수 JSDoc 추가

- **README 업데이트**
  - 새로운 기능 설명 추가
  - 아키텍처 변경사항 반영
  - 개발 가이드 업데이트

## [Previous Versions]

### [1.0.0] - 2024-01-XX
- 초기 릴리스
- 기본 프로젝트 구조
- Prisma ORM 사용
- NextAuth 인증
- 기본 UI 컴포넌트

---

## Migration Guide

### Drizzle ORM 마이그레이션
기존 Prisma 코드를 Drizzle로 마이그레이션할 때:

```typescript
// Before (Prisma)
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { projects: true }
});

// After (Drizzle)
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { projects: true }
});
```

### 새로운 로깅 시스템 사용
기존 console.log를 구조화된 로깅으로 변경:

```typescript
// Before
console.error('Error occurred:', error);

// After
Logger.errorOccurred(error, 'operation_name', { userId, context });
```

### 캐싱 적용
자주 조회되는 데이터에 캐싱 적용:

```typescript
// Before
const data = await fetchData();

// After
const data = await withCache(
  CACHE_KEYS.DATA(id),
  () => fetchData(),
  CACHE_TTL.MEDIUM
);
```
