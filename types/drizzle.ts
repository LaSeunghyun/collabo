// Drizzle ORM types and enums
import type {
  UserRole,
  ProjectStatus,
  FundingStatus,
  PartnerType,
  OrderStatus,
  PostType,
  NotificationType,
  ModerationTargetType,
  ModerationStatus,
  PaymentProvider,
  SettlementPayoutStatus,
  SettlementStakeholderType,
  PartnerMatchStatus,
  ProductType,
  MilestoneStatus,
  CommunityCategory
} from '@/lib/db/schema';

import type {
  users,
  projects,
  projectCollaborators,
  fundings,
  settlements,
  partners,
  partnerMatches,
  products,
  orders,
  posts,
  comments,
  notifications,
  wallets,
  auditLogs,
  permissions,
  userPermissions,
  paymentTransactions,
  settlementPayouts,
  projectMilestones,
  projectRewardTiers,
  projectRequirements,
  orderItems,
  userFollows,
  commentReactions,
  moderationReports,
  userBlocks
} from '@/lib/db/schema';

// Export types from Drizzle schema
export type {
  UserRole,
  ProjectStatus,
  FundingStatus,
  PartnerType,
  OrderStatus,
  PostType,
  NotificationType,
  ModerationTargetType,
  ModerationStatus,
  PaymentProvider,
  SettlementPayoutStatus,
  SettlementStakeholderType,
  PartnerMatchStatus,
  ProductType,
  MilestoneStatus,
  CommunityCategory
};

// Infer types from Drizzle tables
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectCollaborator = typeof projectCollaborators.$inferSelect;
export type Funding = typeof fundings.$inferSelect;
export type Settlement = typeof settlements.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type PartnerMatch = typeof partnerMatches.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type UserPermission = typeof userPermissions.$inferSelect;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type SettlementPayout = typeof settlementPayouts.$inferSelect;
export type ProjectMilestone = typeof projectMilestones.$inferSelect;
export type ProjectRewardTier = typeof projectRewardTiers.$inferSelect;
export type ProjectRequirement = typeof projectRequirements.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type UserFollow = typeof userFollows.$inferSelect;
export type CommentReaction = typeof commentReactions.$inferSelect;
export type ModerationReport = typeof moderationReports.$inferSelect;
export type UserBlock = typeof userBlocks.$inferSelect;

// Type aliases for backward compatibility
export type UserRoleType = UserRole;
export type ProjectStatusType = ProjectStatus;
export type FundingStatusType = FundingStatus;
export type PaymentProviderType = PaymentProvider;
export type SettlementPayoutStatusType = SettlementPayoutStatus;
export type SettlementStakeholderTypeType = SettlementStakeholderType;
export type PartnerTypeType = PartnerType;
export type PartnerMatchStatusType = PartnerMatchStatus;
export type ProductTypeType = ProductType;
export type OrderStatusType = OrderStatus;
export type PostTypeType = PostType;
export type NotificationTypeType = NotificationType;
export type MilestoneStatusType = MilestoneStatus;
export type ModerationTargetTypeType = ModerationTargetType;
export type ModerationStatusType = ModerationStatus;
export type CommunityCategoryType = CommunityCategory;

// Export enums for client-side usage
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
  NotificationType,
  MilestoneStatus,
  ModerationTargetType,
  ModerationStatus,
  CommunityCategory
};

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];
export type ProjectStatusValue = (typeof ProjectStatus)[keyof typeof ProjectStatus];
export type PartnerTypeValue = (typeof PartnerType)[keyof typeof PartnerType];
export type SettlementPayoutStatusValue =
  (typeof SettlementPayoutStatus)[keyof typeof SettlementPayoutStatus];
export type ModerationStatusValue =
  (typeof ModerationStatus)[keyof typeof ModerationStatus];
export type ModerationTargetTypeValue =
  (typeof ModerationTargetType)[keyof typeof ModerationTargetType];

// PostVisibility enum was removed, using string type instead
export const POST_VISIBILITY_VALUES = ['PUBLIC', 'PRIVATE', 'FRIENDS'];

// 공통 타입 정의
export type DatabaseId = string;
export type Timestamp = Date;

// API 응답용 타입들 - 간단한 타입 정의로 변경
export type ProjectSummary = {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  targetAmount: number;
  currentAmount: number;
  status: ProjectStatusType;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  _count: {
    fundings: number;
  };
  participants: number;
  remainingDays: number;
};

export type PostResponse = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
};

export type PartnerSummary = {
  id: string;
  name: string;
  description: string | null;
  type: PartnerTypeType;
  contactInfo: string;
  location: string | null;
  portfolioUrl: string | null;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  matchCount: number;
};

// Enum 값 배열들
export const USER_ROLE_VALUES = Object.values(UserRole);
export const PROJECT_STATUS_VALUES = Object.values(ProjectStatus);
export const FUNDING_STATUS_VALUES = Object.values(FundingStatus);
export const PAYMENT_PROVIDER_VALUES = Object.values(PaymentProvider);
export const SETTLEMENT_PAYOUT_STATUS_VALUES = Object.values(SettlementPayoutStatus);
export const SETTLEMENT_STAKEHOLDER_TYPE_VALUES = Object.values(SettlementStakeholderType);
export const PARTNER_TYPE_VALUES = Object.values(PartnerType);
export const PARTNER_MATCH_STATUS_VALUES = Object.values(PartnerMatchStatus);
export const PRODUCT_TYPE_VALUES = Object.values(ProductType);
export const ORDER_STATUS_VALUES = Object.values(OrderStatus);
export const POST_TYPE_VALUES = Object.values(PostType);
export const NOTIFICATION_TYPE_VALUES = Object.values(NotificationType);
export const MILESTONE_STATUS_VALUES = Object.values(MilestoneStatus);
export const MODERATION_TARGET_TYPE_VALUES = Object.values(ModerationTargetType);
export const MODERATION_STATUS_VALUES = Object.values(ModerationStatus);

// 한국어 라벨 매핑
export const USER_ROLE_LABELS: Record<UserRoleValue, string> = {
  [UserRole.CREATOR]: '크리에이터',
  [UserRole.PARTICIPANT]: '참여자',
  [UserRole.PARTNER]: '파트너',
  [UserRole.ADMIN]: '관리자'
};

// ROLE_LABELS 별칭 (하위 호환성)
export const ROLE_LABELS = USER_ROLE_LABELS;

export const PROJECT_STATUS_LABELS: Record<ProjectStatusType, string> = {
  [ProjectStatus.DRAFT]: '초안/검토 대기중',
  [ProjectStatus.PRELAUNCH]: '프리런치',
  [ProjectStatus.LIVE]: '진행중',
  [ProjectStatus.SUCCEEDED]: '성공',
  [ProjectStatus.FAILED]: '실패',
  [ProjectStatus.SETTLING]: '정산중',
  [ProjectStatus.EXECUTING]: '실행중',
  [ProjectStatus.COMPLETED]: '완료',
  [ProjectStatus.CANCELLED]: '취소됨'
};

export const FUNDING_STATUS_LABELS: Record<FundingStatusType, string> = {
  [FundingStatus.PENDING]: '대기중',
  [FundingStatus.SUCCEEDED]: '성공',
  [FundingStatus.FAILED]: '실패',
  [FundingStatus.REFUNDED]: '환불됨',
  [FundingStatus.CANCELLED]: '취소됨'
};

export const PARTNER_TYPE_LABELS: Record<PartnerTypeType, string> = {
  [PartnerType.STUDIO]: '스튜디오',
  [PartnerType.VENUE]: '공연장',
  [PartnerType.PRODUCTION]: '제작 스튜디오',
  [PartnerType.MERCHANDISE]: '머천다이즈',
  [PartnerType.OTHER]: '기타'
};

export const ORDER_STATUS_LABELS: Record<OrderStatusType, string> = {
  [OrderStatus.PENDING]: '대기중',
  [OrderStatus.PAID_PENDING_CAPTURE]: '결제 대기중',
  [OrderStatus.PAID]: '결제완료',
  [OrderStatus.SHIPPED]: '배송중',
  [OrderStatus.DELIVERED]: '배송완료',
  [OrderStatus.REFUNDED]: '환불됨',
  [OrderStatus.CANCELLED]: '취소됨'
};

export const POST_TYPE_LABELS: Record<PostTypeType, string> = {
  [PostType.UPDATE]: '업데이트',
  [PostType.DISCUSSION]: '토론',
  [PostType.AMA]: 'Q&A'
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationTypeType, string> = {
  [NotificationType.FUNDING_SUCCESS]: '펀딩 성공',
  [NotificationType.NEW_COMMENT]: '새 댓글',
  [NotificationType.PROJECT_MILESTONE]: '프로젝트 마일스톤',
  [NotificationType.PARTNER_REQUEST]: '파트너 요청',
  [NotificationType.SETTLEMENT_PAID]: '정산 완료',
  [NotificationType.SYSTEM]: '시스템 알림',
};
