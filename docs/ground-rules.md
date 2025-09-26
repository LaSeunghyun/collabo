# Ground Rules

콜라보리움 팀이 합의한 작업 기본 원칙을 명확히 하기 위해 아래와 같이 정리했습니다. 모든 구성원은 신규 기능 도입이나 유지보수 시 본 규칙을 우선 검토하고 준수해야 합니다.

## 1. 코드 스타일 (TypeScript/React)
- ESLint(Next.js 권장 규칙)와 Prettier를 필수로 사용하며, CI에서 린트 및 포맷 검사를 강제합니다.
- 네이밍 컨벤션: 변수와 함수는 `camelCase`, 컴포넌트 및 클래스는 `PascalCase`, 파일과 폴더는 `kebab-case`를 사용합니다.
- 함수형 컴포넌트와 Hooks를 기본으로 사용하고, 단일 책임 원칙(SRP)을 준수합니다. 150줄을 초과하는 컴포넌트는 분리합니다.
- 명시적 타입 선언을 지향하며 `any` 사용을 금지합니다. 공용 타입은 `@/types` 경로에서 관리합니다.
- 사이드 이펙트는 `useEffect`와 같은 Hooks 내부에서만 처리하고, 데이터 로직과 뷰 로직을 분리합니다.

## 2. 폴더/파일 구조 (Next.js App Router)
- `src/app`에는 페이지와 레이아웃을 배치하며 폴더가 라우트가 됩니다. 동적 경로는 `[id]` 표기, `loading.tsx`와 `error.tsx`를 적극 활용합니다.
- 재사용 UI는 `src/components/ui`, 도메인별 컴포넌트는 `src/components/features/<domain>`에 둡니다.
- 공용 유틸과 서버/클라이언트 공유 로직은 `src/lib`에 배치합니다.
- 훅(`src/hooks`), 컨텍스트(`src/context`), 타입(`src/types`), 스타일(`src/styles`), 환경 설정(`src/config`) 폴더를 활용합니다.
- API 라우트는 `src/app/api/<resource>/route.ts`에 위치시키고 BFF 규약을 일관되게 유지합니다.

## 3. API 설계 원칙
- REST를 우선 적용하며, 복수 명사형 자원 경로와 표준 메서드를 사용합니다. GraphQL/RPC 채택 시 별도 규약을 문서화합니다.
- 버저닝은 `/api/v1`으로 고정하고 응답 포맷은 `{ data, error, meta }` 구조를 사용합니다.
- 에러 처리는 HTTP 상태 코드를 일관되게 적용하며, `{ error: { code, message, details } }` 형식의 바디를 반환합니다.
- 필터·정렬·페이지네이션 쿼리를 `?q=&sort=&page=&limit=` 형태로 통일하고, N+1 방지를 위한 쿼리 최적화와 필드 제한을 수행합니다.
- 요청/응답 스키마는 Zod 및 TypeScript 타입으로 명세하고 OpenAPI 스펙 자동화를 유지합니다.

## 4. 인증/보안
- 인증은 NextAuth(이메일 + Google/Kakao)를 활용하고 세션은 `HttpOnly`, `SameSite` 쿠키로 관리합니다.
- 비밀번호는 `bcrypt` 또는 `argon2`로 해시 및 솔트 처리하며, 로그에 노출하지 않습니다.
- JWT 사용 시 만료 기간을 짧게 유지하고 최소한의 클레임만 포함합니다. 서명 키는 비밀리에 보관하며 리프레시는 회전 및 블랙리스트 전략을 적용합니다.
- 인가는 RBAC(creator, participant, partner, admin) 기준으로 서버에서 재검증합니다.
- 입력 검증은 Zod/DTO 레벨 화이트리스트 방식으로 수행하고 XSS/SQLi를 방지합니다.
- 필수 보안 헤더(HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)를 적용합니다.
- 비밀과 환경 변수는 `.env*` 파일로만 관리하며, 최소 권한 원칙을 준수합니다.

## 5. 협업 정책
- 브랜치 전략은 Trunk 기반으로 `main`을 보호하고 `feature/*` 브랜치를 단기 유지합니다. 릴리즈는 태깅합니다.
- 커밋은 Conventional Commits(`feat|fix|chore|docs|refactor|test|perf(scope): msg`) 규칙을 사용합니다.
- PR은 200~400라인을 권장하며 스크린샷 또는 동영상을 첨부하고, 테스트/접근성/보안 영향 체크리스트를 포함합니다.
- 리뷰는 1명 이상 승인 필수이며, 작성자가 직접 머지하지 않습니다. 변경 이유와 대안을 문서화합니다.
- 이슈는 라벨(버그/기능/우선순위)로 관리하고 스프린트 보드를 운영합니다.

## 6. 테스트 전략
- 단위 테스트(Jest), 컴포넌트 테스트(React Testing Library), API 통합 테스트(Supertest), 선택적 E2E(Playwright/Cypress)를 적용합니다.
- 핵심 도메인 최소 커버리지는 80% 이상 유지하고, 회귀 버그 발생 시 재현 테스트를 추가합니다.
- Mock는 네트워크, 시간, 랜덤 등 외부 요인에만 사용하며 핵심 도메인은 실제 로직을 테스트합니다.
- CI는 린트, 테스트, 타입체크, 빌드를 병렬로 실행하고 실패 시 머지를 차단합니다.

## 7. 성능 최적화
- 렌더링 전략은 SSG/ISR/SSR 기준을 명시하고, 데이터 특성에 따라 선택합니다.
- `next/dynamic`을 활용한 코드 분할과 큰 의존성 분리를 통해 번들을 관리하며, 번들 분석기를 활용합니다.
- 데이터 패칭은 서버에서 병렬 처리하고 캐싱 헤더/ETag를 설정합니다. 클라이언트 캐시는 React Query(TanStack Query)를 사용합니다.
- 이미지는 `next/image`를 사용하고 WebP/AVIF 포맷 및 LCP 목표를 관리합니다.
- `useMemo`, `useCallback`, `React.memo`는 프로파일링 결과에 따라 사용하며 남용을 피합니다.
- 대규모 리스트는 `react-window` 등 가상화 기법을 적용합니다.

## 8. 접근성(A11y)
- 시맨틱 태그와 네이티브 컨트롤을 우선 사용하며, ARIA는 보완용으로만 사용합니다.
- 키보드 조작이 완전해야 하며 포커스 트랩/순서/스타일을 관리하고 ESC/Enter/Space 입력을 처리합니다.
- 명도 대비는 WCAG 2.1 AA(≥4.5:1)를 충족하고 `prefers-reduced-motion` 환경을 고려합니다.
- 폼 레이블과 에러 메시지는 `for`/`aria-describedby`로 연결합니다.
- 정기적으로 axe/Lighthouse 검사를 수행하고 NVDA/VoiceOver 등으로 수동 테스트합니다.

## 9. 디자인 시스템
- Tailwind, shadcn/ui, Radix를 기반으로 하며 디자인 토큰은 Tailwind 테마로 관리합니다.
- 컴포넌트는 `components/ui/*`에서 단일 소스로 관리하고 variant와 상태(loading/disabled)를 일관되게 제공합니다.
- Figma와 코드 간 네이밍 및 토큰을 동기화하며, 토큰 변경은 설정 중심으로 일괄 반영합니다.
- Storybook에 변형/상태/접근성 스토리를 문서화하고 시각 회귀 테스트를 필요에 따라 도입합니다.
- 애니메이션은 가벼운 모션을 유지하며 접근성을 고려합니다. 마이크로 인터랙션은 지표 기반으로 도입합니다.

## 10. 국제화(i18n)
- `i18next` 또는 `next-intl`을 사용하며 기본 언어는 한국어(ko), 협업 언어는 영어(en)입니다.
- 번역 키는 `t('home.hero.title')`처럼 키 기반으로 관리하고 텍스트 하드코딩을 금지합니다.
- `lang`/`dir` 속성을 준수하고 서버 번역 프리로드로 FOUC를 방지합니다.

## 11. 데이터·정산 도메인 규약
- 금액과 통화는 최소 단위 정수로 저장하며 표시 시 포맷팅합니다.
- 프로세스: 펀딩 → 에스크로/보류 → 마일스톤 승인 → 정산 분배(수수료/세금 별도) → 영수증/로그 보관.
- 모든 정산 및 결제 이벤트는 불변 이벤트 로그에 기록하여 감사 추적을 보장합니다.

## 12. 배포/관측(Observability)
- 환경을 dev/staging/prod로 분리하고 불변 빌드를 유지합니다. DB 마이그레이션은 자동화합니다.
- 로깅은 구조화(JSON)하고 PII를 마스킹하며, 에러 추적 도구(Sentry 등)를 사용합니다.
- RUM과 서버 APM을 도입하고 핵심 KPI 대시보드를 운영합니다.

## 13. 비밀/구성 관리
- `.env` 스키마를 문서화(예: `ENV.md`)하고 필수 키가 없으면 부팅 시 실패하도록 합니다.
- 시크릿은 주기적으로 회전하고 접근 권한을 최소화합니다. 로컬 개발용 `.env.example`을 제공합니다.

---

최신 Ground Rules는 제품/기술 리드가 분기별로 검토하며, 변경 시 본 문서를 업데이트하고 슬랙 #engineering-notice 채널에 공지합니다.
