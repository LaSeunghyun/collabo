// Shared types and enums (Drizzle-based)
// Auth related types and enums
export enum UserRole {
  CREATOR = 'CREATOR',
  PARTICIPANT = 'PARTICIPANT',
  PARTNER = 'PARTNER',
  ADMIN = 'ADMIN'
}

export type UserRoleType = keyof typeof UserRole;

export const USER_ROLE_VALUES = Object.values(UserRole);
export const USER_ROLE_LABELS = {
  [UserRole.CREATOR]: '크리에이터',
  [UserRole.PARTICIPANT]: '참여자',
  [UserRole.PARTNER]: '파트너',
  [UserRole.ADMIN]: '관리자'
} as const;

// Project related enums
export enum ProjectStatus {
  DRAFT = 'DRAFT',
  REVIEWING = 'REVIEWING',
  LIVE = 'LIVE',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
  EXECUTING = 'EXECUTING',
  COMPLETED = 'COMPLETED'
}

export enum FundingStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

// Moderation related enums
export enum ModerationStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  ACTION_TAKEN = 'ACTION_TAKEN',
  DISMISSED = 'DISMISSED'
}

// Other commonly used enums
export enum NotificationType {
  FUNDING_SUCCESS = 'FUNDING_SUCCESS',
  NEW_COMMENT = 'NEW_COMMENT',
  PROJECT_MILESTONE = 'PROJECT_MILESTONE',
  PARTNER_REQUEST = 'PARTNER_REQUEST',
  SETTLEMENT_PAID = 'SETTLEMENT_PAID',
  SYSTEM = 'SYSTEM'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

export enum PartnerType {
  STUDIO = 'STUDIO',
  VENUE = 'VENUE',
  PRODUCTION = 'PRODUCTION',
  MERCHANDISE = 'MERCHANDISE',
  OTHER = 'OTHER'
}

export enum PartnerMatchStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  TOSS = 'TOSS',
  PAYPAL = 'PAYPAL',
  MANUAL = 'MANUAL'
}

export enum PostType {
  UPDATE = 'UPDATE',
  DISCUSSION = 'DISCUSSION',
  AMA = 'AMA'
}

export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL'
}

export enum SettlementPayoutStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PAID = 'PAID'
}

export enum SettlementStakeholderType {
  PLATFORM = 'PLATFORM',
  CREATOR = 'CREATOR',
  PARTNER = 'PARTNER',
  COLLABORATOR = 'COLLABORATOR',
  OTHER = 'OTHER'
}

export enum CommunityCategory {
  MUSIC = 'MUSIC',
  ART = 'ART',
  LITERATURE = 'LITERATURE',
  PERFORMANCE = 'PERFORMANCE',
  PHOTO = 'PHOTO'
}

export enum MilestoneStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  RELEASED = 'RELEASED'
}

export enum ModerationTargetType {
  POST = 'POST',
  COMMENT = 'COMMENT'
}

// Type aliases for compatibility
export type ProjectStatusType = ProjectStatus;
export type FundingStatusType = FundingStatus;
export type PartnerTypeType = PartnerType;
export type OrderStatusType = OrderStatus;
export type PostTypeType = PostType;
export type NotificationTypeType = NotificationType;
export type SettlementPayoutStatusType = SettlementPayoutStatus;
export type UserRoleValue = UserRole;
export type ProjectStatusValue = ProjectStatus;
export type PartnerTypeValue = PartnerType;
export type SettlementPayoutStatusValue = SettlementPayoutStatus;
export type ModerationStatusValue = ModerationStatus;
export type ModerationTargetTypeValue = ModerationTargetType;

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
  [PartnerType.VENUE]: '장소',
  [PartnerType.PRODUCTION]: '제작',
  [PartnerType.MERCHANDISE]: '상품',
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
  [NotificationType.SYSTEM]: '시스템 알림'
};

// ROLE_LABELS 별칭 (하위 호환성)
export const ROLE_LABELS = USER_ROLE_LABELS;