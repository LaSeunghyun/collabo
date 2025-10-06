# Prisma → Drizzle Phase 1 보고서

## 개요
- Drizzle CLI 및 런타임 의존성을 패키지 매니저에 추가해 향후 이중 운영이 가능하도록 구성했습니다.
- `drizzle.config.ts`와 `lib/db/schema` 진입점을 생성하여 마이그레이션/스키마 도구의 실행 기반을 마련했습니다.
- 빌드 및 DB 관련 NPM 스크립트를 일반화하여 `DB_MIGRATOR` 플래그로 Prisma ↔︎ Drizzle 전환이 가능하도록 준비했습니다.

## 세부 작업
1. **의존성 부트스트랩**
   - `drizzle-orm`, `drizzle-kit`, `pg`, `@neondatabase/serverless` 패키지를 추가해 Node/서버리스 양쪽 드라이버를 모두 지원할 준비를 마쳤습니다.
   - `npm run db:drizzle:*` 커맨드를 추가해 Prisma 스크립트와 병행 운영할 수 있습니다.
2. **구성/디렉터리 정비**
   - `drizzle.config.ts`에서 `.env.local`/`.env`를 읽어 기본 연결 문자열을 로드하고, 출력 경로를 `drizzle/`로 고정했습니다.
   - `lib/db/schema`에 플레이스홀더를 두어 Phase 2에서 테이블 정의를 채울 수 있도록 문서화했습니다.
3. **빌드 스크립트 일반화**
   - `scripts/build-with-drizzle.mjs`는 `DB_MIGRATOR` 값에 따라 Prisma와 Drizzle 중 적절한 마이그레이션 경로를 실행하며, Drizzle의 생성 스텝은 선택적으로 수행합니다.
   - 기본값은 Prisma이므로 기존 배포 파이프라인에 영향이 없습니다.

## 다음 액션 아이템
- Phase 2에서 Prisma 스키마를 Drizzle 테이블로 포팅하고, `drizzle-kit generate`가 실 테이블을 생산하도록 합니다.
- `lib/db/client` 계층을 도입하여 런타임 코드가 Prisma 인스턴스에서 분리되도록 준비합니다.
- Drizzle 마이그레이션 파이프라인을 CI에 통합하고, Prisma CLI 의존성을 제거하는 컷오버 전략을 마련합니다.
