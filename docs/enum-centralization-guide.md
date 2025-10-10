# Enum 중앙화 가이드

## 개요

이 문서는 프로젝트에서 사용되는 모든 enum 값과 라벨을 중앙 집중식으로 관리하는 방법에 대해 설명합니다.

## 문제점

기존에는 enum 관련 코드가 여러 파일에 분산되어 있었습니다:

- `lib/db/schema/enums.ts`: Drizzle ORM enum 정의
- `types/drizzle.ts`: TypeScript const 객체
- `types/shared.ts`: Enum + 한글 라벨
- `lib/constants/partner-types.ts`: 파트너 타입 전용
- `lib/constants/announcements.ts`: 공지사항 전용
- `lib/auth/permissions.ts`: 역할 라벨

이로 인해 다음과 같은 문제가 발생했습니다:

1. **유지보수 어려움**: 동일한 enum을 여러 곳에서 정의
2. **불일치 가능성**: 다른 파일에서 다른 라벨 사용
3. **중복 코드**: 같은 enum 값을 여러 번 정의

## 해결 방안

모든 enum을 `lib/constants/enums.ts` 파일에 통합하여 관리합니다.

## 구조

### 1. Database Enum Re-exports

Drizzle ORM에서 정의한 enum을 re-export합니다:

```typescript
export {
  userRoleEnum,
  projectStatusEnum,
  // ... 기타 enum
} from '@/lib/db/schema/enums';
```

### 2. TypeScript Const 객체

타입 안전한 비교 및 할당을 위한 const 객체:

```typescript
export const UserRole = {
  CREATOR: 'CREATOR',
  PARTICIPANT: 'PARTICIPANT',
  PARTNER: 'PARTNER',
  ADMIN: 'ADMIN',
} as const;
```

### 3. 한글 라벨 매핑

UI 표시를 위한 한글 라벨:

```typescript
export const USER_ROLE_LABELS: Record<UserRoleValue, string> = {
  [UserRole.CREATOR]: '크리에이터',
  [UserRole.PARTICIPANT]: '참여자',
  [UserRole.PARTNER]: '파트너',
  [UserRole.ADMIN]: '관리자',
};
```

### 4. 값 배열

드롭다운이나 선택 옵션을 위한 배열:

```typescript
export const USER_ROLE_VALUES = Object.values(UserRole);
```

### 5. 기본값

각 enum에 대한 기본값:

```typescript
export const DEFAULT_USER_ROLE: UserRoleValue = UserRole.PARTICIPANT;
```

## 사용 방법

### 기본 사용

```typescript
import {
  UserRole,
  USER_ROLE_LABELS,
  USER_ROLE_VALUES,
  type UserRoleValue,
} from '@/lib/constants/enums';

// 비교
if (user.role === UserRole.ADMIN) {
  // ...
}

// 라벨 표시
const label = USER_ROLE_LABELS[user.role];

// 드롭다운 옵션
const options = USER_ROLE_VALUES.map(value => ({
  value,
  label: USER_ROLE_LABELS[value]
}));
```

### 타입 사용

```typescript
import { type UserRoleValue } from '@/lib/constants/enums';

interface User {
  id: string;
  name: string;
  role: UserRoleValue;
}
```

## 마이그레이션 가이드

### 이전 방식

```typescript
// ❌ 이전 방식
import { userRoleEnum } from '@/lib/db/schema/enums';

const labels: Record<typeof userRoleEnum.enumValues[number], string> = {
  CREATOR: '크리에이터',
  PARTICIPANT: '참여자',
  PARTNER: '파트너',
  ADMIN: '관리자'
};
```

### 새로운 방식

```typescript
// ✅ 새로운 방식
import { USER_ROLE_LABELS } from '@/lib/constants/enums';

const labels = USER_ROLE_LABELS;
```

## 사용 가능한 Enum 목록

### 사용자 관련

- `UserRole` / `USER_ROLE_LABELS` / `USER_ROLE_VALUES`

### 프로젝트 관련

- `ProjectStatus` / `PROJECT_STATUS_LABELS` / `PROJECT_STATUS_VALUES`

### 펀딩 관련

- `FundingStatus` / `FUNDING_STATUS_LABELS` / `FUNDING_STATUS_VALUES`

### 결제 관련

- `PaymentProvider` / `PAYMENT_PROVIDER_LABELS` / `PAYMENT_PROVIDER_VALUES`

### 정산 관련

- `SettlementPayoutStatus` / `SETTLEMENT_PAYOUT_STATUS_LABELS` / `SETTLEMENT_PAYOUT_STATUS_VALUES`
- `SettlementStakeholderType` / `SETTLEMENT_STAKEHOLDER_TYPE_LABELS` / `SETTLEMENT_STAKEHOLDER_TYPE_VALUES`

### 파트너 관련

- `PartnerType` / `PARTNER_TYPE_LABELS` / `PARTNER_TYPE_VALUES`
- `PartnerMatchStatus` / `PARTNER_MATCH_STATUS_LABELS` / `PARTNER_MATCH_STATUS_VALUES`

### 상품 관련

- `ProductType` / `PRODUCT_TYPE_LABELS` / `PRODUCT_TYPE_VALUES`

### 주문 관련

- `OrderStatus` / `ORDER_STATUS_LABELS` / `ORDER_STATUS_VALUES`

### 게시글 관련

- `PostType` / `POST_TYPE_LABELS` / `POST_TYPE_VALUES`

### 커뮤니티 관련

- `CommunityCategory` / `COMMUNITY_CATEGORY_LABELS` / `COMMUNITY_CATEGORY_VALUES`

### 알림 관련

- `NotificationType` / `NOTIFICATION_TYPE_LABELS` / `NOTIFICATION_TYPE_VALUES`

### 마일스톤 관련

- `MilestoneStatus` / `MILESTONE_STATUS_LABELS` / `MILESTONE_STATUS_VALUES`

### 신고 관련

- `ModerationTargetType` / `MODERATION_TARGET_TYPE_LABELS` / `MODERATION_TARGET_TYPE_VALUES`
- `ModerationStatus` / `MODERATION_STATUS_LABELS` / `MODERATION_STATUS_VALUES`

### 공지사항 관련

- `AnnouncementCategory` / `ANNOUNCEMENT_CATEGORY_LABELS` / `ANNOUNCEMENT_CATEGORY_VALUES`

## 하위 호환성

기존 파일들은 중앙 enum 파일을 re-export하여 하위 호환성을 유지합니다:

- `lib/constants/partner-types.ts`
- `lib/constants/announcements.ts`
- `types/drizzle.ts`
- `types/shared.ts`

하지만 새로운 코드에서는 직접 `@/lib/constants/enums`에서 import하는 것을 권장합니다.

## 주의사항

1. **UTF-8 인코딩**: 모든 파일은 UTF-8 (without BOM)으로 저장되어야 합니다.
2. **데이터베이스 enum 호환성**: `lib/db/schema/enums.ts`의 enum 정의와 일치해야 합니다.
3. **타입 안정성**: TypeScript의 타입 체크를 활용하여 컴파일 타임에 오류를 방지합니다.

## 추가 정보

새로운 enum을 추가해야 하는 경우:

1. `lib/db/schema/enums.ts`에 Drizzle enum 추가
2. `lib/constants/enums.ts`에 다음 항목 추가:
   - Database enum re-export
   - TypeScript const 객체
   - 타입 정의
   - 한글 라벨 매핑
   - 값 배열
   - (필요시) 기본값

## 참고

- UTF-8 인코딩 수정 스크립트: `scripts/fix-utf8-encoding.js`
- Enum 중앙화 파일: `lib/constants/enums.ts`

