# Prisma 개선 가이드

## 📊 현재 상태 분석

### ✅ 잘 구현된 부분
1. **완전한 Prisma 도입**: 모든 API 라우트에서 Prisma 사용
2. **타입 안전성**: Prisma 생성 타입 활용
3. **스키마 설계**: 잘 구조화된 관계형 데이터 모델
4. **에러 처리**: try-catch 패턴으로 안정성 확보

### 🔧 개선이 필요한 부분
1. **일관성 없는 import 패턴**
2. **에러 처리 표준화 부족**
3. **쿼리 최적화 여지**
4. **타입 정의 중복**

## 🚀 개선 계획

### 1. Import 패턴 표준화

#### 현재 문제점
```typescript
// app/api/community/route.ts
import prisma from '@/lib/prisma'; // ❌ default import

// lib/server/projects.ts  
import { prisma } from '@/lib/prisma'; // ❌ named import
```

#### 개선 방안
```typescript
// lib/prisma.ts - 표준화된 export
export { prisma } from './prisma';
export type { Prisma } from '@prisma/client';

// 모든 파일에서 일관된 import
import { prisma } from '@/lib/prisma';
```

### 2. 에러 처리 표준화

#### 현재 문제점
```typescript
// 각 API마다 다른 에러 처리 패턴
try {
  const data = await prisma.post.findMany();
  return NextResponse.json(data);
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json({ error: 'Failed' }, { status: 500 });
}
```

#### 개선 방안
```typescript
// lib/server/error-handling.ts
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export async function handleDatabaseOperation<T>(
  operation: () => Promise<T>
): Promise<{ data?: T; error?: string; status?: number }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return { error: '중복된 데이터입니다.', status: 409 };
        case 'P2003':
          return { error: '관련 데이터를 찾을 수 없습니다.', status: 404 };
        case 'P2025':
          return { error: '레코드를 찾을 수 없습니다.', status: 404 };
        default:
          return { error: '데이터베이스 오류가 발생했습니다.', status: 500 };
      }
    }
    
    console.error('Unexpected error:', error);
    return { error: '서버 오류가 발생했습니다.', status: 500 };
  }
}
```

### 3. 쿼리 최적화

#### 현재 문제점
```typescript
// N+1 쿼리 문제 가능성
const posts = await prisma.post.findMany({
  include: {
    author: true, // 모든 post에 대해 author 조회
    comments: true // 모든 post에 대해 comments 조회
  }
});
```

#### 개선 방안
```typescript
// 필요한 필드만 선택
const posts = await prisma.post.findMany({
  select: {
    id: true,
    title: true,
    content: true,
    createdAt: true,
    author: {
      select: {
        id: true,
        name: true,
        avatarUrl: true
      }
    },
    _count: {
      select: {
        comments: true,
        likes: true
      }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 20
});
```

### 4. 타입 정의 중앙화

#### 현재 문제점
```typescript
// 각 API마다 중복된 타입 정의
type PostResponse = {
  id: string;
  title: string;
  content: string;
  // ...
};
```

#### 개선 방안
```typescript
// types/api.ts
export type PostResponse = Prisma.PostGetPayload<{
  select: {
    id: true;
    title: true;
    content: true;
    createdAt: true;
    author: {
      select: {
        id: true;
        name: true;
        avatarUrl: true;
      };
    };
    _count: {
      select: {
        comments: true;
        likes: true;
      };
    };
  };
}>;

export type ProjectSummary = Prisma.ProjectGetPayload<{
  include: {
    owner: {
      select: {
        id: true;
        name: true;
        avatarUrl: true;
      };
    };
    _count: {
      select: {
        fundings: true;
      };
    };
  };
}>;
```

## 🔧 구체적인 개선 작업

### 1. Prisma 클라이언트 설정 개선

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL + (process.env.NODE_ENV === 'production' 
          ? '?connection_limit=5&pool_timeout=20' 
          : '')
      }
    }
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 타입 재export
export type { Prisma } from '@prisma/client';
export type { User, Project, Funding, Settlement } from '@prisma/client';
```

### 2. API 라우트 표준화

```typescript
// app/api/community/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseOperation } from '@/lib/server/error-handling';
import type { PostResponse } from '@/types/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') === 'popular' ? 'popular' : 'recent';
  const projectId = searchParams.get('projectId') ?? undefined;

  const result = await handleDatabaseOperation(async () => {
    return await prisma.post.findMany({
      where: projectId ? { projectId } : undefined,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: sort === 'popular' 
        ? { likes: { _count: 'desc' } }
        : { createdAt: 'desc' }
    });
  });

  if (result.error) {
    return NextResponse.json(
      { message: result.error }, 
      { status: result.status ?? 500 }
    );
  }

  const posts: PostResponse[] = result.data!.map(post => ({
    ...post,
    liked: false // TODO: 사용자별 좋아요 상태 확인
  }));

  return NextResponse.json(posts);
}
```

### 3. 서버 액션 개선

```typescript
// lib/server/projects.ts
import { revalidatePath } from 'next/cache';
import { Prisma, ProjectStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { handleDatabaseOperation } from '@/lib/server/error-handling';
import type { ProjectSummary } from '@/types/api';

export async function getProjects(options?: { ownerId?: string }): Promise<{
  data?: ProjectSummary[];
  error?: string;
}> {
  return await handleDatabaseOperation(async () => {
    return await prisma.project.findMany({
      where: options?.ownerId ? { ownerId: options.ownerId } : undefined,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        _count: {
          select: {
            fundings: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  });
}

export async function createProject(data: CreateProjectInput): Promise<{
  data?: ProjectSummary;
  error?: string;
}> {
  return await handleDatabaseOperation(async () => {
    return await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          ...data,
          status: ProjectStatus.DRAFT,
          currentAmount: 0
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          },
          _count: {
            select: {
              fundings: true
            }
          }
        }
      });

      // 관련 데이터 생성 (마일스톤, 리워드 티어 등)
      if (data.milestones) {
        await tx.projectMilestone.createMany({
          data: data.milestones.map((milestone, index) => ({
            projectId: project.id,
            title: milestone.title,
            description: milestone.description,
            dueDate: milestone.dueDate,
            order: index
          }))
        });
      }

      return project;
    });
  });
}
```

### 4. 테스트 개선

```typescript
// __tests__/api/community.test.ts
import { GET, POST } from '@/app/api/community/route';
import { prisma } from '@/lib/prisma';

// Prisma 모킹
jest.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      findMany: jest.fn(),
      create: jest.fn()
    }
  }
}));

describe('/api/community', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return posts with correct structure', async () => {
    const mockPosts = [
      {
        id: '1',
        title: 'Test Post',
        content: 'Test Content',
        createdAt: new Date(),
        author: {
          id: '1',
          name: 'Test User',
          avatarUrl: null
        },
        _count: {
          likes: 5,
          comments: 3
        }
      }
    ];

    (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

    const request = new Request('http://localhost:3000/api/community');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      id: '1',
      title: 'Test Post',
      content: 'Test Content',
      liked: false
    });
  });
});
```

## 📋 개선 체크리스트

### Phase 1: 기반 개선
- [ ] Prisma 클라이언트 설정 표준화
- [ ] 에러 처리 유틸리티 구현
- [ ] 타입 정의 중앙화
- [ ] Import 패턴 통일

### Phase 2: API 라우트 개선
- [ ] `/api/community` 라우트 리팩토링
- [ ] `/api/projects` 라우트 리팩토링
- [ ] `/api/funding` 라우트 리팩토링
- [ ] `/api/settlement` 라우트 리팩토링
- [ ] `/api/partners` 라우트 리팩토링

### Phase 3: 서버 액션 개선
- [ ] 프로젝트 관련 액션 리팩토링
- [ ] 펀딩 관련 액션 리팩토링
- [ ] 정산 관련 액션 리팩토링
- [ ] 파트너 관련 액션 리팩토링

### Phase 4: 테스트 및 최적화
- [ ] 단위 테스트 업데이트
- [ ] 통합 테스트 개선
- [ ] 성능 테스트 추가
- [ ] 쿼리 최적화 검증

## 🎯 예상 효과

1. **개발 생산성 향상**: 일관된 패턴으로 개발 속도 증가
2. **코드 품질 개선**: 타입 안전성과 에러 처리 강화
3. **성능 최적화**: 효율적인 쿼리로 응답 시간 단축
4. **유지보수성 향상**: 표준화된 코드로 디버깅과 수정 용이

---

**마지막 업데이트**: 2024년 12월 19일  
**버전**: 1.0.0  
**작성자**: AI Assistant
