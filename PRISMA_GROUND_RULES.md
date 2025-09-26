# Prisma 도입 그라운드 룰

## 📋 개요
이 문서는 Artist Funding Collaboration Platform에서 Prisma ORM을 효과적으로 도입하고 사용하기 위한 개발 가이드라인입니다.

## 🎯 목표
- **타입 안전성**: 컴파일 타임에 데이터베이스 쿼리 오류 방지
- **개발 생산성**: 자동 완성과 IntelliSense를 통한 빠른 개발
- **데이터 일관성**: 스키마 기반 데이터 검증 및 관계 관리
- **성능 최적화**: 효율적인 쿼리 생성 및 연결 풀링

## 🏗️ 현재 아키텍처 상태

### ✅ 이미 구현된 부분
- **Prisma Client**: `@prisma/client` v5.20.0 설치됨
- **PostgreSQL**: 데이터베이스 프로바이더로 설정됨
- **스키마 정의**: 완전한 데이터 모델 정의 (User, Project, Funding, Settlement 등)
- **연결 설정**: `lib/prisma.ts`에서 싱글톤 패턴으로 구현
- **NextAuth 통합**: `@next-auth/prisma-adapter` 설정됨

### 🔄 마이그레이션 필요 부분
- **API 라우트**: 기존 Mongoose 쿼리를 Prisma로 전환
- **서버 액션**: 데이터베이스 접근 로직 업데이트
- **타입 정의**: Prisma 생성 타입 활용

## 📝 개발 가이드라인

### 1. 데이터베이스 접근 패턴

#### ✅ 올바른 방법
```typescript
// lib/prisma.ts에서 싱글톤 인스턴스 사용
import { prisma } from '@/lib/prisma';

export async function getProject(id: string) {
  return await prisma.project.findUnique({
    where: { id },
    include: {
      owner: true,
      fundings: true,
      settlements: true
    }
  });
}
```

#### ❌ 피해야 할 방법
```typescript
// 매번 새로운 PrismaClient 인스턴스 생성 금지
const prisma = new PrismaClient(); // ❌
```

### 2. 쿼리 최적화 원칙

#### Include vs Select 사용
```typescript
// ✅ 필요한 필드만 선택 (성능 최적화)
const project = await prisma.project.findUnique({
  where: { id },
  select: {
    id: true,
    title: true,
    currentAmount: true,
    owner: {
      select: { name: true, email: true }
    }
  }
});

// ✅ 관계 데이터가 필요한 경우
const projectWithFundings = await prisma.project.findUnique({
  where: { id },
  include: {
    fundings: {
      where: { paymentStatus: 'SUCCEEDED' }
    }
  }
});
```

#### 트랜잭션 사용
```typescript
// ✅ 복잡한 비즈니스 로직은 트랜잭션으로 처리
export async function createFundingWithSettlement(data: FundingData) {
  return await prisma.$transaction(async (tx) => {
    const funding = await tx.funding.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        amount: data.amount,
        paymentStatus: 'SUCCEEDED'
      }
    });

    await tx.project.update({
      where: { id: data.projectId },
      data: {
        currentAmount: {
          increment: data.amount
        }
      }
    });

    return funding;
  });
}
```

### 3. 에러 처리 패턴

```typescript
import { Prisma } from '@prisma/client';

export async function safeDatabaseOperation<T>(
  operation: () => Promise<T>
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // 고유 제약 조건 위반
      if (error.code === 'P2002') {
        return { error: '이미 존재하는 데이터입니다.' };
      }
      // 외래 키 제약 조건 위반
      if (error.code === 'P2003') {
        return { error: '관련 데이터를 찾을 수 없습니다.' };
      }
    }
    
    console.error('Database error:', error);
    return { error: '데이터베이스 오류가 발생했습니다.' };
  }
}
```

### 4. 타입 안전성 보장

#### Prisma 생성 타입 활용
```typescript
import { Prisma, Project, User } from '@prisma/client';

// ✅ Prisma 생성 타입 사용
type ProjectWithOwner = Prisma.ProjectGetPayload<{
  include: { owner: true }
}>;

type CreateProjectInput = Prisma.ProjectCreateInput;
type UpdateProjectInput = Prisma.ProjectUpdateInput;
```

#### API 응답 타입 정의
```typescript
// ✅ API 응답용 타입 정의
export type ProjectResponse = {
  id: string;
  title: string;
  description: string;
  currentAmount: number;
  targetAmount: number;
  status: ProjectStatus;
  owner: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
};
```

### 5. 환경별 설정

#### 개발 환경
```typescript
// lib/prisma.ts
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  errorFormat: 'pretty'
});
```

#### 프로덕션 환경
```typescript
// lib/prisma.ts
export const prisma = new PrismaClient({
  log: ['error'],
  errorFormat: 'minimal'
});
```

### 6. 마이그레이션 관리

#### 스키마 변경 시
```bash
# 1. 스키마 수정 후
npx prisma migrate dev --name "add_new_field"

# 2. 타입 재생성
npx prisma generate

# 3. 시드 데이터 업데이트 (필요시)
npx ts-node --esm prisma/seed.ts
```

#### 프로덕션 배포 시
```bash
# 1. 마이그레이션 적용
npx prisma migrate deploy

# 2. 타입 재생성
npx prisma generate
```

## 🔧 성능 최적화 팁

### 1. 연결 풀 설정
```typescript
// lib/prisma.ts
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=5&pool_timeout=20"
    }
  }
});
```

### 2. 쿼리 최적화
```typescript
// ✅ 인덱스 활용
const projects = await prisma.project.findMany({
  where: {
    status: 'LIVE',
    category: 'MUSIC'
  },
  orderBy: { createdAt: 'desc' },
  take: 20
});

// ✅ 페이지네이션
const projects = await prisma.project.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
});
```

### 3. 배치 작업
```typescript
// ✅ 여러 레코드 한 번에 생성
const fundings = await prisma.funding.createMany({
  data: fundingDataArray,
  skipDuplicates: true
});
```

## 🧪 테스트 전략

### 1. 테스트 데이터베이스 설정
```typescript
// jest.setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL
    }
  }
});

beforeEach(async () => {
  // 테스트 데이터 정리
  await prisma.funding.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
});
```

### 2. 모킹 전략
```typescript
// __mocks__/prisma.ts
export const prisma = {
  project: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
};
```

## 📊 모니터링 및 로깅

### 1. 쿼리 로깅
```typescript
// lib/prisma.ts
export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' }
  ]
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});
```

### 2. 성능 메트릭
```typescript
// lib/performance.ts
export async function withPerformanceLogging<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const start = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - start;
    console.log(`${operationName} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`${operationName} failed after ${duration}ms:`, error);
    throw error;
  }
}
```

## 🚀 마이그레이션 체크리스트

### Phase 1: 기반 설정 ✅
- [x] Prisma Client 설치 및 설정
- [x] PostgreSQL 연결 구성
- [x] 스키마 정의 완료
- [x] NextAuth 통합

### Phase 2: API 라우트 마이그레이션
- [ ] `/api/projects` 라우트 전환
- [ ] `/api/funding` 라우트 전환
- [ ] `/api/settlement` 라우트 전환
- [ ] `/api/partners` 라우트 전환
- [ ] `/api/community` 라우트 전환

### Phase 3: 서버 액션 업데이트
- [ ] 프로젝트 생성/수정 로직
- [ ] 펀딩 처리 로직
- [ ] 정산 계산 로직
- [ ] 파트너 매칭 로직

### Phase 4: 테스트 및 최적화
- [ ] 단위 테스트 업데이트
- [ ] 통합 테스트 작성
- [ ] 성능 테스트
- [ ] 에러 처리 검증

## 📚 참고 자료

- [Prisma 공식 문서](https://www.prisma.io/docs)
- [Next.js + Prisma 가이드](https://www.prisma.io/docs/guides/other/tutorials/nextjs)
- [PostgreSQL 최적화](https://www.postgresql.org/docs/current/performance-tips.html)

---

**마지막 업데이트**: 2024년 12월 19일  
**버전**: 1.0.0  
**작성자**: AI Assistant
