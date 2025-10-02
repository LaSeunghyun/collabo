// Shared Prisma client types and enums
import {
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
} from '@prisma/client';

import type {
  ProjectStatus as ProjectStatusType,
  FundingStatus as FundingStatusType,
  PartnerType as PartnerTypeType,
  OrderStatus as OrderStatusType,
  PostType as PostTypeType,
  NotificationType as NotificationTypeType
} from '@prisma/client';

export type {
  // Announcement, // ?�키마에 ?�음
  // AnnouncementRead, // ?�키마에 ?�음
  User,
  Project,
  ProjectCollaborator,
  Funding,
  Settlement,
  Partner,
  PartnerMatch,
  Product,
  Order,
  Post,
  Comment,
  PostLike,
  Notification,
  Wallet,
  AuditLog,
  Permission,
  UserPermission,
  PaymentTransaction,
  SettlementPayout,
  ProjectMilestone,
  ProjectRewardTier,
  ProjectRequirement,
  OrderItem,
  UserFollow,
  CommentReaction,
  ModerationReport,
  UserBlock
} from '@prisma/client';

export type {
  UserRole as UserRoleType,
  ProjectStatus as ProjectStatusType,
  FundingStatus as FundingStatusType,
  PaymentProvider as PaymentProviderType,
  SettlementPayoutStatus as SettlementPayoutStatusType,
  SettlementStakeholderType as SettlementStakeholderTypeType,
  PartnerType as PartnerTypeType,
  PartnerMatchStatus as PartnerMatchStatusType,
  ProductType as ProductTypeType,
  OrderStatus as OrderStatusType,
  PostType as PostTypeType,
  NotificationType as NotificationTypeType,
  MilestoneStatus as MilestoneStatusType,
  ModerationTargetType as ModerationTargetTypeType,
  ModerationStatus as ModerationStatusType,
  CommunityCategory as CommunityCategoryType
} from '@prisma/client';

// Prisma client and types are only available on the server
// Use lib/prisma.ts for server-side Prisma client access

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

export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  SUPPORTERS = 'SUPPORTERS',
  PRIVATE = 'PRIVATE'
}

export const POST_VISIBILITY_VALUES = Object.values(PostVisibility);

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
  [ProjectStatus.DRAFT]: '초안',
  [ProjectStatus.REVIEWING]: '검토중',
  [ProjectStatus.LIVE]: '진행중',
  [ProjectStatus.SUCCESSFUL]: '성공',
  [ProjectStatus.FAILED]: '실패',
  [ProjectStatus.EXECUTING]: '실행중',
  [ProjectStatus.COMPLETED]: '완료'
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
  // [NotificationType.ANNOUNCEMENT]: '공지 알림' // 스키마에 없음
};
