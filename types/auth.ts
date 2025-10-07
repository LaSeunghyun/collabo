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
  [UserRole.CREATOR]: '창작자',
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