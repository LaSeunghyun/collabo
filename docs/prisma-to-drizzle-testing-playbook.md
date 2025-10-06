# Drizzle 전환 회귀 테스트 플레이북

Phase 4에서 합의한 테스트 범위와 실행 절차를 정리한 문서입니다. QA, 개발자, DevOps가 동일한 체크리스트를 공유하도록 작성되었습니다.

## 1. 사전 준비
- `.env.test` 혹은 CI 환경 변수에 Drizzle DB 연결 문자열(`DATABASE_URL`)을 지정합니다.
- `npm install` 실행 후 `npm run db:baseline`으로 Prisma 스키마 스냅샷을 확인합니다.
- Playwright 테스트를 실행할 경우 `npx playwright install`로 브라우저 바이너리를 준비합니다.

## 2. 자동화 테스트 순서
1. `npm run lint`
   - TypeScript/ESLint 규칙 준수 여부 확인.
2. `npm run test -- --runInBand`
   - 단위 및 통합 테스트를 순차 실행하여 DB race condition을 방지합니다.
3. `npm run test:e2e` (선택)
   - Playwright 기반 엔드 투 엔드 테스트. Stripe, 이메일 등 외부 의존성은 mock 서버로 대체합니다.
4. `npm run test:regression`
   - 상기 명령을 `scripts/run-drizzle-regression.mjs`가 일괄 실행합니다.

## 3. 수동 검증 체크리스트
| 영역 | 시나리오 | 기대 결과 |
| --- | --- | --- |
| 인증 | 로그인/로그아웃, 세션 갱신 | 액세스 토큰, 리프레시 토큰이 정상 발급 및 회전 |
| 정산 | 프로젝트 펀딩 성공 → 정산 생성 | 정산 레코드 및 정산 지급 내역이 계산식과 일치 |
| 커뮤니티 | 게시글 작성, 좋아요/싫어요 토글 | 게시글/리액션 수치가 실시간 반영 |
| 파트너 매칭 | 요청 생성, 파트너 수락 | 매칭 상태가 ACCEPTED → COMPLETED 전환 |
| 관리자 | 권한 부여/회수 | 사용자 권한 테이블이 즉시 갱신 |

## 4. 데이터 관리
- 테스트 종료 후 `scripts/test-db-cleanup.ts`(추가 예정)로 임시 데이터를 삭제합니다.
- 민감 데이터는 사용 금지. 샘플 데이터는 `docs/baselines/`의 스냅샷을 활용합니다.

## 5. 장애 대응
- 회귀 테스트 실패 시 `docs/prisma-residual-usage.md`를 참고하여 Prisma 의존성 여부 확인.
- DB 연결 오류 발생 시 `app/api/test-db` 엔드포인트로 헬스체크를 수행합니다.
- 마이그레이션 불일치 시 Drizzle 마이그레이션 디렉터리와 Prisma 베이스라인을 비교(diff)합니다.

## 6. 보고 절차
- 테스트 실행 로그는 CI 아티팩트로 보관하고, 실패 케이스는 Slack #qa 채널에 공유합니다.
- Phase 5 완료 전까지는 Prisma-Drizzle 이중 확인을 위해 주요 API 응답을 샘플링합니다.

이 플레이북은 전환 완료 후 Drizzle 전용 테스트 전략으로 개편할 예정입니다.
