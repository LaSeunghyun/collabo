# Prisma → Drizzle Phase 3 보고서

## 개요
- Drizzle 런타임 클라이언트를 `lib/db/client.ts`로 도입해 Prisma를 호출하던 서버 코드가 공용 Drizzle 진입점을 사용할 수 있도록 했습니다.
- 헬스체크 및 데이터베이스 연결 진단 API를 Drizzle 기반으로 전환하고, 액세스 토큰 블랙리스트 upsert 로직을 이식해 인증 도메인에서 첫 실사용 경로를 확보했습니다.
- Phase 3 이후 전환 일정과 남은 리스크를 `lib/db/README.md` 및 본 문서에 정리해 팀 합류자와 리뷰어가 진행 상황을 추적할 수 있도록 했습니다.

## 세부 작업
1. **Drizzle 클라이언트 계층 도입**
   - `normalizeServerlessConnectionString` 유틸을 Prisma와 공유해 서버리스 환경에서도 pgbouncer 파라미터가 자동 적용되도록 했습니다.
   - Supabase PostgreSQL 연결을 위한 postgres-js 기반 클라이언트를 지원하며, 개발 모드에서 SQL 로깅과 커넥션 종료 훅을 제공합니다.
   - 데이터베이스 미구성 환경에서도 친절한 오류 메시지를 던지는 Disabled 스텁을 추가해 테스트 시나리오에서의 예외 처리를 단순화했습니다.
2. **초기 런타임 마이그레이션**
   - `app/api/health`, `app/api/test-db` 라우트를 Drizzle `db.execute` 기반으로 재작성하여 배포 환경의 커넥션 점검이 Prisma 독립적으로 수행됩니다.
   - `lib/auth/token-blacklist`가 Drizzle `onConflictDoUpdate`로 동작하도록 옮겨, 로그아웃 시 토큰 폐기가 새 클라이언트를 통해 성공적으로 수행됩니다.
3. **문서 & 온보딩 업데이트**
   - `lib/db/README.md`에 Phase 3 구성요소와 현재 통합 현황, 향후 마이그레이션 타깃을 명시했습니다.
   - 본 보고서를 통해 잔여 작업(세션 스토어, 서비스 계층, 마이그레이션 파이프라인)과 리스크를 재정비했습니다.

## 다음 액션 아이템
- NextAuth 어댑터 및 세션 스토어 로직을 Drizzle 트랜잭션으로 전환하여 인증 경로 전반을 마이그레이션합니다.
- 프로젝트/커뮤니티/정산 서비스 모듈에서 Prisma 의존을 제거하고, 공통 필터/정렬 헬퍼를 도입해 반복되는 쿼리 패턴을 캡슐화합니다.
- `drizzle-kit generate`와 `docs/baselines/prisma-schema-baseline.sql`을 비교 검증해 마이그레이션 디렉터리를 신뢰할 수 있는 상태로 구성하고 CI에 통합합니다.
