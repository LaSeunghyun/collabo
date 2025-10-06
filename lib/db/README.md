# Drizzle 데이터 계층

Phase 3 진입 이후 `lib/db`는 스키마 정의뿐만 아니라 런타임에서 바로 소비 가능한 공용 클라이언트를 제공합니다.

- `drizzle.config.ts`는 `.env.local`/`.env`의 연결 문자열을 사용해 `lib/db/schema`를 기준으로 마이그레이션을 생성합니다.
- `lib/db/schema/enums.ts`와 `tables.ts`는 Prisma 모델 1:1 매핑을 유지하며, enum/관계/인덱스 메타데이터를 TypeScript 수준에서 활용할 수 있도록 노출합니다.
- `lib/db/client.ts`는 Node 런타임에서 `pg` 풀 기반 Drizzle 클라이언트를 기본 제공하고, `DRIZZLE_DRIVER=http` 또는 `NEXT_RUNTIME=edge` 환경에서는 Neon HTTP 드라이버로 자동 전환합니다. 개발 모드에서는 SQL 로깅이 활성화되고, 서버리스 배포를 고려한 연결 문자열 정규화 로직을 공유합니다.
- `lib/db/index.ts`는 클라이언트와 스키마를 단일 진입점으로 노출해 서비스 계층이 `@/lib/db`에서 import 할 수 있게 정리했습니다.

## 런타임 통합 현황

- 헬스체크 및 데이터베이스 연결 진단 API(`app/api/health`, `app/api/test-db`)가 Drizzle 기반으로 동작하며, Prisma 의존성 없이 연결성 검증이 가능합니다.
- 액세스 토큰 블랙리스트 로직이 Drizzle upsert 패턴으로 전환되어 인증 도메인의 첫 번째 실사용 경로가 마이그레이션 되었습니다.

## 다음 단계

1. `lib/auth/session-store` 및 관련 NextAuth 어댑터 계층을 Drizzle 트랜잭션 API로 재작성합니다.
2. 프로젝트/커뮤니티/정산 등 서버 서비스 모듈에서 Prisma 의존을 제거하고, 공통 where/정렬 빌더 유틸리티를 추가합니다.
3. `drizzle/` 마이그레이션 생성 및 배포 파이프라인을 통합하고, Phase 0에서 확보한 Prisma 베이스라인과 SQL diff를 비교 검증합니다.
4. `npm run test:regression`으로 lint → unit/integration 순의 회귀 플로우를 실행해 데이터 계층 변경을 검증합니다.
