# Contributing Guide

콜라보리움 저장소는 Trunk-Based Development를 기본으로 운영합니다. 아래 가이드를 따라 안정적으로 변경 사항을 반영해주세요.

## 브랜치 전략
- **main**: 항상 배포 가능한 상태를 유지합니다. 직접 푸시는 금지하며, CI 통과와 1명 이상의 승인을 필수로 요구합니다.
- **feature/<scope>-<topic>**: 1~3일 이내의 단기 작업 브랜치입니다. 최대 500라인(테스트 제외) 이하의 작은 변경으로 유지하고, 최소 하루 한 번은 `git fetch && git rebase origin/main`으로 최신 상태를 반영합니다.
- **integrations/auth-vN**: 인증·인가처럼 변경이 잦은 영역을 위한 통합 브랜치입니다. 관련 PR(#14, #16, #18 등)은 우선 이 브랜치로 머지 후, 일괄 검증을 마친 뒤 main으로 단일 PR을 올립니다.
- (선택) **release/<version>**: 배포 안정화가 필요할 때만 커트하며, 버그 픽스만 체리픽합니다.

## PR 규칙
1. **작고 집중된 변경**: 동일 파일을 동시에 수정하는 PR이 중복되지 않도록 작업 범위를 명확히 합니다.
2. **타이틀 컨벤션**: `feat(auth): ...`, `fix(types): ...` 처럼 영역을 prefix로 명시합니다.
3. **체크리스트** (PR 본문에 복사 붙여넣기)
   - [ ] 테스트 통과 (`npm test` 등)
   - [ ] 타입 영향도 확인
   - [ ] 마이그레이션 여부 명시
4. **머지 전략**: CI 통과 + 리뷰 승인 후 머지 큐(선택)를 사용해 `squash merge`로 반영합니다.

## 코드 오너십 & 핫스팟 정책
- `app/api/auth/[...nextauth]/route.ts`는 @auth-core 팀이 1차 리뷰합니다.
- 인증 타입 정의는 `types/auth.*.d.ts`로 분리되어 있으며 @types-core가 오너입니다.
- 인증 기능 대규모 개편은 `AUTH_V3_ENABLED` 플래그로 가드한 뒤 main에 선반영하고, 실제 활성화는 단계적으로 진행합니다.

## CI & 품질 게이트
- 필수 체크: 타입 검사, 테스트, 린트/포맷, (필요 시) Prisma 마이그레이션 검증.
- 머지 전 rebase가 되었는지 확인하는 CI 체크를 추가로 운영합니다.

## 빠른 실행 체크리스트
- [ ] main 보호 규칙 & 머지 큐 설정
- [ ] `integrations/auth-v3` 생성 및 관련 PR 베이스 변경
- [ ] CODEOWNERS로 인증/타입 오너 지정
- [ ] `types/auth.*.d.ts` 구조 유지
- [ ] `AUTH_V3_ENABLED` 플래그 값 확인

## 로컬 개발 팁
- 환경 변수 예시 `.env.example`을 참고하고, Stripe/NextAuth 자격 증명은 별도 시크릿 매니저에 저장합니다.
- Storybook 및 디자인 토큰 정리는 `/design-system` 브랜치에서 실험 후 main에 반영합니다.
