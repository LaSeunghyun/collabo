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
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum FundingStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

// Moderation related enums
export enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// Other commonly used enums
export enum NotificationType {
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  FUNDING_RECEIVED = 'FUNDING_RECEIVED',
  MILESTONE_REACHED = 'MILESTONE_REACHED'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum PartnerType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
  AGENCY = 'AGENCY'
}

export enum PartnerMatchStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  TOSS = 'TOSS'
}

export enum PostType {
  UPDATE = 'UPDATE',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  MILESTONE = 'MILESTONE'
}

export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
  SERVICE = 'SERVICE'
}

export enum SettlementPayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum SettlementStakeholderType {
  CREATOR = 'CREATOR',
  PARTNER = 'PARTNER',
  COLLABORATOR = 'COLLABORATOR'
}

export enum CommunityCategory {
  GENERAL = 'GENERAL',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  QUESTION = 'QUESTION',
  FEEDBACK = 'FEEDBACK'
}

export enum MilestoneStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ModerationTargetType {
  POST = 'POST',
  COMMENT = 'COMMENT',
  USER = 'USER',
  PROJECT = 'PROJECT'
}

// Type aliases for compatibility
export type ProjectStatusType = ProjectStatus;
export type FundingStatusType = FundingStatus;
export type PartnerTypeType = PartnerType;
export type OrderStatusType = OrderStatus;
export type PostTypeType = PostType;
export type NotificationTypeType = NotificationType;
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
  [ProjectStatus.PENDING]: '검토중',
  [ProjectStatus.ACTIVE]: '진행중',
  [ProjectStatus.COMPLETED]: '완료',
  [ProjectStatus.CANCELLED]: '취소됨'
};

export const FUNDING_STATUS_LABELS: Record<FundingStatusType, string> = {
  [FundingStatus.PENDING]: '대기중',
  [FundingStatus.COMPLETED]: '성공',
  [FundingStatus.FAILED]: '실패',
  [FundingStatus.REFUNDED]: '환불됨'
};

export const PARTNER_TYPE_LABELS: Record<PartnerTypeType, string> = {
  [PartnerType.INDIVIDUAL]: '개인',
  [PartnerType.COMPANY]: '회사',
  [PartnerType.AGENCY]: '에이전시'
};

export const ORDER_STATUS_LABELS: Record<OrderStatusType, string> = {
  [OrderStatus.PENDING]: '대기중',
  [OrderStatus.CONFIRMED]: '확인됨',
  [OrderStatus.SHIPPED]: '배송중',
  [OrderStatus.DELIVERED]: '배송완료',
  [OrderStatus.CANCELLED]: '취소됨'
};

export const POST_TYPE_LABELS: Record<PostTypeType, string> = {
  [PostType.UPDATE]: '업데이트',
  [PostType.ANNOUNCEMENT]: '공지',
  [PostType.MILESTONE]: '마일스톤'
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationTypeType, string> = {
  [NotificationType.PROJECT_UPDATE]: '프로젝트 업데이트',
  [NotificationType.FUNDING_RECEIVED]: '펀딩 수령',
  [NotificationType.MILESTONE_REACHED]: '마일스톤 달성'
};

// ROLE_LABELS 별칭 (하위 호환성)
export const ROLE_LABELS = USER_ROLE_LABELS;