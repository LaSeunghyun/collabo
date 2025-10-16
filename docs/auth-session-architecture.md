# 인증 세션 및 토큰 운영 가이드

콜라보리움 웹/모바일 전반의 인증 체계 기본 원칙을 정리한 문서입니다. 토큰 수명, 회전 정책, 저장 방식, 운영 절차를 일관되게 적용하기 위한 참조로 활용하세요.

## 1. 토큰 정의와 세션 구조
- **Access Token (AT)**: API 호출용 단기 토큰. JWT 또는 불투명 토큰 사용.
- **Refresh Token (RT)**: AT 재발급용 장기 토큰. 회전(Rotation)과 1회용(Nonce) 원칙을 강제.
- **Session Record**: 서버 DB에 사용자-디바이스-RT 상태를 저장(활성/폐기, 마지막 사용 시각, IP/UA 지문 등).
- **Device Trust**: "이 브라우저 기억하기" 선택 시 RT 만료/슬라이딩 윈도우를 완화.

## 2. 토큰 수명 (권장 기본값)
| 구분 | Access Token | Refresh Token 슬라이딩 만료 | Refresh Token 절대 만료 |
| --- | --- | --- | --- |
| 일반 웹 | 15분 | 14일 | 60일 |
| Remember me | 15분 | 30일 | 90일 |
| 모바일 SDK | 15분 | 30일 | 180일 |
| 어드민(백오피스) | 10분 | 7일 | 30일 |

- 비활성 세션 자동 로그아웃(웹 UI): 마지막 사용자 인터랙션 기준 12시간.
- 슬라이딩 윈도우: RT로 AT를 재발급할 때마다 비활성 기간(예: 14/30일) 갱신. 단, 절대 만료(60/90/180일)는 갱신 불가.

## 3. 저장 및 전송 보안
### 웹
- `access_token` 쿠키는 사용하지 않고, AT는 메모리에만 보관.
- `__Host-refresh_token` 쿠키만 사용하여 `/auth/refresh`에서 AT 교환.
- 쿠키 속성: `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/auth`, 도메인 미지정(Host-Only).

### 모바일/데스크톱 앱
- RT를 iOS Keychain, Android Keystore 등 보안 스토리지에 저장.

### 서버
- RT는 64바이트 이상의 랜덤 불투명 토큰으로 생성 후 Argon2/Bcrypt로 해시 저장.
- JWT 사용 시 AT만 JWT로 유지하고 RT는 불투명 토큰 + 서버 검증 구조 권장.

## 4. 토큰 회전 및 도난 대응
- 모든 `/auth/refresh` 요청에서 RT를 1회용으로 소모하고 새 AT/RT를 발급.
- 동일 RT 재사용 감지 시: 세션 즉시 폐기, 사용자 알림, 최근 1시간 내 동일 디바이스 활성 RT 선택 폐기.
- IP/UA 급변 탐지: 동일 세션 내 /24 IP 대역 또는 UA 지문 급변 시 재인증(MFA/비밀번호) 요구. 어드민은 항상 강화 정책 적용.

## 5. 만료·로그아웃·폐기 정책
- 명시적 로그아웃: 해당 세션 RT 폐기 및 블랙리스트 처리, 클라이언트 AT 즉시 제거.
- 비밀번호 변경/계정 보안 이벤트(이메일 변경, MFA 활성화) 시 기본값으로 전체 세션 폐기.
- 탈퇴/정지 시 모든 세션·RT 폐기.
- 절대 만료 도달 시 RT 재발급 거부, 완전 재로그인 필요.

## 6. 백엔드 스키마 요약
- `sessions(id, user_id, device_id, created_at, last_used_at, ip_hash, ua_hash, remember, is_admin, revoked_at)`
- `refresh_tokens(id, session_id, token_hash, created_at, expires_at, used_at, rotated_to_id, revoked_at)`
- `token_blacklist(jti, expires_at)` (JWT AT에 JTI 사용 시)
- `devices(id, user_id, device_fingerprint, first_seen_at, last_seen_at, label)`
- 주요 인덱스: `refresh_tokens.session_id`, `refresh_tokens.token_hash UNIQUE`, `sessions.user_id`, `sessions.last_used_at`.

## 7. 핵심 API 계약
- `POST /auth/login`: 인증 후 세션 생성, AT(15m) + RT 발급, `__Host-refresh_token` 쿠키 설정.
- `POST /auth/refresh`: 쿠키 기반 RT 검증(미사용/미만료/미폐기) → 회전 → 새 AT/RT 발급, 이전 RT `used_at` 기록. 재사용 감지 시 401 및 세션 폐기.
- `POST /auth/logout`: 현재 세션 RT/세션 폐기, 쿠키 삭제(`Set-Cookie Max-Age=0`).
- `POST /auth/logout-all`: 모든 세션 폐기(보안 이벤트, 분실 디바이스 대응).
- `GET /auth/sessions`: 활성 디바이스/세션 목록 조회 및 개별 종료.

## 8. 쿠키 및 헤더 설정
- 인증이 필요한 API는 `Authorization: Bearer <access_jwt>` 권장.
- CSRF 방지: `/auth/refresh` 전용 경로 + `SameSite=Strict` 쿠키 또는 Double Submit 토큰.
- CORS는 `credentials=true` 기반 허용 오리진 화이트리스트 적용.

## 9. UX 정책
- 자동 로그아웃 5분 전 토스트 알림 후 `/auth/refresh` 트리거.
- 새 디바이스 로그인 시 이메일/푸시 알림.
- 세션 관리 화면: 최근 로그인 시간, 위치(대략), 기기명, 종료 버튼 제공.

## 10. 감사, 로깅, 보존
- 로그인 성공/실패, RT 재사용 탐지, 세션 폐기, 중요 설정 변경을 로깅.
- 보관 기간: 보안 이벤트 1년, 일반 세션 로그 90일(규정에 따라 조정).
- 개인정보 최소화: IP는 해시 또는 부분 마스킹 저장.

## 11. 운영 레이트리밋
- `POST /auth/login`: IP 기준 5회/분, 계정 기준 10회/10분.
- `POST /auth/refresh`: 세션 기준 30회/시간(프론트 오작동 방지).

## 12. Next.js / NextAuth 구현 팁
- 전략: `session.strategy = "jwt"` + DB 세션 병행(RT 관리용 테이블 커스텀).
- JWT AT: `exp=15m`, `jti` 포함.
- 리프레시 플로우: NextAuth 콜백에서 `/auth/refresh` 커스텀 라우트 호출로 회전 처리.
- 쿠키: `cookies.sessionToken` 대신 RT 전용 Host 쿠키 사용.
- 예시: `/app/api/auth/refresh/route.ts`에서 RT 검증, 회전, 새 토큰 발급 후 Host 쿠키 세팅.

## 13. 어드민 전용 보안 강화
- MFA 필수, IP 화이트리스트 권장, 동시 세션 3대 이하로 제한.
- 민감 작업(정산 승인, 권한 변경) 시 Re-Auth 요구.

## 14. 이상 행위 대응
- RT 재사용 또는 지역 급변 시: 세션 폐기, 계정 잠금(옵션), 비밀번호 강제 변경 플로우, 사용자 알림, 보안 대시보드 티켓 생성.

---
본 가이드는 인증/보안 담당자가 분기별로 검토하며 변경 시 업데이트합니다.
