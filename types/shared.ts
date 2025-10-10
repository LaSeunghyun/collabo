/**
 * @deprecated 대부분의 enum은 @/lib/constants/enums로 이동되었습니다.
 * 
 * 이 파일은 하위 호환성을 위해 유지되지만, 새 코드에서는 @/lib/constants/enums를 사용하세요.
 */

// ============================================================================
// Enum Re-exports (중앙 파일에서 가져옴)
// ============================================================================

export {
  UserRole,
  ProjectStatus,
  FundingStatus,
  OrderStatus,
  PartnerType,
  PartnerMatchStatus,
  PaymentProvider,
  SettlementPayoutStatus,
  ModerationStatus,
  ModerationTargetType,
  type UserRoleValue,
  type ProjectStatusValue,
  type FundingStatusValue,
  type OrderStatusValue,
  type PartnerTypeValue,
  type PartnerMatchStatusValue,
  type PaymentProviderValue,
  type SettlementPayoutStatusValue,
  type ModerationStatusValue,
  type ModerationTargetTypeValue,
} from '@/lib/constants/enums';

export {
  USER_ROLE_VALUES,
  USER_ROLE_LABELS,
  PROJECT_STATUS_VALUES,
  PROJECT_STATUS_LABELS,
  FUNDING_STATUS_VALUES,
  FUNDING_STATUS_LABELS,
  ORDER_STATUS_VALUES,
  ORDER_STATUS_LABELS,
  PARTNER_TYPE_VALUES,
  PARTNER_TYPE_LABELS,
  PARTNER_MATCH_STATUS_VALUES,
  PARTNER_MATCH_STATUS_LABELS,
  PAYMENT_PROVIDER_VALUES,
  PAYMENT_PROVIDER_LABELS,
  MODERATION_STATUS_VALUES,
  MODERATION_STATUS_LABELS,
} from '@/lib/constants/enums';

// ============================================================================
// Legacy Type Aliases (하위 호환성)
// ============================================================================

import type {
  UserRoleValue,
  ProjectStatusValue,
  FundingStatusValue,
  OrderStatusValue,
  PartnerTypeValue,
} from '@/lib/constants/enums';

export type UserRoleType = UserRoleValue;
export type ProjectStatusType = ProjectStatusValue;
export type FundingStatusType = FundingStatusValue;
export type OrderStatusType = OrderStatusValue;
export type PartnerTypeType = PartnerTypeValue;

// ============================================================================
// Domain-Specific Types (도메인별 타입은 유지)
// ============================================================================

// Project Types
export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  status: ProjectStatusValue;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  ownerId: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  status: ProjectStatusValue;
  imageUrl?: string;
  createdAt: Date;
  deadline?: Date;
  backerCount: number;
  owner: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

// Funding Types
export interface Funding {
  id: string;
  amount: number;
  status: FundingStatusValue;
  projectId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Settlement Types
export interface Settlement {
  id: string;
  projectId: string;
  totalRaised: number;
  platformFee: number;
  gatewayFees: number;
  netAmount: number;
  creatorShare: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order Types
export interface Order {
  id: string;
  userId: string;
  status: OrderStatusValue;
  totalAmount: number;
  shippingAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Partner Types
export interface Partner {
  id: string;
  userId: string;
  name: string;
  type: PartnerTypeValue;
  description?: string;
  contactInfo: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
  avatarUrl?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Moderation Types
export interface ModerationReport {
  id: string;
  targetType: ModerationTargetTypeValue;
  targetId: string;
  reporterId: string;
  reason: string;
  status: ModerationStatusValue;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Common Filter Types
export interface DateRange {
  from: Date;
  to: Date;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams extends PaginationParams, SortParams {
  search?: string;
  status?: string;
  category?: string;
  dateRange?: DateRange;
}
