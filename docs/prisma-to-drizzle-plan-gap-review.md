# Prisma→Drizzle 테스트/개선 계획 점검 리포트

2025-10-07 기준으로 `docs/prisma-to-drizzle-test-improvement-plan.md`에 명시된 액션 아이템을 검토한 결과입니다. 미흡하거나 누락된 항목을
정리하고 즉시 보완 가능한 부분은 수정했습니다.

## 1. 즉시 보완 완료 항목
| 계획 항목 | 기존 상태 | 조치 | 참고 문서 |
| --- | --- | --- | --- |
| Phase 0: Prisma 호출 난이도 태깅 | `docs/prisma-residual-usage.md`에 난이도 정보 없음 | 난이도 열 추가(높음/중간/낮음) | [`docs/prisma-residual-usage.md`](./prisma-residual-usage.md) |
| Phase 0: 스테이징 스냅샷 산출물 | 문서 부재 | 스냅샷 수집 절차 및 기록용 템플릿 추가 | [`docs/baselines/staging-snapshot.md`](./baselines/staging-snapshot.md) |
| Phase 2: `@/types/prisma` 참조 목록화 | 인벤토리 부재 | 도메인별 의존성 표 작성 | [`docs/prisma-types-usage-inventory.md`](./prisma-types-usage-inventory.md) |

## 2. 남은 개선 과제
| 계획 항목 | 현재 상태 | 권장 후속 조치 |
| --- | --- | --- |
| Phase 1: README에 Drizzle 워크플로우 명시 | README에 `db:drizzle:*` 사용법 미기재, 구 Plan 스크립트 안내 부재 | README 테스트 섹션에 Drizzle 스크립트와 `DB_MIGRATOR` 활용법 추가 |
| Phase 1: CI Slack 알림 연동 | 구현 이력 없음 | CI 파이프라인에서 `db:drizzle:*` 명령 실패 시 Slack Webhook 연동 티켓 생성 |
| Phase 4: 테스트 후 정리 스크립트 | `scripts/test-db-cleanup.ts` 미작성 | Drizzle 기반 seed/cleanup 유틸 구현, 플레이북에서 “추가 예정” 문구 해제 |
| Phase 0: 스테이징 덤프 마스킹 스크립트 | `scripts/mask-staging-dump.sql` 미작성 | 보안팀과 협의 후 SQL 스크립트 작성 및 본문 링크 업데이트 |

## 3. 권장 추적 방법
- 위 남은 과제는 Linear 태그 `phase1-tooling`, `phase4-testing`, `phase0-data`로 분류해 다음 스프린트 백로그에 추가합니다.
- 본 리포트는 Phase별 점검 회의에서 업데이트하며, 완료 시 해당 행에 체크 표시(✅)를 남깁니다.

---

문의나 추가 발견 사항은 #drizzle-migration 채널에 공유해주세요.
