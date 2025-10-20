# 데이터베이스 스키마 변경 가이드

## 개요

이 문서는 Artist Funding Collaboration Platform에서 데이터베이스 스키마를 안전하게 변경하는 방법을 설명합니다.

## 변경 프로세스

### 1. 스키마 파일 수정

스키마 변경은 다음 파일들에서 수행합니다:

- **테이블 정의**: `lib/db/schema/tables.ts`
- **ENUM 정의**: `lib/db/schema/enums.ts`
- **관계 정의**: `lib/db/schema/tables.ts` (하단의 relations 함수들)

### 2. 타입 파일 업데이트

스키마 변경 후 다음 파일을 업데이트합니다:

- **데이터베이스 타입**: `types/database.ts`

```typescript
// 예시: 새 테이블 추가 시
export type NewTable = InferSelectModel<typeof newTable>;
export type InsertNewTable = InferInsertModel<typeof newTable>;
```

### 3. 마이그레이션 생성

```bash
npm run db:drizzle:generate
```

생성된 마이그레이션 파일을 확인하고 필요시 수정합니다.

### 4. 로컬 DB에 적용

```bash
npm run db:drizzle:push
```

### 5. 테스트 실행

```bash
# 스모크 테스트
npm run test:smoke

# 전체 테스트
npm test

# 마이그레이션 검증
npm run db:verify-migrations
```

### 6. 문서 업데이트

- `CHANGELOG.md`에 변경사항 기록
- 관련 API 문서 업데이트

## 마이그레이션 파일 명명 규칙

마이그레이션 파일은 다음 형식을 따릅니다:

```
000X_descriptive_name.sql
```

예시:
- `0005_add_user_preferences_table.sql`
- `0006_add_post_status_enum.sql`
- `0007_add_performance_indexes.sql`

## 타입 안전성 보장

### 1. 쿼리 빌더 래퍼 함수 사용

직접 Drizzle 쿼리를 작성하는 대신, `lib/db/queries/` 디렉토리의 래퍼 함수를 사용합니다.

```typescript
// ❌ 직접 쿼리 작성
const posts = await db.select().from(posts).where(eq(posts.status, 'PUBLISHED'));

// ✅ 래퍼 함수 사용
const posts = await getPublishedPosts(10);
```

### 2. 타입 추출 활용

데이터베이스 타입은 `types/database.ts`에서 가져옵니다:

```typescript
import type { Post, InsertPost, PostWithAuthor } from '@/types/database';
```

### 3. 엄격한 타입 체크

`tsconfig.json`에서 엄격한 타입 체크가 활성화되어 있습니다:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

## 서버/클라이언트 계층 분리

### 서버 전용 코드

- **위치**: `lib/server/`, `lib/db/queries/`
- **용도**: 서버 컴포넌트, API 라우트에서 사용
- **특징**: 직접 DB 접근, 타입 안전성 보장

### 클라이언트 전용 코드

- **위치**: `lib/api/`
- **용도**: 클라이언트 컴포넌트에서 사용
- **특징**: fetch를 통한 API 호출

### 공유 코드

- **위치**: `types/`, `lib/constants/`
- **용도**: 서버와 클라이언트 모두에서 사용
- **특징**: 타입 정의, 상수, 유틸리티 함수

## 검증 체크리스트

### PR 생성 전 체크리스트

- [ ] 스키마 변경 시 마이그레이션 파일 포함
- [ ] 새 테이블/컬럼에 대한 타입 정의 추가
- [ ] 관련 쿼리 함수 업데이트
- [ ] 테스트 추가/업데이트
- [ ] 문서 업데이트 (CHANGELOG.md)
- [ ] 타입 오류 0개
- [ ] 린트 오류 0개

### 코드 리뷰 체크리스트

- [ ] 마이그레이션 파일이 순차적 번호를 가지는가?
- [ ] up/down 로직이 모두 작성되었는가?
- [ ] 타입 정의가 업데이트되었는가?
- [ ] 관련 쿼리가 모두 수정되었는가?
- [ ] 기존 데이터 마이그레이션 전략이 있는가?
- [ ] 테스트가 추가/수정되었는가?
- [ ] 서버/클라이언트 계층이 올바르게 분리되었는가?

## 자주 발생하는 문제와 해결책

### 1. 마이그레이션 번호 중복

**문제**: `0003_add_indexes.sql`과 `0003_add_tables.sql` 같은 중복 번호

**해결**: 마이그레이션 파일을 수동으로 리네이밍하고 `_journal.json` 업데이트

### 2. 타입 오류

**문제**: 스키마 변경 후 타입 오류 발생

**해결**: 
1. `npm run db:drizzle:generate` 실행
2. `types/database.ts` 업데이트
3. 관련 쿼리 함수 수정

### 3. 서버/클라이언트 경계 오류

**문제**: 클라이언트에서 서버 전용 모듈 import

**해결**: 
1. 서버 전용 코드를 `lib/server/`로 이동
2. 클라이언트용 API 함수를 `lib/api/`에 생성
3. ESLint 규칙으로 방지

### 4. 스키마 드리프트

**문제**: 코드 스키마와 실제 DB 스키마 불일치

**해결**: 
1. `npm run db:verify-migrations` 실행
2. `npm run db:check-schema` 실행
3. 차이점 분석 후 수정

## 모니터링

### 정기 점검

- **주간**: 스키마 드리프트 체크
- **월간**: 미사용 테이블/컬럼 정리
- **분기**: 인덱스 최적화 리뷰

### 알람 설정

```yaml
메트릭:
  - schema_drift_count: 스키마 불일치 횟수
  - migration_failure_rate: 마이그레이션 실패율
  - type_error_count: TypeScript 타입 오류 수

알람:
  - schema_drift > 0: 즉시 알람
  - migration_failure: 크리티컬 알람
  - type_error_count > 10: 경고
```

## 롤백 전략

### 1. 마이그레이션 롤백

```bash
# 특정 마이그레이션까지 롤백
npm run db:rollback -- --to 0005

# 모든 마이그레이션 롤백
npm run db:rollback -- --to 0000
```

### 2. 코드 롤백

```bash
# 이전 커밋으로 되돌리기
git revert <commit-hash>

# 특정 파일만 되돌리기
git checkout <commit-hash> -- lib/db/schema/tables.ts
```

### 3. 데이터 복구

중요한 데이터 변경 시에는 백업을 생성하고 롤백 계획을 수립합니다.

## 추가 리소스

- [Drizzle ORM 문서](https://orm.drizzle.team/)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [TypeScript 엄격 모드](https://www.typescriptlang.org/tsconfig#strict)
