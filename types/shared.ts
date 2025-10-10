// User related enums
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

export type ProjectStatusType = keyof typeof ProjectStatus;

export const PROJECT_STATUS_VALUES = Object.values(ProjectStatus);
export const PROJECT_STATUS_LABELS = {
  [ProjectStatus.DRAFT]: '초안',
  [ProjectStatus.REVIEWING]: '검토중',
  [ProjectStatus.LIVE]: '진행중',
  [ProjectStatus.SUCCESSFUL]: '성공',
  [ProjectStatus.FAILED]: '실패',
  [ProjectStatus.EXECUTING]: '실행중',
  [ProjectStatus.COMPLETED]: '완료'
} as const;

// Funding related enums
export enum FundingStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

export type FundingStatusType = keyof typeof FundingStatus;

export const FUNDING_STATUS_VALUES = Object.values(FundingStatus);
export const FUNDING_STATUS_LABELS = {
  [FundingStatus.PENDING]: '대기중',
  [FundingStatus.SUCCEEDED]: '성공',
  [FundingStatus.FAILED]: '실패',
  [FundingStatus.REFUNDED]: '환불됨',
  [FundingStatus.CANCELLED]: '취소됨'
} as const;

// Order related enums
export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

export type OrderStatusType = keyof typeof OrderStatus;

export const ORDER_STATUS_VALUES = Object.values(OrderStatus);
export const ORDER_STATUS_LABELS = {
  [OrderStatus.PENDING]: '대기중',
  [OrderStatus.PAID]: '결제완료',
  [OrderStatus.SHIPPED]: '배송중',
  [OrderStatus.DELIVERED]: '배송완료',
  [OrderStatus.REFUNDED]: '환불됨',
  [OrderStatus.CANCELLED]: '취소됨'
} as const;

// Partner related enums
export enum PartnerType {
  STUDIO = 'STUDIO',
  VENUE = 'VENUE',
  PRODUCTION = 'PRODUCTION',
  MERCHANDISE = 'MERCHANDISE',
  OTHER = 'OTHER'
}

export type PartnerTypeType = keyof typeof PartnerType;

export const PARTNER_TYPE_VALUES = Object.values(PartnerType);
export const PARTNER_TYPE_LABELS = {
  [PartnerType.STUDIO]: '스튜디오',
  [PartnerType.VENUE]: '공연장',
  [PartnerType.PRODUCTION]: '제작사',
  [PartnerType.MERCHANDISE]: '굿즈',
  [PartnerType.OTHER]: '기타'
} as const;

// Community related enums
export enum CommunityCategory {
  GENERAL = 'GENERAL',
  NOTICE = 'NOTICE',
  COLLAB = 'COLLAB',
  SUPPORT = 'SUPPORT',
  SHOWCASE = 'SHOWCASE'
}

export type CommunityCategoryType = keyof typeof CommunityCategory;

export const COMMUNITY_CATEGORY_VALUES = Object.values(CommunityCategory);
export const COMMUNITY_CATEGORY_LABELS = {
  [CommunityCategory.GENERAL]: '일반',
  [CommunityCategory.NOTICE]: '공지',
  [CommunityCategory.COLLAB]: '콜라보',
  [CommunityCategory.SUPPORT]: '지원',
  [CommunityCategory.SHOWCASE]: '쇼케이스'
} as const;

// Post related enums
export enum PostType {
  UPDATE = 'UPDATE',
  DISCUSSION = 'DISCUSSION',
  AMA = 'AMA'
}

export type PostTypeType = keyof typeof PostType;

export const POST_TYPE_VALUES = Object.values(PostType);
export const POST_TYPE_LABELS = {
  [PostType.UPDATE]: '업데이트',
  [PostType.DISCUSSION]: '토론',
  [PostType.AMA]: '질문답변'
} as const;

// Notification related enums
export enum NotificationType {
  FUNDING_SUCCESS = 'FUNDING_SUCCESS',
  NEW_COMMENT = 'NEW_COMMENT',
  PROJECT_MILESTONE = 'PROJECT_MILESTONE',
  PARTNER_REQUEST = 'PARTNER_REQUEST',
  SETTLEMENT_PAID = 'SETTLEMENT_PAID',
  SYSTEM = 'SYSTEM'
}

export type NotificationTypeType = keyof typeof NotificationType;

export const NOTIFICATION_TYPE_VALUES = Object.values(NotificationType);
export const NOTIFICATION_TYPE_LABELS = {
  [NotificationType.FUNDING_SUCCESS]: '펀딩 성공',
  [NotificationType.NEW_COMMENT]: '새 댓글',
  [NotificationType.PROJECT_MILESTONE]: '프로젝트 마일스톤',
  [NotificationType.PARTNER_REQUEST]: '파트너 요청',
  [NotificationType.SETTLEMENT_PAID]: '정산 완료',
  [NotificationType.SYSTEM]: '시스템'
} as const;

// Milestone related enums
export enum MilestoneStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  RELEASED = 'RELEASED'
}

export type MilestoneStatusType = keyof typeof MilestoneStatus;

export const MILESTONE_STATUS_VALUES = Object.values(MilestoneStatus);
export const MILESTONE_STATUS_LABELS = {
  [MilestoneStatus.PLANNED]: '계획됨',
  [MilestoneStatus.IN_PROGRESS]: '진행중',
  [MilestoneStatus.COMPLETED]: '완료됨',
  [MilestoneStatus.RELEASED]: '출시됨'
} as const;

// Moderation related enums
export enum ModerationTargetType {
  POST = 'POST',
  COMMENT = 'COMMENT'
}

export type ModerationTargetTypeType = keyof typeof ModerationTargetType;

export const MODERATION_TARGET_TYPE_VALUES = Object.values(ModerationTargetType);
export const MODERATION_TARGET_TYPE_LABELS = {
  [ModerationTargetType.POST]: '게시글',
  [ModerationTargetType.COMMENT]: '댓글'
} as const;

export enum ModerationStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  ACTION_TAKEN = 'ACTION_TAKEN',
  DISMISSED = 'DISMISSED'
}

export type ModerationStatusType = keyof typeof ModerationStatus;

export const MODERATION_STATUS_VALUES = Object.values(ModerationStatus);
export const MODERATION_STATUS_LABELS = {
  [ModerationStatus.PENDING]: '대기중',
  [ModerationStatus.REVIEWING]: '검토중',
  [ModerationStatus.ACTION_TAKEN]: '조치완료',
  [ModerationStatus.DISMISSED]: '기각됨'
} as const;

// Settlement related enums
export enum SettlementPayoutStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PAID = 'PAID'
}

export type SettlementPayoutStatusType = keyof typeof SettlementPayoutStatus;

export const SETTLEMENT_PAYOUT_STATUS_VALUES = Object.values(SettlementPayoutStatus);
export const SETTLEMENT_PAYOUT_STATUS_LABELS = {
  [SettlementPayoutStatus.PENDING]: '대기중',
  [SettlementPayoutStatus.IN_PROGRESS]: '진행중',
  [SettlementPayoutStatus.PAID]: '지급완료'
} as const;

export enum SettlementStakeholderType {
  PLATFORM = 'PLATFORM',
  CREATOR = 'CREATOR',
  PARTNER = 'PARTNER',
  COLLABORATOR = 'COLLABORATOR',
  OTHER = 'OTHER'
}

export type SettlementStakeholderTypeType = keyof typeof SettlementStakeholderType;

export const SETTLEMENT_STAKEHOLDER_TYPE_VALUES = Object.values(SettlementStakeholderType);
export const SETTLEMENT_STAKEHOLDER_TYPE_LABELS = {
  [SettlementStakeholderType.PLATFORM]: '플랫폼',
  [SettlementStakeholderType.CREATOR]: '크리에이터',
  [SettlementStakeholderType.PARTNER]: '파트너',
  [SettlementStakeholderType.COLLABORATOR]: '협력자',
  [SettlementStakeholderType.OTHER]: '기타'
} as const;

// Product related enums
export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL'
}

export type ProductTypeType = keyof typeof ProductType;

export const PRODUCT_TYPE_VALUES = Object.values(ProductType);
export const PRODUCT_TYPE_LABELS = {
  [ProductType.PHYSICAL]: '물리적',
  [ProductType.DIGITAL]: '디지털'
} as const;

// Payment related enums
export enum PaymentProvider {
  STRIPE = 'STRIPE',
  TOSS = 'TOSS',
  PAYPAL = 'PAYPAL',
  MANUAL = 'MANUAL'
}

export type PaymentProviderType = keyof typeof PaymentProvider;

export const PAYMENT_PROVIDER_VALUES = Object.values(PaymentProvider);
export const PAYMENT_PROVIDER_LABELS = {
  [PaymentProvider.STRIPE]: 'Stripe',
  [PaymentProvider.TOSS]: 'Toss',
  [PaymentProvider.PAYPAL]: 'PayPal',
  [PaymentProvider.MANUAL]: '수동'
} as const;

// Partner match related enums
export enum PartnerMatchStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export type PartnerMatchStatusType = keyof typeof PartnerMatchStatus;

export const PARTNER_MATCH_STATUS_VALUES = Object.values(PartnerMatchStatus);
export const PARTNER_MATCH_STATUS_LABELS = {
  [PartnerMatchStatus.REQUESTED]: '요청됨',
  [PartnerMatchStatus.ACCEPTED]: '수락됨',
  [PartnerMatchStatus.DECLINED]: '거절됨',
  [PartnerMatchStatus.CANCELLED]: '취소됨',
  [PartnerMatchStatus.COMPLETED]: '완료됨'
} as const;

// Common types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  code?: string;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormErrors {
  [key: string]: string | ValidationError[];
}

// File upload types
export interface FileUpload {
  file: File;
  url?: string;
  progress?: number;
  error?: string;
}

export interface ImageUpload extends FileUpload {
  width?: number;
  height?: number;
  alt?: string;
}

// Social media types
export interface SocialLink {
  platform: string;
  url: string;
  label?: string;
}

// Location types
export interface Location {
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Contact types
export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  socialLinks?: SocialLink[];
}

// Metadata types
export interface Metadata {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
}

// Analytics types
export interface AnalyticsData {
  views: number;
  clicks: number;
  conversions: number;
  revenue?: number;
  period: string;
}

// Settings types
export interface UserSettings {
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profile: 'public' | 'private';
    activity: 'public' | 'private';
  };
}

// Theme types
export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
}

// Feature flags
export interface FeatureFlags {
  [key: string]: boolean;
}

// Environment types
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  VERCEL?: string;
  VERCEL_ENV?: 'development' | 'preview' | 'production';
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Event types
export interface BaseEvent {
  type: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

export interface UserEvent extends BaseEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: {
    userId: string;
    changes?: Record<string, any>;
  };
}

export interface ProjectEvent extends BaseEvent {
  type: 'project.created' | 'project.updated' | 'project.deleted' | 'project.published';
  data: {
    projectId: string;
    changes?: Record<string, any>;
  };
}

export interface FundingEvent extends BaseEvent {
  type: 'funding.created' | 'funding.succeeded' | 'funding.failed' | 'funding.refunded';
  data: {
    fundingId: string;
    projectId: string;
    amount: number;
    currency: string;
  };
}

export type AppEvent = UserEvent | ProjectEvent | FundingEvent;

// Webhook types
export interface WebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp: string;
  signature?: string;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
}

// Cache types
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize?: number;
  strategy?: 'lru' | 'fifo' | 'ttl';
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Rate limiting types
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Logging types
export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

export interface LogEntry {
  level: keyof LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

// Health check types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: {
    [key: string]: {
      status: 'up' | 'down' | 'degraded';
      responseTime?: number;
      error?: string;
    };
  };
}

// Performance monitoring types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
}