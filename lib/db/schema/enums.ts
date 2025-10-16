import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('UserRole', [
  'CREATOR',
  'PARTICIPANT',
  'PARTNER',
  'ADMIN',
]);

export const projectStatusEnum = pgEnum('ProjectStatus', [
  'DRAFT',
  'REVIEWING',
  'LIVE',
  'SUCCESSFUL',
  'FAILED',
  'EXECUTING',
  'COMPLETED',
]);

export const fundingStatusEnum = pgEnum('FundingStatus', [
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED',
  'CANCELLED',
]);

export const paymentProviderEnum = pgEnum('PaymentProvider', [
  'STRIPE',
  'TOSS',
  'PAYPAL',
  'MANUAL',
]);

export const settlementPayoutStatusEnum = pgEnum('SettlementPayoutStatus', [
  'PENDING',
  'IN_PROGRESS',
  'PAID',
]);

export const settlementStakeholderTypeEnum = pgEnum('SettlementStakeholderType', [
  'PLATFORM',
  'CREATOR',
  'PARTNER',
  'COLLABORATOR',
  'OTHER',
]);

export const partnerTypeEnum = pgEnum('PartnerType', [
  'STUDIO',
  'VENUE',
  'PRODUCTION',
  'MERCHANDISE',
  'OTHER',
]);

export const partnerMatchStatusEnum = pgEnum('PartnerMatchStatus', [
  'REQUESTED',
  'ACCEPTED',
  'DECLINED',
  'CANCELLED',
  'COMPLETED',
]);

export const productTypeEnum = pgEnum('ProductType', [
  'PHYSICAL',
  'DIGITAL',
]);

export const orderStatusEnum = pgEnum('OrderStatus', [
  'PENDING',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'REFUNDED',
  'CANCELLED',
]);

export const postTypeEnum = pgEnum('PostType', [
  'UPDATE',
  'DISCUSSION',
  'AMA',
]);

export const communityCategoryEnum = pgEnum('CommunityCategory', [
  'GENERAL',
  'MUSIC',
  'ART',
  'LITERATURE',
  'PERFORMANCE',
  'PHOTO',
]);

export const notificationTypeEnum = pgEnum('NotificationType', [
  'FUNDING_SUCCESS',
  'NEW_COMMENT',
  'PROJECT_MILESTONE',
  'PARTNER_REQUEST',
  'SETTLEMENT_PAID',
  'SYSTEM',
]);

export const milestoneStatusEnum = pgEnum('MilestoneStatus', [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'RELEASED',
]);

export const moderationTargetTypeEnum = pgEnum('ModerationTargetType', [
  'POST',
  'COMMENT',
]);

export const moderationStatusEnum = pgEnum('ModerationStatus', [
  'PENDING',
  'REVIEWING',
  'ACTION_TAKEN',
  'DISMISSED',
]);
