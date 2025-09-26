# Collaborium Platform

Next.js 14 기반으로 재구성한 콜라보리움 아티스트 팬 협업 플랫폼입니다. App Router, Tailwind CSS, shadcn/ui 패턴을 활용해 홈 · 프로젝트 · 아티스트 · 파트너 · 커뮤니티 페이지를 멀티 라우트 구조로 제공합니다.

## 주요 기능
- 홈 배너 캐러셀, 실시간 인기/마감 임박/테마별 프로젝트 섹션
- 프로젝트 목록 필터링, 상세 탭(Story/Updates/Community/Roadmap/Settlement)
- 아티스트 KPI 대시보드, 파트너 추천 및 등록 폼, 커뮤니티 게시판
- Prisma 스키마, NextAuth 인증, Stripe 결제/정산 API 스텁, i18next 다국어 지원
- Zustand 기반 전역 상태, React Query 데이터 패칭, Jest + RTL 컴포넌트 테스트

## 번역 키 구조
- `common.loading`: 공용 로딩 메시지
- `navigation.*`: 헤더/푸터 네비게이션 레이블
- `actions.*`: 버튼 및 접근성 레이블 (예: `actions.viewMore`)
- `home.*`: 홈 탭 전용 텍스트. `home.store.items`와 `home.liveAma`에 세부 문구를 묶어 관리합니다.
- `projects.*`: 프로젝트 목록 및 필터 섹션 문자열 (`projects.overviewTitle`, `projects.overviewDescription` 등)
- `community.*`, `partners.*`: 커뮤니티/파트너 관련 복합 UI 텍스트
- `help.*`: FAQ 페이지 제목, 설명 및 `help.faqs.{id}` 구조의 질문-답변 페어

## 개발 환경
```bash
npm install
npm run dev
```

### 테스트 실행
```bash
npm test
```

## 환경 변수 예시
```
DATABASE_URL=postgresql://user:pass@localhost:5432/collaborium
GOOGLE_CLIENT_ID=placeholder
GOOGLE_CLIENT_SECRET=placeholder
KAKAO_CLIENT_ID=placeholder
KAKAO_CLIENT_SECRET=placeholder
STRIPE_SECRET_KEY=sk_test
STRIPE_PUBLISHABLE_KEY=pk_test
AUTH_V3_ENABLED=false
```

## 작업 가이드

브랜치 전략과 코드 오너십 정책은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고해주세요.
