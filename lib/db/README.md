# Drizzle 데이터 계층 부트스트랩

이 디렉터리는 Prisma → Drizzle 전환을 위한 러프한 골격을 담고 있습니다. Phase 1에서는 다음을 보장합니다.

- `drizzle.config.ts`가 `lib/db/schema` 경로를 바라보며 CLI가 동작합니다.
- 런타임 코드는 아직 Prisma를 사용하지만, 후속 Phase에서 교체할 준비가 되어 있습니다.
- 스키마 정의는 추후 단계에서 테이블별 모듈로 분리하여 채워 넣습니다.

## 다음 단계

1. `lib/db/schema` 아래에 Prisma 모델을 Drizzle 테이블로 옮깁니다.
2. `lib/db/client` 계층을 도입해 Prisma에 의존하던 서비스 코드를 Drizzle로 전환합니다.
3. 신규 마이그레이션은 `drizzle/` 디렉터리에 생성되며, 기존 Prisma 마이그레이션은 아카이빙합니다.
