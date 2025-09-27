# Prisma Ground Rules

## 1. Import 패턴 표준화

### ✅ 올바른 패턴
```typescript
// 1. Prisma Client import
import { PrismaClient } from '@prisma/client';

// 2. Prisma 타입들 import
import { UserRole, ProjectStatus, Prisma } from '@prisma/client';

// 3. 공유 타입 정의
export type ProjectSummary = Prisma.ProjectGetPayload<{
  include: { owner: true; _count: { select: { fundings: true } } }
}>;
```

### ❌ 피해야 할 패턴
```typescript
// 잘못된 re-export
export { UserRole } from '@prisma/client';
export type { User } from '@prisma/client';

// 잘못된 namespace 사용
Prisma.ProjectGetPayload<...>
```

## 2. 타입 정의 원칙

### 2.1 Prisma 타입 직접 사용
- `Prisma.ProjectGetPayload<>` 사용
- `Prisma.TransactionClient` 사용
- `Prisma.InputJsonValue` 사용

### 2.2 공유 타입 정의
- API 응답용 타입은 별도 정의
- Enum은 직접 import하여 사용
- 복잡한 타입은 Prisma namespace 활용

## 3. 파일 구조

```
types/
  prisma.ts          # Prisma 타입 re-export (최소한)
lib/
  prisma.ts          # PrismaClient 인스턴스
  server/            # 서버 로직
    projects.ts      # 프로젝트 관련
    partners.ts      # 파트너 관련
    settlements.ts   # 정산 관련
```

## 4. 컴포넌트 Export 패턴

### ✅ 올바른 패턴
```typescript
// 컴포넌트 파일
export function ProjectCard() { ... }

// index.ts
export { ProjectCard } from './project-card';
```

### ❌ 피해야 할 패턴
```typescript
// default export 사용
export default function ProjectCard() { ... }
```

## 5. 테스트 원칙

### 5.1 타입 안전성
- 모든 타입이 올바르게 정의되었는지 확인
- Prisma 타입과 일치하는지 검증

### 5.2 컴포넌트 테스트
- Props 타입이 정확한지 확인
- Export/Import가 올바른지 검증

## 6. 에러 해결 체크리스트

1. **Import 에러**: `@prisma/client`에서 직접 import
2. **타입 에러**: Prisma namespace 사용
3. **Export 에러**: named export 사용
4. **테스트 에러**: 타입 정의 확인

## 7. 실행 순서

1. Prisma Ground Rules 문서 생성 ✅
2. Prisma import 패턴 표준화
3. 타입 정의 정리 및 수정
4. 컴포넌트 export 문제 해결
5. 테스트 실행 및 검증