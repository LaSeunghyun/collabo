# 🚀 Vercel + Supabase 배포 가이드

## 📋 배포 전 준비사항

### 1. Supabase 프로젝트 설정
1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속
2. 프로젝트 선택
3. **Settings** → **Database** → **Connection string**에서 올바른 연결 문자열 확인
4. **Settings** → **API**에서 API 키들 확인

### 2. Vercel 프로젝트 설정
1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속
2. **New Project** 클릭
3. GitHub 저장소 연결
4. 환경변수 설정 (아래 참조)

## 🔧 환경변수 설정

Vercel 대시보드에서 다음 환경변수들을 설정하세요:

### 필수 환경변수
```
DATABASE_URL=postgresql://postgres.tsdnwdwcwnqygyepojaq:YGRA5XVPxEf95v26@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://tsdnwdwcwnqygyepojaq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZG53ZHdjd25xeWd5ZXBvamFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTUyMzksImV4cCI6MjA3NDI5MTIzOX0.3MtQ-LHueC_MAy8g9FmzghcKdOHknu-EtRsnbIvdzlQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZG53ZHdjd25xeWd5ZXBvamFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcxNTIzOSwiZXhwIjoyMDc0MjkxMjM5fQ.YjSQaiK1UnQ_EWgdkdu3FVd4niwMi0X2F6WPFQ3xjck
```

### 선택적 환경변수 (OAuth)
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
```

## 🗄️ 데이터베이스 설정

### 1. Supabase에서 스키마 생성
프로덕션 데이터베이스에 Prisma 마이그레이션을 적용하세요:

```bash
npx prisma migrate deploy
```

Vercel 빌드에서도 동일한 명령이 실행되도록 `package.json`과 `vercel.json`의 빌드 커맨드에는 `prisma migrate deploy`가 포함되어 있습니다. 최초 1회는 로컬이나 CI에서 위 명령을 직접 실행해 누락된 테이블이 없는지 확인하세요.

### 2. 테스트 계정 생성
배포 후 다음 API를 호출하여 테스트 계정을 생성하세요:

```bash
POST https://your-app.vercel.app/api/test-accounts
```

생성되는 계정:
- **관리자**: admin@collabo.com / 1234
- **팬**: fan@collabo.com / 1234  
- **파트너**: partner@collabo.com / 1234

## 🚀 배포 과정

### 1. Git에 푸시
```bash
git add .
git commit -m "feat: setup Vercel + Supabase deployment"
git push origin main
```

### 2. Vercel 자동 배포
- Vercel이 자동으로 빌드 및 배포를 시작합니다
- 빌드 로그에서 오류가 없는지 확인하세요

### 3. 환경변수 확인
- Vercel 대시보드에서 모든 환경변수가 올바르게 설정되었는지 확인
- 특히 `DATABASE_URL`이 올바른지 확인

## 🔍 문제 해결

### 데이터베이스 연결 오류
1. Supabase 프로젝트가 활성화되어 있는지 확인
2. 연결 문자열이 올바른지 확인
3. 방화벽 설정 확인

### 빌드 오류
1. `package.json`의 의존성 확인
2. Node.js 버전 확인 (18.x 권장)
3. Prisma 클라이언트 생성 확인

### 인증 오류
1. `NEXTAUTH_SECRET`이 설정되어 있는지 확인
2. `NEXTAUTH_URL`이 올바른 도메인인지 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. Vercel 빌드 로그
2. Supabase 연결 상태
3. 환경변수 설정
4. 브라우저 콘솔 오류
