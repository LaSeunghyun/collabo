# Prisma → Drizzle Phase 2 보고서

## 개요
- `prisma/schema.prisma` 전 범위를 Drizzle 테이블 정의로 이식하여 `lib/db/schema`가 실제 런타임 스키마를 표현하도록 마이그레이션했습니다.
- Prisma enum 전부를 `pgEnum` 기반 모듈로 분리하고, 테이블 간 관계/인덱스/제약 조건을 Drizzle DSL로 동등하게 재현했습니다.
- Phase 3 이후 전환을 대비해 `relations(...)`를 통해 기존 서비스 계층이 기대하는 연결 정보를 노출했습니다.

## 세부 작업
1. **스키마 모듈화**
   - `lib/db/schema/enums.ts`에 16개의 Prisma enum을 일대일 대응으로 정의했습니다.
   - `lib/db/schema/tables.ts`에서 34개 테이블과 조인 테이블, 인덱스, 외래키, 기본값을 Prisma 베이스라인 SQL과 동일하게 구현했습니다.
   - `lib/db/schema/index.ts`는 Drizzle CLI가 단일 엔트리 포인트에서 enum/테이블을 모두 재사용할 수 있도록 재구성했습니다.
2. **관계 선언**
   - Prisma `@relation` 메타데이터를 참고해 `relations()` 호출을 세분화하고, 다대다/자가 참조 시 `relationName`을 명시해 충돌을 방지했습니다.
   - 인증, 커뮤니티, 커머스, 정산 도메인 전반에서 서비스 계층이 활용하는 역방향 연결을 모두 포함했습니다.
3. **진행 상황 공유**
   - Phase 2 결과와 후속 액션 아이템을 문서화해 팀 합류자와 리뷰어가 스키마 상태를 즉시 파악할 수 있도록 했습니다.

## 다음 액션 아이템
- Phase 3에서 `lib/db/client`를 도입하고 Prisma 의존 서비스 모듈을 Drizzle 쿼리로 순차 전환합니다.
- `drizzle-kit generate` 출력물을 베이스라인 SQL과 비교해 스키마 드리프트가 없는지 검증 후 마이그레이션 디렉터리를 채웁니다.
- 테스트/시드 스크립트를 Drizzle 기반으로 재작성하면서 enum 및 `InferModel` 타입을 소비하도록 타입 선언을 추가합니다.
