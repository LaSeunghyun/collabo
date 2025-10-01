# 인증 세션·토큰 운영 정책

콜라보리움의 웹/모바일 서비스 전반에서 일관된 인증 보안 수칙을 유지하기 위해 세션과 토큰 관리 정책을 정리했습니다. 앱/백오피스/SDK 구현 시 본 문서를 우선 검토하고 예외가 필요한 경우 보안 팀과 상의하세요.

## 1. 용어와 구성요소
- **Access Token (AT)**: 서버 API 호출 전용의 단기 토큰입니다. JWT 또는 불투명 토큰을 허용하되 기본은 JWT를 사용합니다.
- **Refresh Token (RT)**: AT 재발급 전용의 장기 토큰입니다. 모든 RT는 강제 회전(매 사용 시 1회용 소모)과 난수 기반 nonce를 적용합니다.
- **Session Record**: 서버 DB에서 사용자·디바이스·RT 상태를 추적하는 레코드로, 활성/폐기 플래그와 최근 사용 시각, IP/UA 지문을 유지합니다.
- **Device Trust**: "이 브라우저 기억하기" 옵션을 활성화한 디바이스에 대해 슬라이딩 만료를 완화하는 플래그입니다.

## 2. 기본 만료 시간
| 시나리오 | Access Token | Refresh Token 슬라이딩 만료(비활성 기준) | Refresh Token 절대 만료 |
| --- | --- | --- | --- |
| 일반 웹 | 15분 | 14일 | 60일 |
| Remember me (웹) | 15분 | 30일 | 90일 |
| 모바일 SDK | 15분 | 30일 | 180일 |
| 어드민(백오피스) | 10분 | 7일 | 30일 |

- 슬라이딩 만료는 RT로 재발급 시 `inactivity window`(14/30일)를 갱신하지만, 절대 만료(60/90/180일)는 갱신되지 않습니다.
- 웹 UI는 사용자 인터랙션이 12시간 동안 없으면 자동 로그아웃을 수행합니다.

## 3. 저장·전송 보안
- **웹**: AT는 메모리에만 저장합니다. RT는 `__Host-refresh_token` HttpOnly 쿠키에만 저장하며 `Secure`, `SameSite=Strict`, `Path=/auth`, Host-Only 속성을 지킵니다.
- **모바일/데스크톱**: RT는 iOS Keychain, Android Keystore 등 보안 스토리지에 저장합니다.
- **서버**: RT는 64바이트 이상의 난수 불투명 토큰을 생성하고 Argon2 또는 bcrypt로 해시하여 저장합니다. JWT는 AT에만 사용하며 RT는 서버 검증형 불투명 토큰으로 유지합니다.

## 4. 토큰 회전 및 도난 대응
- 모든 `/auth/refresh` 요청마다 기존 RT를 폐기하고 새 AT·RT를 발급합니다.
- 동일 RT가 재사용되면 즉시 세션을 폐기하고 사용자 알림을 발송합니다. 필요 시 최근 1시간 내 동일 디바이스의 활성 RT도 함께 폐기합니다.
- 동일 세션에서 /24 IP 대역이나 UA 지문이 급격히 변하면 재인증(MFA 또는 비밀번호)을 요구합니다. 어드민 세션은 항상 재인증을 요구합니다.

## 5. 만료·로그아웃·폐기 규칙
- 명시적 로그아웃은 해당 세션 RT를 폐기하고 쿠키를 제거합니다.
- 비밀번호 변경, 이메일 변경, MFA 활성화 등 보안 이벤트가 발생하면 기본적으로 모든 세션을 강제 로그아웃합니다.
- 계정 탈퇴나 정지 시 모든 세션과 RT를 폐기합니다.
- RT가 절대 만료에 도달하면 재발급을 거부하고 완전 재로그인을 요구합니다.

## 6. 백엔드 스키마 개요
```sql
sessions(
  id, user_id, device_id, created_at, last_used_at,
  ip_hash, ua_hash, remember, is_admin, revoked_at
)
refresh_tokens(
  id, session_id, token_hash, created_at, expires_at,
  used_at, rotated_to_id, revoked_at
)
token_blacklist(jti, expires_at) -- JWT AT에 jti를 사용 시 필요

devices(
  id, user_id, device_fingerprint,
  first_seen_at, last_seen_at, label
)
```
- 필수 인덱스: `refresh_tokens.session_id`, `refresh_tokens.token_hash UNIQUE`, `sessions.user_id`, `sessions.last_used_at`.

## 7. API 계약 요약
- **POST `/auth/login`**: 자격 증명 검증 → 세션 생성 → AT(15분)·RT 발급 → `__Host-refresh_token` 쿠키 세팅.
- **POST `/auth/refresh`**: 쿠키에서 RT 추출 → 미사용·미만료·미폐기 상태 확인 → 회전 → 새 AT·RT 발급 → 이전 RT의 `used_at` 기록.
- **POST `/auth/logout`**: 현재 세션의 RT와 세션을 폐기하고 쿠키 삭제.
- **POST `/auth/logout-all`**: 모든 세션 폐기(보안 이벤트·분실 디바이스 대응).
- **GET `/auth/sessions`**: 활성 디바이스/세션 목록 조회와 개별 종료 기능 제공.

## 8. 쿠키·헤더·CORS 설정
- 인증이 필요한 API 호출 시 `Authorization: Bearer <access_jwt>`를 사용합니다.
- CSRF 방지는 `/auth/refresh`를 전용 경로로 제한하고 `SameSite=Strict` 쿠키 또는 Double Submit 전략을 적용합니다.
- CORS는 `credentials=true`와 허용 오리진 화이트리스트를 사용합니다.

## 9. UX 정책
- 자동 로그아웃 5분 전 토스트 알림을 제공하고 사용자가 연장하면 `/auth/refresh`를 호출합니다.
- 새 디바이스 로그인 시 이메일 또는 푸시 알림을 발송합니다.
- 세션 관리 화면에 최근 로그인 시간, 대략적 위치, 기기 이름, 종료 버튼을 표시합니다.

## 10. 감사·로깅·보관
- 로그인 성공/실패, RT 재사용 감지, 세션 폐기, 중요 설정 변경을 로깅합니다.
- 보안 이벤트 로그는 1년, 일반 세션 로그는 90일간 보관합니다.
- 개인정보 최소화를 위해 IP는 해시 또는 부분 마스킹 형태로 저장합니다.

## 11. 운영 한계치·레이트리밋
- **POST `/auth/login`**: IP 기준 5회/분, 계정 기준 10회/10분.
- **POST `/auth/refresh`**: 세션 기준 30회/시간.

## 12. Next.js·NextAuth 구현 메모
- `session.strategy = "jwt"`를 유지하되 RT 관리는 커스텀 DB 테이블을 사용합니다.
- AT는 `exp=15m`, `jti` 포함 JWT로 발급합니다.
- `/app/api/auth/refresh/route.ts`에서 회전 로직을 구현하고 Host 쿠키 세팅 유틸을 제공합니다.
- 예시:
  ```ts
  export async function POST(req: NextRequest) {
    const rt = req.cookies.get('__Host-refresh_token')?.value;
    if (!rt) return NextResponse.json({ error: 'no rt' }, { status: 401 });
  
    const record = await findRT(rt); // token_hash 비교
    if (!record || record.used_at || record.revoked_at || isExpired(record)) {
      await revokeSession(record?.session_id);
      return NextResponse.json({ error: 'invalid rt' }, { status: 401 });
    }
  
    const session = await getSession(record.session_id);
    if (!session || session.revoked_at) return unauthorized();
  
    const newAT = signAccessJWT({ sub: session.user_id }, { expiresIn: '15m' });
    const newRT = await issueRotatedRT(session.id, record.id);
  
    return NextResponse.json({ access_token: newAT }, {
      status: 200,
      headers: {
        'Set-Cookie': buildHostRefreshCookie(newRT),
      },
    });
  }
  ```

## 13. 어드민(백오피스) 추가 규정
- MFA를 필수로 요구하고 회사 네트워크 등 제한된 IP 대역에서만 접속 가능하도록 권장합니다.
- 어드민 계정은 동시에 최대 3개의 디바이스에서만 세션을 유지할 수 있습니다.
- 정산 승인, 권한 변경 등 민감 작업 전에는 비밀번호 또는 MFA 재인증을 요청합니다.

## 14. 데이터 유출 및 의심 행위 대응
- RT 재사용 또는 지역 급변을 감지하면 해당 세션을 폐기하고 필요 시 계정을 잠급니다.
- 사용자가 비밀번호를 강제로 재설정하도록 안내하고 보안 대시보드에 자동 티켓을 생성합니다.
- 사용자에게 즉시 알림을 발송하여 추가 대응을 유도합니다.

---

본 정책은 보안 위협 동향에 따라 주기적으로 업데이트됩니다. 변경 시 제품·인프라·CX 팀에 공지하고 릴리즈 노트를 남기세요.
