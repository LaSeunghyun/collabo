# `@/types/prisma` 사용 현황 인벤토리

Phase 2~3에서 요구한 "기존 `@/types/prisma` 참조 파일 목록화" 작업 결과입니다. `rg "@/types/prisma"` 명령 기준으로, 도메인별
Prisma 타입/열거형 의존을 정리했습니다.

## 1. 서버 모듈 & API 라우트
| 범주 | 파일 | 주요 사용 타입 | 메모 |
| --- | --- | --- | --- |
| 서버 서비스 | `lib/server/artists.ts` | `PostType`, `UserRole` | 콘텐츠/권한 결정 로직에 활용 |
|  | `lib/server/projects.ts` | `ProjectStatus`, `UserRole`, `ProjectSummary` | 프로젝트 목록/상세 쿼리 |
|  | `lib/server/partners.ts` | `PartnerType`, `UserRole` 등 | 파트너 대시보드 및 API 공유 |
|  | `lib/server/funding-settlement.ts` | `FundingStatus`, `SettlementPayoutStatus` | 정산 스케줄 계산 |
|  | `lib/server/moderation.ts` | `ModerationStatus`, `ModerationTargetType` | 신고 처리 |
|  | `lib/server/settlement-queries.ts` | `SettlementPayoutStatus` | 정산 내역 조회 |
| 인증 | `lib/auth/*.ts` | `UserRole`, `UserRoleType` | 권한 검증/세션 직렬화 |
| API 라우트 | `app/api/**/*.ts` | `UserRole`, `PartnerType`, `SettlementPayoutStatus` 등 | NextAuth, 프로젝트, 파트너, 정산 엔드포인트 |

## 2. UI & 폼
| 영역 | 파일 | 주요 사용 타입 | 메모 |
| --- | --- | --- | --- |
| Admin UI | `app/admin/**/*.tsx` | `PROJECT_STATUS_LABELS`, `PartnerType`, `ModerationStatus` | 대시보드 및 검수 UI |
| 프로젝트 화면 | `app/projects/[id]/page.tsx`, `app/projects/new/page.tsx` | `UserRole` | 권한 기반 렌더링 |
| 파트너 화면 | `app/partners/**/*.tsx`, `components/ui/forms/partner-form.tsx` | `PartnerType`, `PartnerTypeType` | 폼 옵션/검증 |
| 공용 컴포넌트 | `components/ui/sections/project-updates-board.tsx` | (주석 참고) | 스키마 부재로 주석 처리된 항목 존재 |

## 3. 테스트 코드
| 범주 | 파일 | 비고 |
| --- | --- | --- |
| 서버 단위 테스트 | `__tests__/lib/server/*.test.ts` | 도메인별 enum 및 모델을 직접 import |
| 인증 테스트 | `__tests__/lib/auth/*.test.ts`, `tests/role-guards.test.ts` | 권한 플로우 검증 |
| 통합 테스트 | `tests/partner-*.test.ts`, `tests/partner-create.integration.test.ts` | 폼 검증/서비스 통합 |

## 4. 타입 선언
| 파일 | 설명 |
| --- | --- |
| `types/auth.core.d.ts` | 글로벌 타입 확장에서 `UserRole` enum 재사용 |
| `types/prisma.ts` | Prisma Client에서 export되는 enum/타입을 재노출 |

## 5. 전환 우선순위 제안
1. **타입 브릿지 모듈 작성:** `lib/db/schema`에서 생성된 Drizzle enum/타입을 `@/types/drizzle`(가칭)으로 노출해 UI와 테스트가 참조할 수 있도록 합니다.
2. **테스트 헬퍼 업데이트:** Jest/Playwright 시드 유틸을 Drizzle 타입으로 대체하여, Prisma 타입 변경 시 재생성 의존을 제거합니다.
3. **점진적 리팩터링:** 상위 폴더부터 `@/types/prisma` import를 교체하고, 완료된 폴더는 본 문서에서 체크 표시로 갱신합니다.

> ⚠️ 이 인벤토리는 2025-10-07 기준입니다. `rg "@/types/prisma"`를 재실행하여 최신 상태를 유지하세요.
