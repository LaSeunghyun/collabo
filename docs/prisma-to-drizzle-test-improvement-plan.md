# Prisma→Drizzle 전환 테스트 및 개선 계획

Phase 0부터 Phase 5까지 정리된 전환 시나리오를 기준으로, 품질 검증과 반복 개선 활동을 단계별로 정리한 계획입니다. QA, 개발자, DevOps, 데이터 담당자가 공유할 수 있는 실행 지침을 목표로 합니다.

## 1. 전사 공통 원칙
- **이중 검증 유지:** Prisma와 Drizzle을 병행하는 기간 동안 핵심 API에 대해 샘플 데이터를 양쪽에서 조회해 응답 필드, 결과 카디널리티, 정렬 일관성을 비교합니다.
- **스키마 기준선 보호:** Phase 0에서 고정한 Prisma 스키마와 데이터 스냅샷을 참조하여 Drizzle 마이그레이션이 동일한 구조를 재현하는지 검사합니다.
- **자동화 선행, 수동 보강:** 각 Phase의 자동화 테스트가 통과한 이후에만 수동 시나리오를 진행하여 디버깅 범위를 축소합니다.
- **관측 지표 기록:** 전환 기간 동안 API 응답 시간, DB 커넥션 수, 에러율을 Datadog/Grafana에 기록하고 주요 전환 포인트마다 전후 비교 스냅샷을 남깁니다.

## 2. Phase별 테스트 & 개선 활동

### Phase 0 – Discovery & Preparation
| 목표 | 액션 | 담당 | 산출물 |
| --- | --- | --- | --- |
| Prisma 의존성 파악 | `rg "prisma"`와 코드 맵을 이용해 호출 부위를 표로 정리 | 아키텍트 | `docs/prisma-residual-usage.md` 업데이트 |
| 스키마 기준선 확정 | `npm run db:push`, `npx prisma migrate diff` 실행 후 SQL 스냅샷 보관 | 데이터 엔지니어 | `docs/baselines/prisma-schema.sql` 갱신 |
| 스테이징 데이터 확보 | 최신 스테이징 덤프 추출 및 민감 정보 마스킹 | 데이터 엔지니어 | `docs/baselines/staging-snapshot.md` |
| 이해관계자 정렬 | API/인증/데이터/DevOps 오너 미팅, 일정 합의 | PM | 킥오프 회의록 |

**개선 포인트:** Prisma 호출 표를 기준으로 리팩터링 난이도(낮음/중간/높음) 태그를 추가해 이후 스프린트 계획에 반영합니다.

### Phase 1 – Tooling Bootstrap
| 목표 | 액션 | 테스트 | 개선 |
| --- | --- | --- | --- |
| Drizzle 의존성 설치 | `npm install drizzle-orm drizzle-kit pg` | `npm run lint` | 패키지 설치 후 락파일 충돌 여부 확인 |
| Drizzle 구성 스캐폴딩 | `drizzle.config.ts`, `drizzle/` 디렉터리 생성 | `npx drizzle-kit introspect` (ReadOnly) | Prisma 연결 옵션과 비교표 작성 |
| 워크플로우 전환 | npm 스크립트 교체 (`db:push` → `db:migrate`) | `npm run db:migrate -- --dry-run` | 스크립트 설명을 README에 추가 |

**개선 포인트:** CI 파이프라인에 Drizzle 명령을 추가하고, 실패 시 Slack 알림을 연동합니다.

### Phase 2 – Schema Translation
| 목표 | 액션 | 테스트 | 개선 |
| --- | --- | --- | --- |
| 모델 변환 | `lib/db/schema/`에 pgTable 정의 추가 | `npm run lint`, `tsc --noEmit` | 열거형/관계 매핑 가이드 작성 |
| 마이그레이션 생성 | `npx drizzle-kit generate` 후 수동 튜닝 | `npm run db:migrate -- --verify` | Prisma 스키마와 diff 비교 보고 |
| 타입 내보내기 | `InferModel` 기반 타입 생성 | 타입 테스트(`tests/types/*.test.ts`) | 기존 `@/types/prisma` 참조 파일 목록화 |

**개선 포인트:** Drizzle 스키마 모듈별로 주석에 Prisma 모델 참조 링크를 남겨 추적성을 유지합니다.

### Phase 3 – Runtime Integration
| 목표 | 액션 | 테스트 | 개선 |
| --- | --- | --- | --- |
| DB 클라이언트 추상화 | `lib/db/client.ts` 작성 | `npm run lint`, `npm run test -- db-client` | Node/Edge 환경별 커넥션 벤치마크 |
| 서비스 모듈 교체 | `app/api/**`, `lib/server/**`에서 Prisma 호출 제거 | 기능별 Jest 스펙 업데이트 | 레포지토리별 코드 리뷰 체크리스트 작성 |
| 인증 어댑터 전환 | NextAuth 설정을 Drizzle 어댑터로 변경 | `npm run test auth` + 수동 로그인 | 세션/계정 테이블 매핑 문서화 |
| 검증/직렬화 정비 | Drizzle enum 재사용으로 DTO 교체 | `npm run lint`, `npm run typecheck` | UI 폼에서 enum 옵션 자동 생성 |

**개선 포인트:** 모듈 교체 시 Prisma 호출과 대응하는 Drizzle SQL 로그를 수집해 성능 변화치를 기록합니다.

### Phase 4 – Testing & QA
| 목표 | 액션 | 테스트 | 개선 |
| --- | --- | --- | --- |
| 테스트 하네스 갱신 | Jest/Playwright 시드 유틸리티를 Drizzle로 변경 | `npm run test`, `npm run test:e2e` | `docs/prisma-to-drizzle-testing-playbook.md` 교차 검증 |
| 회귀 테스트 실행 | 핵심 플로우(펀딩, 커뮤니티, 파트너, 정산) 집중 | `npm run test:regression` | 실패 케이스 원인 분석 노션 페이지 공유 |
| 성능 검증 | 주요 쿼리 실행 계획 비교 | `EXPLAIN ANALYZE` 로그 첨부 | 느린 쿼리 개선 이슈 발행 |

**개선 포인트:** 테스트 중 발견된 스키마 개선 사항은 Phase 5 이전에 마이그레이션으로 반영하고, 변경 내역을 changelog에 기록합니다.

### Phase 5 – Rollout & Cleanup
| 목표 | 액션 | 테스트 | 개선 |
| --- | --- | --- | --- |
| 환경 전환 | 토글 기반 배포 → Prisma 경로 비활성화 | `npm run test`, 스테이징 스모크 | 토글 제거 일정 수립 |
| 문서화 완료 | README, DEPLOYMENT, 내부 가이드 업데이트 | `npm run lint:docs` (있을 경우) | Drizzle FAQ 추가 |
| 잔여 Prisma 제거 | 패키지/디렉터리 삭제 후 확인 | `rg "prisma"` | 남은 호출 자동 감지 ESLint 룰 도입 |
| 운영 모니터링 | 릴리스 1주간 메트릭 감시 | 대시보드 점검 | 회고 미팅 준비 |

**개선 포인트:** 전환 완료 후 2주 내 회고를 진행해 전환 과정에서의 병목, 툴링 이슈, 조직 협업 개선안을 도출합니다.

## 3. 테스트 보고 및 이슈 관리
- **테스트 로그 수집:** 각 테스트 명령은 CI 아티팩트로 보존하며, 실패 로그를 QA 담당자가 슬랙 #qa 채널에 공유합니다.
- **이슈 티켓화:** 버그나 성능 회귀는 Linear/Jira 티켓으로 등록하고 Phase 태그(예: `phase3-runtime`)를 붙입니다.
- **릴리즈 게이트:** Phase 4 테스트가 100% 통과하고, 핵심 수동 시나리오(로그인, 펀딩 결제, 커뮤니티 게시) 합격 시에만 Phase 5로 진입합니다.

## 4. 커뮤니케이션 루프
- 주간 스탠드업에서 Phase별 진척도와 차단 이슈를 공유합니다.
- 이해관계자(데이터, 인증, DevOps)별로 전환 영향도를 정리해 노션/위키에 업데이트합니다.
- 전환 완료 후 1개월 동안은 Drizzle 관련 문의를 전담 채널(#drizzle-migration)에서 수집합니다.

## 5. 향후 개선 로드맵
1. **자동 회귀 비교 툴:** Prisma와 Drizzle 결과를 동시에 실행하여 JSON 응답을 diff하는 스크립트 작성.
2. **성능 프로파일링 자동화:** Lighthouse + DB 쿼리 타이머를 결합한 주간 리포트 발행.
3. **스키마 헬스체크:** 정기적으로 Drizzle 스키마를 introspect하여 문서화와 실제 DB가 일치하는지 검증.
4. **교육 자료 확장:** 신규 입사자를 위한 Drizzle 핸즈온 워크숍과 코드랩 제작.

---

이 계획은 Phase별 점검 회의에서 지속적으로 업데이트하며, 전환 진행 상황에 맞춰 테스트 범위와 개선 과제를 조정합니다.
