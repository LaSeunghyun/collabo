/**
 * @deprecated 이 파일은 deprecated되었습니다. 대신 @/lib/constants/enums를 사용하세요.
 * 
 * 마이그레이션 가이드:
 * - 모든 enum과 라벨은 이제 @/lib/constants/enums에서 import하세요
 */

// Database enum re-exports
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
  moderationStatusEnum,
} from '@/lib/db/schema/enums';

// TypeScript const 객체들
export {
  UserRole,
  ProjectStatus,
  FundingStatus,
  PaymentProvider,
  SettlementPayoutStatus,
  SettlementStakeholderType,
  PartnerType,
  PartnerMatchStatus,
  ProductType,
  OrderStatus,
  PostType,
  CommunityCategory,
  NotificationType,
  MilestoneStatus,
  ModerationTargetType,
  ModerationStatus,
} from '@/lib/constants/enums';
