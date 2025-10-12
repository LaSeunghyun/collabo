// Drizzle enum 타입들을 테스트에서 사용할 수 있도록 export
export {
  userRoleEnum,
  projectStatusEnum,
  fundingStatusEnum,
  paymentProviderEnum,
  settlementPayoutStatusEnum,
  settlementStakeholderTypeEnum,
  partnerTypeEnum,
  partnerMatchStatusEnum,
  productTypeEnum,
  orderStatusEnum,
  postTypeEnum,
  communityCategoryEnum,
  notificationTypeEnum,
  milestoneStatusEnum,
  moderationTargetTypeEnum,
  moderationStatusEnum
} from '@/lib/db/schema/enums';

// 테스트에서 사용할 수 있는 enum 값들
export const UserRole = {
  CREATOR: 'CREATOR',
  PARTICIPANT: 'PARTICIPANT',
  PARTNER: 'PARTNER',
  ADMIN: 'ADMIN'
} as const;

export const ProjectStatus = {
  DRAFT: 'DRAFT',
  REVIEWING: 'REVIEWING',
  LIVE: 'LIVE',
  SUCCESSFUL: 'SUCCESSFUL',
  FAILED: 'FAILED',
  EXECUTING: 'EXECUTING',
  COMPLETED: 'COMPLETED'
} as const;

export const PostType = {
  UPDATE: 'UPDATE',
  DISCUSSION: 'DISCUSSION',
  AMA: 'AMA'
} as const;

export const PartnerType = {
  STUDIO: 'STUDIO',
  VENUE: 'VENUE',
  PRODUCTION: 'PRODUCTION',
  MERCHANDISE: 'MERCHANDISE',
  OTHER: 'OTHER'
} as const;

export const FundingStatus = {
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED'
} as const;

export const OrderStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED'
} as const;

export const ProductType = {
  PHYSICAL: 'PHYSICAL',
  DIGITAL: 'DIGITAL'
} as const;

export const CommunityCategory = {
  MUSIC: 'MUSIC',
  ART: 'ART',
  LITERATURE: 'LITERATURE',
  PERFORMANCE: 'PERFORMANCE',
  PHOTO: 'PHOTO'
} as const;

export const ModerationTargetType = {
  POST: 'POST',
  COMMENT: 'COMMENT'
} as const;

export const ModerationStatus = {
  PENDING: 'PENDING',
  REVIEWING: 'REVIEWING',
  ACTION_TAKEN: 'ACTION_TAKEN',
  DISMISSED: 'DISMISSED'
} as const;
