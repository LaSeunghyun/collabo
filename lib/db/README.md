# Drizzle 데이터 계층

Phase 2 시점의 `lib/db`는 Prisma → Drizzle 전환을 위한 실질적인 스키마 정의를 담고 있습니다.

- `drizzle.config.ts`는 `.env.local`/`.env`에서 연결 문자열을 읽어 Drizzle CLI가 `lib/db/schema`를 기준으로 마이그레이션을 생성하도록 구성되어 있습니다.
- `lib/db/schema/enums.ts`는 기존 Prisma enum 16종을 `pgEnum`으로 노출하며, `tables.ts`는 34개 테이블/조인/관계형 인덱스를 Drizzle DSL로 표현합니다.
- `relations()` 선언을 통해 각 도메인(인증, 커뮤니티, 커머스, 정산 등)의 역방향 연결을 TypeScript 수준에서 그대로 활용할 수 있습니다.

## 다음 단계

1. `lib/db/client` 계층을 추가해 런타임 코드에서 Prisma 인스턴스를 대체할 공통 Drizzle 클라이언트를 제공합니다.
2. 서비스/스크립트 계층의 Prisma 쿼리를 Drizzle 쿼리 빌더로 교체하고, 점진적인 Dual-Run 또는 Feature Flag 전략을 적용합니다.
3. `drizzle/` 디렉터리에 생성될 마이그레이션과 현재 `docs/baselines/prisma-schema-baseline.sql`을 비교해 스키마 드리프트를 검증합니다.
