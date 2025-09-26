// Prisma에서 생성된 타입들을 재export하여 공유 타입으로 사용
export {
  // Enums
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
  
  // Models
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
  
  // Prisma namespace
  Prisma
} from '@prisma/client';

// 공통 타입 정의
export type DatabaseId = string;
export type Timestamp = Date;

// API 응답용 타입들
export type ProjectSummary = Prisma.ProjectGetPayload<{
  include: {
    owner: {
      select: {
        id: true;
        name: true;
        avatarUrl: true;
      };
    };
    _count: {
      select: {
        fundings: true;
      };
    };
  };
}>;

export type PostResponse = Prisma.PostGetPayload<{
  select: {
    id: true;
    title: true;
    content: true;
    createdAt: true;
    author: {
      select: {
        id: true;
        name: true;
        avatarUrl: true;
      };
    };
    _count: {
      select: {
        likes: true;
        comments: true;
      };
    };
  };
}>;

export type PartnerSummary = Prisma.PartnerGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        avatarUrl: true;
      };
    };
  };
}>;

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
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CREATOR]: '크리에이터',
  [UserRole.PARTICIPANT]: '참여자',
  [UserRole.PARTNER]: '파트너',
  [UserRole.ADMIN]: '관리자'
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.DRAFT]: '초안',
  [ProjectStatus.REVIEWING]: '검토중',
  [ProjectStatus.LIVE]: '진행중',
  [ProjectStatus.SUCCESSFUL]: '성공',
  [ProjectStatus.FAILED]: '실패',
  [ProjectStatus.EXECUTING]: '실행중',
  [ProjectStatus.COMPLETED]: '완료'
};

export const FUNDING_STATUS_LABELS: Record<FundingStatus, string> = {
  [FundingStatus.PENDING]: '대기중',
  [FundingStatus.SUCCEEDED]: '성공',
  [FundingStatus.FAILED]: '실패',
  [FundingStatus.REFUNDED]: '환불됨',
  [FundingStatus.CANCELLED]: '취소됨'
};

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  [PartnerType.STUDIO]: '스튜디오',
  [PartnerType.VENUE]: '공연장',
  [PartnerType.PRODUCTION]: '제작 스튜디오',
  [PartnerType.MERCHANDISE]: '머천다이즈',
  [PartnerType.OTHER]: '기타'
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '대기중',
  [OrderStatus.PAID]: '결제완료',
  [OrderStatus.SHIPPED]: '배송중',
  [OrderStatus.DELIVERED]: '배송완료',
  [OrderStatus.REFUNDED]: '환불됨',
  [OrderStatus.CANCELLED]: '취소됨'
};

export const POST_TYPE_LABELS: Record<PostType, string> = {
  [PostType.UPDATE]: '업데이트',
  [PostType.DISCUSSION]: '토론',
  [PostType.AMA]: 'Q&A'
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.FUNDING_SUCCESS]: '펀딩 성공',
  [NotificationType.NEW_COMMENT]: '새 댓글',
  [NotificationType.PROJECT_MILESTONE]: '프로젝트 마일스톤',
  [NotificationType.PARTNER_REQUEST]: '파트너 요청',
  [NotificationType.SETTLEMENT_PAID]: '정산 완료',
  [NotificationType.SYSTEM]: '시스템 알림'
};
