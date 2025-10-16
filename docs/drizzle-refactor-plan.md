# Drizzle 기반 타입 오류 점검 및 수정 계획

## 1. 배경 요약
- 기존 Prisma 스타일 API 호출을 Drizzle로 옮기는 과정에서 `lib/drizzle.ts`가 `getDb` 프록시를 노출하도록 바뀌었지만, 다수의 API 라우트에서 여전히 `drizzle.user.findUnique` 같은 Prisma 패턴을 사용하고 있음.
- 이로 인해 `Property 'userPermission' does not exist on type '() => Promise<...>>`와 같은 타입 오류가 발생하며, 런타임에서도 즉시 실패할 가능성이 큼.
- 날짜 처리 유틸(`lib/server/announcements.ts`)에서는 문자열/Date 혼합 타입을 그대로 전달하여 `string`이 허용되지 않는 함수에 그대로 넘어가는 TS 오류가 보고됨.
- `npm run lint` 결과 다수의 미사용 import 및 아직 Prisma 마이그레이션이 끝나지 않은 TODO 구간이 확인됨. 본 문서는 우선적으로 치명적인 타입 오류부터 해결하기 위한 단계별 계획을 정리함.

## 2. 발견된 대표 문제 영역
### 2.1 Drizzle 클라이언트 사용 방식 오류
- `app/api/users/[id]/permissions/route.ts`
- `app/api/users/[id]/route.ts`
- `app/api/users/search/route.ts`
- `app/api/wallet/route.ts`
- 위 파일들은 `import { drizzle } from '@/lib/drizzle'`를 통해 함수(`() => Promise<DatabaseClient>`)를 받아놓고도 Prisma 식 메서드(`findMany`, `create`, `update` 등)를 직접 호출하고 있어 타입/런타임 오류를 유발함.

### 2.2 공통 목록/페이지 API의 DB 핸들러 미구현
- `app/api/products/route.ts`
- `app/api/payments/route.ts`
- `app/api/permissions/route.ts`
- `app/api/community/route.ts`
- 위 모듈들은 `const db = await getDb()` 호출이 누락되어 있으며, 일부는 아직 Prisma 시절 가짜 데이터/ TODO 로직만 존재. 우선 컴파일 오류 제거를 위해 올바른 Drizzle 쿼리 스켈레톤을 구축해야 함.

### 2.3 날짜 유틸 타입 편차
- `lib/server/announcements.ts` 의 `resolvePublishedAt` 함수가 `string | Date | null`을 받아 그대로 `new Date(publishedAt)`에 전달하면서, 상위 호출부에서 `Date | number`만 허용되는 API에 다시 넘길 때 타입 경고가 발생. 입력을 명확히 좁혀 반환 타입을 `Date`로 고정할 필요가 있음.

### 2.4 보조 이슈
- 린트 로그에 따라 `eq`, `and`, `count`, `desc` 등 미사용 import가 다수 존재하며, 이는 Drizzle 쿼리 구현이 완료되면 자연스럽게 정리되거나 `eslint-disable` 대신 실제 사용 코드를 작성해야 함.

## 3. 수정 전략
### 3.1 Drizzle 접근 공통화
1. `lib/drizzle.ts` 혹은 각 API 라우트에서 `const db = await getDb();` 패턴을 확립하고, 이후 모든 테이블 접근을 `db.query.<table>` 또는 체이닝(`db.select().from(...)`)으로 변환.
2. 필요한 테이블/관계는 `import { users, userPermissions, permissions, wallets, ... } from '@/lib/db/schema';` 형태로 직접 끌어와 사용.
3. 반복되는 권한 체크/조인 로직은 후속 단계에서 전용 서비스 모듈(`lib/services/*`)로 분리 검토.

### 3.2 파일별 구체 작업
- **`app/api/users/[id]/permissions/route.ts`**
  - `const db = await getDb();` 도입 후 `db.query.userPermissions.findMany`와 `db.insert(userPermissions)`/`db.delete(userPermissions)` 조합으로 CRUD 작성.
  - 권한 조회 시 `leftJoin`으로 `permissions` 및 `users`를 묶어 응답 스키마를 구성하고, Prisma 옵션(`include`, `select`) 대신 명시적 `select` 객체 작성.
- **`app/api/users/[id]/route.ts`**
  - `db.query.users.findFirst`를 사용하여 단일 사용자 정보 조회. 필요한 컬럼만 `select`하도록 DTO 정의.
- **`app/api/users/search/route.ts`**
  - Prisma `contains` 대신 `ilike` 또는 `sql` 템플릿을 활용하여 대소문자 무관 검색 구현. 입력 값 전처리 후 `limit` 적용.
- **`app/api/wallet/route.ts`**
  - 사용자 지갑 조회/생성/업데이트를 Drizzle로 전환: `db.query.wallets.findFirst`, `db.insert(wallets)`, `db.update(wallets).set({...}).where(eq(wallets.id, ...))`.
  - `pendingBalance` 계산 시 음수 방지 로직 유지, 업데이트 직후 `returning()`으로 최신 데이터 획득.
- **`app/api/products/route.ts` & `app/api/payments/route.ts`**
  - 핸들러 상단에서 `const db = await getDb();` 도입.
  - 조건 배열이 비어 있을 때 `and(...conditions)` 호출을 피하기 위해 `if (conditions.length) { query.where(and(...conditions)); }` 패턴으로 재작성.
  - POST 핸들러의 TODO 구간은 최소한 Drizzle을 사용한 기본 검증/삽입 로직으로 대체.
- **`app/api/permissions/route.ts`**
  - GET에서 `const db = await getDb();` 후 `db.select` 체인 구성.
  - POST에서 권한 중복 체크(`db.query.permissions.findFirst`) 후 `db.insert(permissions)` 적용.
- **`app/api/community/route.ts`**
  - 당장은 Mock 데이터지만, 최소한 lint 오류 제거를 위해 미사용 import 정리 혹은 향후 실제 쿼리 도입 계획 수립.

### 3.3 `lib/server/announcements.ts` 타입 보강
1. `resolvePublishedAt` 반환 타입을 `Date`로 고정하고, 문자열 입력 시 `Date.parse` 유효성 검증을 거쳐 잘못된 입력에는 현재 시각을 대체 값으로 사용.
2. `mapAnnouncement` 내부에서 `announcement.publishedAt`이 문자열일 수 있음을 감안하여 `new Date(...)`로 캐스팅한 뒤 비교 수행.
3. 해당 모듈을 사용하는 서비스/테스트가 있다면 타입 변경에 따른 영향 범위를 점검.

### 3.4 검증 플로우
- 단위 테스트가 존재하지 않는 엔드포인트는 최소한 `npm run lint`와 `npm run test -- --runInBand`를 통해 타입/린트/주요 유닛 테스트가 통과하는지 확인.
- API 라우트 수정 후에는 Postman/Thunder Client 등으로 Smoke Test를 수행하여 기본 CRUD 동작을 확인할 것.

## 4. 예상 리스크 및 대응
- Prisma 패턴을 Drizzle로 치환하면서 조인/조건 작성이 길어질 수 있으므로, 공통 where 빌더 헬퍼를 작성하거나 `db.query.<table>`의 `with` 옵션 활용을 검토.
- 문자열 검색(`contains`) → `ilike` 변경 시 인덱스 사용성/성능을 고려하여 필요하다면 후속 작업으로 trigram 인덱스 추가를 계획.
- 날짜 파싱 로직 보강 시 잘못된 문자열 입력을 어떻게 처리할지(에러 throw vs 기본값 대체) 결정해야 하며, 이는 PM/기획과 사전 협의 필요.

## 5. 우선순위 제안
1. **1단계**: `app/api/users/*`, `app/api/wallet`과 같이 직접적인 타입 오류를 유발하는 라우트부터 Drizzle 쿼리로 재작성.
2. **2단계**: `products`, `payments`, `permissions` 등 목록/등록 API에 대한 Drizzle 쿼리 구현 및 린트 오류 제거.
3. **3단계**: `lib/server/announcements.ts` 타입 정리와 `community` 피드 로직 실제 쿼리 도입.
4. **4단계**: 테스트/문서화(README 혹은 docs/) 업데이트와 코드 리뷰 반영.

## 6. 후속 문서화
- 본 계획에 따라 실제 구현이 완료되면, `docs/architecture` 하위에 Drizzle 접근 가이드(쿼리 패턴, 조인 샘플, 트랜잭션 처리)를 별도 문서로 정리하는 것을 권장.
