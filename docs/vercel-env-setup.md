# Vercel 환경 변수 설정 가이드

## 문제 상황

Vercel 배포 환경에서 다음과 같은 JWT 복호화 오류가 발생할 수 있습니다:

```
[next-auth][error][JWT_SESSION_ERROR] decryption operation failed
```

이는 `NEXTAUTH_SECRET` 환경 변수가 Vercel에 설정되지 않았거나, 로컬과 다른 값으로 설정되어 있을 때 발생합니다.

## 해결 방법

### 1. NEXTAUTH_SECRET 생성

터미널에서 다음 명령어를 실행하여 새로운 시크릿을 생성하세요:

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

생성된 시크릿을 복사해두세요. (예: `M9xWXgY3O+wgaxZQZpJGuXurRymDbzt3ntvEu03fehE=`)

### 2. Vercel 대시보드에서 환경 변수 설정

1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속
2. 프로젝트 선택
3. **Settings** 탭 클릭
4. **Environment Variables** 섹션으로 이동
5. **Add New** 버튼 클릭

#### 필수 환경 변수 설정

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `NEXTAUTH_SECRET` | 생성한 시크릿 값 | JWT 토큰 암호화/복호화에 사용 |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | 프로덕션 도메인 (선택사항) |

#### 환경별 설정

각 환경 변수에 대해 다음 환경들을 선택하세요:
- ✅ **Production** (프로덕션)
- ✅ **Preview** (프리뷰/브랜치 배포)
- ✅ **Development** (개발)

### 3. 설정 예시

```
NEXTAUTH_SECRET=M9xWXgY3O+wgaxZQZpJGuXurRymDbzt3ntvEu03fehE=
NEXTAUTH_URL=https://artist-funding-platform.vercel.app
```

### 4. 재배포

환경 변수 설정 후:

1. **Redeploy** 버튼을 클릭하여 수동 재배포
2. 또는 새로운 커밋을 푸시하여 자동 재배포

### 5. 확인 방법

재배포 후 다음을 확인하세요:

1. **Vercel Function Logs**에서 JWT 관련 에러가 사라졌는지 확인
2. 로그인/로그아웃이 정상 작동하는지 확인
3. `/api/auth/session` 엔드포인트가 정상 응답하는지 확인

## 추가 설정 (선택사항)

### AUTH_JWT_SECRET 설정

더 세밀한 JWT 제어를 위해 `AUTH_JWT_SECRET`을 별도로 설정할 수 있습니다:

```
AUTH_JWT_SECRET=your-custom-jwt-secret-here
```

이 경우 `AUTH_JWT_SECRET`이 `NEXTAUTH_SECRET`보다 우선적으로 사용됩니다.

### 환경별 다른 시크릿 사용

보안을 위해 환경별로 다른 시크릿을 사용할 수 있습니다:

- **Production**: 강력한 프로덕션 시크릿
- **Preview**: 테스트용 시크릿
- **Development**: 개발용 시크릿

## 문제 해결

### 여전히 JWT 오류가 발생하는 경우

1. **환경 변수 확인**
   ```bash
   # Vercel CLI로 확인
   vercel env ls
   ```

2. **캐시 클리어**
   - Vercel 대시보드에서 **Redeploy** 실행
   - 브라우저 캐시 및 쿠키 삭제

3. **시크릿 재생성**
   - 새로운 시크릿 생성
   - 기존 시크릿 삭제 후 새로 설정

4. **로그 확인**
   - Vercel Function Logs에서 상세 에러 메시지 확인
   - 브라우저 개발자 도구 Network 탭에서 API 응답 확인

### 일반적인 실수

- ❌ 시크릿에 공백이나 특수문자 포함
- ❌ 환경 변수 이름 오타 (`NEXTAUTH_SECRET` vs `NEXTAUTH_SECRETS`)
- ❌ 값에 따옴표 포함 (`"secret"` 대신 `secret`)
- ❌ 환경별 설정 누락 (Production만 설정하고 Preview 누락)

## 보안 주의사항

- 🔒 시크릿은 절대 코드에 하드코딩하지 마세요
- 🔒 시크릿은 최소 32자 이상 사용하세요
- 🔒 정기적으로 시크릿을 교체하세요
- 🔒 프로덕션과 개발 환경의 시크릿을 분리하세요

## 관련 문서

- [NextAuth.js Environment Variables](https://next-auth.js.org/configuration/options#environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
