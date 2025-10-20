import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { 
  users, 
  projects, 
  posts, 
  comments, 
  announcements, 
  announcementReads,
  fundings,
  settlements,
  partners,
  partnerMatches,
  projectMilestones,
  projectRewardTiers,
  projectRequirements,
  projectCollaborators,
  products,
  orders,
  orderItems,
  postLikes,
  postDislikes,
  commentReactions,
  notifications,
  visitLogs,
  wallets,
  auditLogs,
  permissions,
  userPermissions,
  paymentTransactions,
  userFollows,
  moderationReports,
  userBlocks,
  authSessions,
  authDevices,
  refreshTokens,
  tokenBlacklist
} from '@/lib/db/schema';

// User types
export type User = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;

// Project types
export type Project = InferSelectModel<typeof projects>;
export type InsertProject = InferInsertModel<typeof projects>;

// Post types
export type Post = InferSelectModel<typeof posts>;
export type InsertPost = InferInsertModel<typeof posts>;

// Comment types
export type Comment = InferSelectModel<typeof comments>;
export type InsertComment = InferInsertModel<typeof comments>;

// Announcement types
export type Announcement = InferSelectModel<typeof announcements>;
export type InsertAnnouncement = InferInsertModel<typeof announcements>;

export type AnnouncementRead = InferSelectModel<typeof announcementReads>;
export type InsertAnnouncementRead = InferInsertModel<typeof announcementReads>;

// Funding types
export type Funding = InferSelectModel<typeof fundings>;
export type InsertFunding = InferInsertModel<typeof fundings>;

// Settlement types
export type Settlement = InferSelectModel<typeof settlements>;
export type InsertSettlement = InferInsertModel<typeof settlements>;

// Partner types
export type Partner = InferSelectModel<typeof partners>;
export type InsertPartner = InferInsertModel<typeof partners>;

export type PartnerMatch = InferSelectModel<typeof partnerMatches>;
export type InsertPartnerMatch = InferInsertModel<typeof partnerMatches>;

// Project milestone types
export type ProjectMilestone = InferSelectModel<typeof projectMilestones>;
export type InsertProjectMilestone = InferInsertModel<typeof projectMilestones>;

export type ProjectRewardTier = InferSelectModel<typeof projectRewardTiers>;
export type InsertProjectRewardTier = InferInsertModel<typeof projectRewardTiers>;

export type ProjectRequirement = InferSelectModel<typeof projectRequirements>;
export type InsertProjectRequirement = InferInsertModel<typeof projectRequirements>;

export type ProjectCollaborator = InferSelectModel<typeof projectCollaborators>;
export type InsertProjectCollaborator = InferInsertModel<typeof projectCollaborators>;

// Product types
export type Product = InferSelectModel<typeof products>;
export type InsertProduct = InferInsertModel<typeof products>;

// Order types
export type Order = InferSelectModel<typeof orders>;
export type InsertOrder = InferInsertModel<typeof orders>;

export type OrderItem = InferSelectModel<typeof orderItems>;
export type InsertOrderItem = InferInsertModel<typeof orderItems>;

// Community types
export type PostLike = InferSelectModel<typeof postLikes>;
export type InsertPostLike = InferInsertModel<typeof postLikes>;

export type PostDislike = InferSelectModel<typeof postDislikes>;
export type InsertPostDislike = InferInsertModel<typeof postDislikes>;

export type CommentReaction = InferSelectModel<typeof commentReactions>;
export type InsertCommentReaction = InferInsertModel<typeof commentReactions>;

// Notification types
export type Notification = InferSelectModel<typeof notifications>;
export type InsertNotification = InferInsertModel<typeof notifications>;

// Visit log types
export type VisitLog = InferSelectModel<typeof visitLogs>;
export type InsertVisitLog = InferInsertModel<typeof visitLogs>;

// Wallet types
export type Wallet = InferSelectModel<typeof wallets>;
export type InsertWallet = InferInsertModel<typeof wallets>;

// Audit log types
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type InsertAuditLog = InferInsertModel<typeof auditLogs>;

// Permission types
export type Permission = InferSelectModel<typeof permissions>;
export type InsertPermission = InferInsertModel<typeof permissions>;

export type UserPermission = InferSelectModel<typeof userPermissions>;
export type InsertUserPermission = InferInsertModel<typeof userPermissions>;

// Payment transaction types
export type PaymentTransaction = InferSelectModel<typeof paymentTransactions>;
export type InsertPaymentTransaction = InferInsertModel<typeof paymentTransactions>;

// User follow types
export type UserFollow = InferSelectModel<typeof userFollows>;
export type InsertUserFollow = InferInsertModel<typeof userFollows>;

// Moderation types
export type ModerationReport = InferSelectModel<typeof moderationReports>;
export type InsertModerationReport = InferInsertModel<typeof moderationReports>;

export type UserBlock = InferSelectModel<typeof userBlocks>;
export type InsertUserBlock = InferInsertModel<typeof userBlocks>;

// Auth types
export type AuthSession = InferSelectModel<typeof authSessions>;
export type InsertAuthSession = InferInsertModel<typeof authSessions>;

export type AuthDevice = InferSelectModel<typeof authDevices>;
export type InsertAuthDevice = InferInsertModel<typeof authDevices>;

export type RefreshToken = InferSelectModel<typeof refreshTokens>;
export type InsertRefreshToken = InferInsertModel<typeof refreshTokens>;

export type TokenBlacklist = InferSelectModel<typeof tokenBlacklist>;
export type InsertTokenBlacklist = InferInsertModel<typeof tokenBlacklist>;

// Common query result types
export type UserWithStats = User & {
  followersCount: number;
  projectsCount: number;
  fundingsCount: number;
};

export type ProjectWithOwner = Project & {
  owner: User;
};

export type PostWithAuthor = Post & {
  author: User;
  likesCount: number;
  commentsCount: number;
};

export type AnnouncementWithAuthor = Announcement & {
  author: User;
  isRead: boolean;
};

// Enum types (re-exported from schema)
export type {
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
  PostStatus,
  CommunityCategory,
  NotificationType,
  MilestoneStatus,
  ModerationTargetType,
  ModerationStatus
} from '@/lib/db/schema';
