/**
 * 중앙 집중식 Enum 관리
 * 
 * 이 파일은 애플리케이션 전체에서 사용되는 모든 enum 값과 라벨을 관리합니다.
 * 
 * 구조:
 * 1. Database enum을 re-export (Drizzle ORM 스키마에서)
 * 2. TypeScript const 객체 (타입 안전한 비교/할당용)
 * 3. 한글 라벨 매핑 (UI 표시용)
 */

// ============================================================================
// 1. Database Enum Re-exports
// ============================================================================

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

// ============================================================================
// 2. TypeScript Const Objects (타입 안전한 비교/할당용)
// ============================================================================

export const UserRole = {
  CREATOR: 'CREATOR',
  PARTICIPANT: 'PARTICIPANT',
  PARTNER: 'PARTNER',
  ADMIN: 'ADMIN',
} as const;

export const ProjectStatus = {
  DRAFT: 'DRAFT',
  REVIEWING: 'REVIEWING',
  LIVE: 'LIVE',
  SUCCESSFUL: 'SUCCESSFUL',
  FAILED: 'FAILED',
  EXECUTING: 'EXECUTING',
  COMPLETED: 'COMPLETED',
} as const;

export const FundingStatus = {
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
} as const;

export const PaymentProvider = {
  STRIPE: 'STRIPE',
  TOSS: 'TOSS',
  PAYPAL: 'PAYPAL',
  MANUAL: 'MANUAL',
} as const;

export const SettlementPayoutStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  PAID: 'PAID',
} as const;

export const SettlementStakeholderType = {
  PLATFORM: 'PLATFORM',
  CREATOR: 'CREATOR',
  PARTNER: 'PARTNER',
  COLLABORATOR: 'COLLABORATOR',
  OTHER: 'OTHER',
} as const;

export const PartnerType = {
  STUDIO: 'STUDIO',
  VENUE: 'VENUE',
  PRODUCTION: 'PRODUCTION',
  MERCHANDISE: 'MERCHANDISE',
  OTHER: 'OTHER',
} as const;

export const PartnerMatchStatus = {
  REQUESTED: 'REQUESTED',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

export const ProductType = {
  PHYSICAL: 'PHYSICAL',
  DIGITAL: 'DIGITAL',
} as const;

export const OrderStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
} as const;

export const PostType = {
  UPDATE: 'UPDATE',
  DISCUSSION: 'DISCUSSION',
  AMA: 'AMA',
} as const;

export const CommunityCategory = {
  GENERAL: 'GENERAL',
  NOTICE: 'NOTICE',
  COLLAB: 'COLLAB',
  SUPPORT: 'SUPPORT',
  SHOWCASE: 'SHOWCASE',
} as const;

export const NotificationType = {
  FUNDING_SUCCESS: 'FUNDING_SUCCESS',
  NEW_COMMENT: 'NEW_COMMENT',
  PROJECT_MILESTONE: 'PROJECT_MILESTONE',
  PARTNER_REQUEST: 'PARTNER_REQUEST',
  SETTLEMENT_PAID: 'SETTLEMENT_PAID',
  SYSTEM: 'SYSTEM',
} as const;

export const MilestoneStatus = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  RELEASED: 'RELEASED',
} as const;

export const ModerationTargetType = {
  POST: 'POST',
  COMMENT: 'COMMENT',
} as const;

export const ModerationStatus = {
  PENDING: 'PENDING',
  REVIEWING: 'REVIEWING',
  ACTION_TAKEN: 'ACTION_TAKEN',
  DISMISSED: 'DISMISSED',
} as const;

export const AnnouncementCategory = {
  GENERAL: 'GENERAL',
  NOTICE: 'NOTICE',
  SYSTEM: 'SYSTEM',
  UPDATE: 'UPDATE',
  EVENT: 'EVENT',
} as const;

// ============================================================================
// 3. TypeScript Types
// ============================================================================

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];
export type ProjectStatusValue = (typeof ProjectStatus)[keyof typeof ProjectStatus];
export type FundingStatusValue = (typeof FundingStatus)[keyof typeof FundingStatus];
export type PaymentProviderValue = (typeof PaymentProvider)[keyof typeof PaymentProvider];
export type SettlementPayoutStatusValue = (typeof SettlementPayoutStatus)[keyof typeof SettlementPayoutStatus];
export type SettlementStakeholderTypeValue = (typeof SettlementStakeholderType)[keyof typeof SettlementStakeholderType];
export type PartnerTypeValue = (typeof PartnerType)[keyof typeof PartnerType];
export type PartnerMatchStatusValue = (typeof PartnerMatchStatus)[keyof typeof PartnerMatchStatus];
export type ProductTypeValue = (typeof ProductType)[keyof typeof ProductType];
export type OrderStatusValue = (typeof OrderStatus)[keyof typeof OrderStatus];
export type PostTypeValue = (typeof PostType)[keyof typeof PostType];
export type CommunityCategoryValue = (typeof CommunityCategory)[keyof typeof CommunityCategory];
export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType];
export type MilestoneStatusValue = (typeof MilestoneStatus)[keyof typeof MilestoneStatus];
export type ModerationTargetTypeValue = (typeof ModerationTargetType)[keyof typeof ModerationTargetType];
export type ModerationStatusValue = (typeof ModerationStatus)[keyof typeof ModerationStatus];
export type AnnouncementCategoryValue = (typeof AnnouncementCategory)[keyof typeof AnnouncementCategory];

// ============================================================================
// 4. 한글 라벨 매핑 (UI 표시용)
// ============================================================================

export const USER_ROLE_LABELS: Record<UserRoleValue, string> = {
  [UserRole.CREATOR]: '크리에이터',
  [UserRole.PARTICIPANT]: '참여자',
  [UserRole.PARTNER]: '파트너',
  [UserRole.ADMIN]: '관리자',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatusValue, string> = {
  [ProjectStatus.DRAFT]: '초안',
  [ProjectStatus.REVIEWING]: '검토중',
  [ProjectStatus.LIVE]: '진행중',
  [ProjectStatus.SUCCESSFUL]: '성공',
  [ProjectStatus.FAILED]: '실패',
  [ProjectStatus.EXECUTING]: '실행중',
  [ProjectStatus.COMPLETED]: '완료',
};

export const FUNDING_STATUS_LABELS: Record<FundingStatusValue, string> = {
  [FundingStatus.PENDING]: '대기중',
  [FundingStatus.SUCCEEDED]: '성공',
  [FundingStatus.FAILED]: '실패',
  [FundingStatus.REFUNDED]: '환불됨',
  [FundingStatus.CANCELLED]: '취소됨',
};

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProviderValue, string> = {
  [PaymentProvider.STRIPE]: 'Stripe',
  [PaymentProvider.TOSS]: 'Toss',
  [PaymentProvider.PAYPAL]: 'PayPal',
  [PaymentProvider.MANUAL]: '수동',
};

export const SETTLEMENT_PAYOUT_STATUS_LABELS: Record<SettlementPayoutStatusValue, string> = {
  [SettlementPayoutStatus.PENDING]: '대기중',
  [SettlementPayoutStatus.IN_PROGRESS]: '진행중',
  [SettlementPayoutStatus.PAID]: '완료',
};

export const SETTLEMENT_STAKEHOLDER_TYPE_LABELS: Record<SettlementStakeholderTypeValue, string> = {
  [SettlementStakeholderType.PLATFORM]: '플랫폼',
  [SettlementStakeholderType.CREATOR]: '크리에이터',
  [SettlementStakeholderType.PARTNER]: '파트너',
  [SettlementStakeholderType.COLLABORATOR]: '협력자',
  [SettlementStakeholderType.OTHER]: '기타',
};

export const PARTNER_TYPE_LABELS: Record<PartnerTypeValue, string> = {
  [PartnerType.STUDIO]: '스튜디오',
  [PartnerType.VENUE]: '공연장',
  [PartnerType.PRODUCTION]: '제작 스튜디오',
  [PartnerType.MERCHANDISE]: '머천다이즈',
  [PartnerType.OTHER]: '기타',
};

export const PARTNER_MATCH_STATUS_LABELS: Record<PartnerMatchStatusValue, string> = {
  [PartnerMatchStatus.REQUESTED]: '요청됨',
  [PartnerMatchStatus.ACCEPTED]: '수락됨',
  [PartnerMatchStatus.DECLINED]: '거절됨',
  [PartnerMatchStatus.CANCELLED]: '취소됨',
  [PartnerMatchStatus.COMPLETED]: '완료',
};

export const PRODUCT_TYPE_LABELS: Record<ProductTypeValue, string> = {
  [ProductType.PHYSICAL]: '실물 상품',
  [ProductType.DIGITAL]: '디지털 상품',
};

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  [OrderStatus.PENDING]: '대기중',
  [OrderStatus.PAID]: '결제완료',
  [OrderStatus.SHIPPED]: '배송중',
  [OrderStatus.DELIVERED]: '배송완료',
  [OrderStatus.REFUNDED]: '환불됨',
  [OrderStatus.CANCELLED]: '취소됨',
};

export const POST_TYPE_LABELS: Record<PostTypeValue, string> = {
  [PostType.UPDATE]: '업데이트',
  [PostType.DISCUSSION]: '토론',
  [PostType.AMA]: 'AMA',
};

export const COMMUNITY_CATEGORY_LABELS: Record<CommunityCategoryValue, string> = {
  [CommunityCategory.GENERAL]: '일반',
  [CommunityCategory.NOTICE]: '공지사항',
  [CommunityCategory.COLLAB]: '협업',
  [CommunityCategory.SUPPORT]: '지원',
  [CommunityCategory.SHOWCASE]: '쇼케이스',
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationTypeValue, string> = {
  [NotificationType.FUNDING_SUCCESS]: '펀딩 성공',
  [NotificationType.NEW_COMMENT]: '새 댓글',
  [NotificationType.PROJECT_MILESTONE]: '프로젝트 마일스톤',
  [NotificationType.PARTNER_REQUEST]: '파트너 요청',
  [NotificationType.SETTLEMENT_PAID]: '정산 지급',
  [NotificationType.SYSTEM]: '시스템',
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatusValue, string> = {
  [MilestoneStatus.PLANNED]: '계획됨',
  [MilestoneStatus.IN_PROGRESS]: '진행중',
  [MilestoneStatus.COMPLETED]: '완료',
  [MilestoneStatus.RELEASED]: '출시됨',
};

export const MODERATION_TARGET_TYPE_LABELS: Record<ModerationTargetTypeValue, string> = {
  [ModerationTargetType.POST]: '게시글',
  [ModerationTargetType.COMMENT]: '댓글',
};

export const MODERATION_STATUS_LABELS: Record<ModerationStatusValue, string> = {
  [ModerationStatus.PENDING]: '대기중',
  [ModerationStatus.REVIEWING]: '검토중',
  [ModerationStatus.ACTION_TAKEN]: '조치완료',
  [ModerationStatus.DISMISSED]: '기각됨',
};

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategoryValue, string> = {
  [AnnouncementCategory.GENERAL]: '일반',
  [AnnouncementCategory.NOTICE]: '공지사항',
  [AnnouncementCategory.SYSTEM]: '시스템',
  [AnnouncementCategory.UPDATE]: '업데이트',
  [AnnouncementCategory.EVENT]: '이벤트',
};

// ============================================================================
// 5. 값 배열 (드롭다운이나 선택 옵션용)
// ============================================================================

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
export const COMMUNITY_CATEGORY_VALUES = Object.values(CommunityCategory);
export const NOTIFICATION_TYPE_VALUES = Object.values(NotificationType);
export const MILESTONE_STATUS_VALUES = Object.values(MilestoneStatus);
export const MODERATION_TARGET_TYPE_VALUES = Object.values(ModerationTargetType);
export const MODERATION_STATUS_VALUES = Object.values(ModerationStatus);
export const ANNOUNCEMENT_CATEGORY_VALUES = Object.values(AnnouncementCategory);

// ============================================================================
// 6. 기본값
// ============================================================================

export const DEFAULT_ANNOUNCEMENT_CATEGORY: AnnouncementCategoryValue = AnnouncementCategory.GENERAL;
export const DEFAULT_USER_ROLE: UserRoleValue = UserRole.PARTICIPANT;
export const DEFAULT_PROJECT_STATUS: ProjectStatusValue = ProjectStatus.DRAFT;
export const DEFAULT_COMMUNITY_CATEGORY: CommunityCategoryValue = CommunityCategory.GENERAL;

