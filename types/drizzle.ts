// Drizzle ORM types and enums
import {
  userRoleEnum,
  projectStatusEnum,
  fundingStatusEnum,
  partnerTypeEnum,
  orderStatusEnum,
  postTypeEnum,
  notificationTypeEnum,
  moderationTargetTypeEnum,
  moderationStatusEnum,
  paymentProviderEnum,
  settlementPayoutStatusEnum,
  settlementStakeholderTypeEnum,
  partnerMatchStatusEnum,
  productTypeEnum,
  milestoneStatusEnum,
  communityCategoryEnum,
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
  postLikes,
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
  userBlocks,
  rewards,
  tickets,
  shipments,
  authDevices,
  authSessions,
  refreshTokens,
  tokenBlacklists
} from '@/lib/db/schema';

// Export Drizzle schema types
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
export type PostLike = typeof postLikes.$inferSelect;
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
export type Reward = typeof rewards.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Shipment = typeof shipments.$inferSelect;
export type AuthDevice = typeof authDevices.$inferSelect;
export type AuthSession = typeof authSessions.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type TokenBlacklist = typeof tokenBlacklists.$inferSelect;

// Export enums for client-side usage
export const UserRole = userRoleEnum.enumValues;
export const ProjectStatus = projectStatusEnum.enumValues;
export const FundingStatus = fundingStatusEnum.enumValues;
export const PaymentProvider = paymentProviderEnum.enumValues;
export const SettlementPayoutStatus = settlementPayoutStatusEnum.enumValues;
export const SettlementStakeholderType = settlementStakeholderTypeEnum.enumValues;
export const PartnerType = partnerTypeEnum.enumValues;
export const PartnerMatchStatus = partnerMatchStatusEnum.enumValues;
export const ProductType = productTypeEnum.enumValues;
export const OrderStatus = orderStatusEnum.enumValues;
export const PostType = postTypeEnum.enumValues;
export const NotificationType = notificationTypeEnum.enumValues;
export const MilestoneStatus = milestoneStatusEnum.enumValues;
export const ModerationTargetType = moderationTargetTypeEnum.enumValues;
export const ModerationStatus = moderationStatusEnum.enumValues;
export const CommunityCategory = communityCategoryEnum.enumValues;

export type UserRoleType = (typeof UserRole)[number];
export type ProjectStatusType = (typeof ProjectStatus)[number];
export type FundingStatusType = (typeof FundingStatus)[number];
export type PaymentProviderType = (typeof PaymentProvider)[number];
export type SettlementPayoutStatusType = (typeof SettlementPayoutStatus)[number];
export type SettlementStakeholderTypeType = (typeof SettlementStakeholderType)[number];
export type PartnerTypeType = (typeof PartnerType)[number];
export type PartnerMatchStatusType = (typeof PartnerMatchStatus)[number];
export type ProductTypeType = (typeof ProductType)[number];
export type OrderStatusType = (typeof OrderStatus)[number];
export type PostTypeType = (typeof PostType)[number];
export type NotificationTypeType = (typeof NotificationType)[number];
export type MilestoneStatusType = (typeof MilestoneStatus)[number];
export type ModerationTargetTypeType = (typeof ModerationTargetType)[number];
export type ModerationStatusType = (typeof ModerationStatus)[number];
export type CommunityCategoryType = (typeof CommunityCategory)[number];

export type UserRoleValue = UserRoleType;
export type ProjectStatusValue = ProjectStatusType;
export type PartnerTypeValue = PartnerTypeType;
export type SettlementPayoutStatusValue = SettlementPayoutStatusType;
export type ModerationStatusValue = ModerationStatusType;
export type ModerationTargetTypeValue = ModerationTargetTypeType;

export const POST_VISIBILITY_VALUES = ['PUBLIC', 'PRIVATE', 'FRIENDS'];

export type DatabaseId = string;
export type Timestamp = Date;

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

export const USER_ROLE_VALUES = UserRole;
export const PROJECT_STATUS_VALUES = ProjectStatus;
export const FUNDING_STATUS_VALUES = FundingStatus;
export const PAYMENT_PROVIDER_VALUES = PaymentProvider;
export const SETTLEMENT_PAYOUT_STATUS_VALUES = SettlementPayoutStatus;
export const SETTLEMENT_STAKEHOLDER_TYPE_VALUES = SettlementStakeholderType;
export const PARTNER_TYPE_VALUES = PartnerType;
export const PARTNER_MATCH_STATUS_VALUES = PartnerMatchStatus;
export const PRODUCT_TYPE_VALUES = ProductType;
export const ORDER_STATUS_VALUES = OrderStatus;
export const POST_TYPE_VALUES = PostType;
export const NOTIFICATION_TYPE_VALUES = NotificationType;
export const MILESTONE_STATUS_VALUES = MilestoneStatus;
export const MODERATION_TARGET_TYPE_VALUES = ModerationTargetType;
export const MODERATION_STATUS_VALUES = ModerationStatus;

export const USER_ROLE_LABELS: Record<UserRoleType, string> = {
  CREATOR: '크리에이터',
  PARTICIPANT: '참여자',
  PARTNER: '파트너',
  ADMIN: '관리자'
};

export const ROLE_LABELS = USER_ROLE_LABELS;

export const PROJECT_STATUS_LABELS: Record<ProjectStatusType, string> = {
  DRAFT: '초안/검토 대기중',
  PRELAUNCH: '프리런치',
  LIVE: '진행중',
  SUCCEEDED: '성공',
  FAILED: '실패',
  SETTLING: '정산중',
  EXECUTING: '실행중',
  COMPLETED: '완료',
  CANCELLED: '취소됨'
};

export const FUNDING_STATUS_LABELS: Record<FundingStatusType, string> = {
  PENDING: '대기중',
  SUCCEEDED: '성공',
  FAILED: '실패',
  REFUNDED: '환불됨',
  CANCELLED: '취소됨'
};

export const PARTNER_TYPE_LABELS: Record<PartnerTypeType, string> = {
  STUDIO: '스튜디오',
  VENUE: '공연장',
  PRODUCTION: '제작 스튜디오',
  MERCHANDISE: '머천다이즈',
  OTHER: '기타'
};

export const ORDER_STATUS_LABELS: Record<OrderStatusType, string> = {
  PENDING: '대기중',
  PAID_PENDING_CAPTURE: '결제 대기중',
  PAID: '결제완료',
  SHIPPED: '배송중',
  DELIVERED: '배송완료',
  REFUNDED: '환불됨',
  CANCELLED: '취소됨'
};

export const POST_TYPE_LABELS: Record<PostTypeType, string> = {
  UPDATE: '업데이트',
  DISCUSSION: '토론',
  AMA: 'Q&A'
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationTypeType, string> = {
  FUNDING_SUCCESS: '펀딩 성공',
  NEW_COMMENT: '새 댓글',
  PROJECT_MILESTONE: '프로젝트 마일스톤',
  PARTNER_REQUEST: '파트너 요청',
  SETTLEMENT_PAID: '정산 완료',
  SYSTEM: '시스템 알림',
};