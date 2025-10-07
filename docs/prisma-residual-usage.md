# Prisma 잔존 의존성 감사 로그

> Phase 5 진행을 위해 Prisma 관련 import 및 스크립트를 전수 조사한 결과입니다. 각 항목은 제거 우선순위와 담당자를 포함합니다.

| 파일 | 설명 | 조치 | 난이도 | 우선순위 | 담당 |
| --- | --- | --- | --- | --- | --- |
| `lib/prisma.ts` | Prisma 클라이언트 인스턴스 | Drizzle 래퍼로 대체 예정 | 높음 | ★★★ | 데이터 팀 |
| `lib/server/**` | 대부분의 서비스 모듈이 Prisma 질의를 사용 | Drizzle query builder로 재작성 | 높음 | ★★★ | 각 도메인 오너 |
| `app/api/**` | API Route 다수에서 Prisma 직접 호출 | Phase 3~4 산출물 기반으로 단계적 이관 | 높음 | ★★★ | 플랫폼 팀 |
| `scripts/*.ts` | Seed/maintenance 스크립트가 Prisma 의존 | Drizzle 기반 유틸로 재작성, 필요 시 폐기 | 중간 | ★★☆ | DevOps |
| `__tests__/helpers/prisma-mock.ts` | Prisma mock 객체 사용 | Drizzle fixture/mocking 유틸로 교체 | 중간 | ★★☆ | QA |
| `package.json` | `@prisma/client`, `prisma` 패키지 의존성 | Drizzle 전환 완료 시 제거 | 낮음 | ★★★ | 데이터 팀 |
| `prisma/` 디렉터리 | 스키마, 마이그레이션 자산 | Drizzle 마이그레이션과 diff 비교 후 폐기 | 중간 | ★★☆ | 데이터 팀 |

## 메모
- `rg "@prisma/client"` 명령으로 최신 목록을 갱신하세요.
- 제거 후에는 `npm run test:regression`으로 회귀 테스트를 수행하고, DB 스키마 drift 여부를 재확인합니다.
- 잔존 의존성이 제거될 때마다 본 문서를 업데이트하여 추적합니다.
