import { pgTable, text, timestamp, integer, boolean, json, pgEnum, decimal, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['CREATOR', 'PARTICIPANT', 'PARTNER', 'ADMIN']);
export const projectStatusEnum = pgEnum('project_status', ['DRAFT', 'PRELAUNCH', 'LIVE', 'SUCCEEDED', 'FAILED', 'SETTLING', 'EXECUTING', 'COMPLETED', 'CANCELLED']);
export const fundingStatusEnum = pgEnum('funding_status', ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELLED']);
export const paymentProviderEnum = pgEnum('payment_provider', ['STRIPE', 'TOSS', 'PAYPAL', 'MANUAL']);
export const settlementPayoutStatusEnum = pgEnum('settlement_payout_status', ['PENDING', 'IN_PROGRESS', 'PAID']);
export const settlementStakeholderTypeEnum = pgEnum('settlement_stakeholder_type', ['PLATFORM', 'CREATOR', 'PARTNER', 'COLLABORATOR', 'OTHER']);
export const settlementStatusEnum = pgEnum('settlement_status', ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']);
export const partnerTypeEnum = pgEnum('partner_type', ['STUDIO', 'VENUE', 'PRODUCTION', 'MERCHANDISE', 'OTHER']);
export const partnerMatchStatusEnum = pgEnum('partner_match_status', ['REQUESTED', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED']);
export const productTypeEnum = pgEnum('product_type', ['PHYSICAL', 'DIGITAL']);
export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'PAID_PENDING_CAPTURE', 'PAID', 'SHIPPED', 'DELIVERED', 'REFUNDED', 'CANCELLED']);
export const deliveryTypeEnum = pgEnum('delivery_type', ['SHIPPING', 'PICKUP', 'DIGITAL', 'TICKET']);
export const ticketStatusEnum = pgEnum('ticket_status', ['PENDING', 'ISSUED', 'USED', 'CANCELLED']);
export const postTypeEnum = pgEnum('post_type', ['UPDATE', 'DISCUSSION', 'AMA']);
export const postStatusEnum = pgEnum('post_status', ['ACTIVE', 'HIDDEN', 'DELETED']);
export const communityCategoryEnum = pgEnum('community_category', ['GENERAL', 'QUESTION', 'REVIEW', 'SUGGESTION', 'NOTICE', 'COLLAB', 'SUPPORT', 'SHOWCASE']);
export const notificationTypeEnum = pgEnum('notification_type', ['FUNDING_SUCCESS', 'NEW_COMMENT', 'PROJECT_MILESTONE', 'PARTNER_REQUEST', 'SETTLEMENT_PAID', 'SYSTEM']);
export const milestoneStatusEnum = pgEnum('milestone_status', ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'RELEASED']);
export const moderationTargetTypeEnum = pgEnum('moderation_target_type', ['POST', 'COMMENT']);
export const moderationStatusEnum = pgEnum('moderation_status', ['PENDING', 'REVIEWING', 'ACTION_TAKEN', 'DISMISSED']);

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: userRoleEnum('role').notNull().default('PARTICIPANT'),
  passwordHash: text('password_hash'),
  avatarUrl: text('avatar_url'),
  language: text('language').notNull().default('ko'),
  timezone: text('timezone'),
  bio: text('bio'),
  socialLinks: json('social_links'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Projects table
export const projects = pgTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  targetAmount: integer('target_amount').notNull(),
  currentAmount: integer('current_amount').notNull().default(0),
  currency: text('currency').notNull().default('KRW'),
  status: projectStatusEnum('status').notNull().default('DRAFT'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  rewardTiers: json('reward_tiers'),
  milestones: json('milestones'),
  thumbnail: text('thumbnail'),
  metadata: json('metadata'),
  ownerId: text('owner_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Project Collaborators table
export const projectCollaborators = pgTable('project_collaborators', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').notNull().references(() => projects.id),
  userId: text('user_id').notNull().references(() => users.id),
  role: text('role'),
  share: integer('share'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueProjectUser: unique('unique_project_user', [table.projectId, table.userId]),
}));

// Fundings table
export const fundings = pgTable('fundings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').notNull().references(() => projects.id),
  userId: text('user_id').notNull().references(() => users.id),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('KRW'),
  paymentIntentId: text('payment_intent_id').unique(),
  paymentStatus: fundingStatusEnum('payment_status').notNull().default('PENDING'),
  rewardTier: json('reward_tier'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  refundedAt: timestamp('refunded_at'),
});

// Settlements table
export const settlements = pgTable('settlements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').notNull().references(() => projects.id),
  totalAmount: integer('total_amount').notNull(),
  platformFee: integer('platform_fee').notNull(),
  netAmount: integer('net_amount').notNull(),
  status: settlementStatusEnum('status').notNull().default('PENDING'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Partners table
export const partners = pgTable('partners', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().unique().references(() => users.id),
  type: partnerTypeEnum('type').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  services: json('services'),
  pricingModel: text('pricing_model'),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  contactInfo: text('contact_info').notNull(),
  verified: boolean('verified').notNull().default(false),
  location: text('location'),
  availability: json('availability'),
  portfolioUrl: text('portfolio_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Partner Matches table
export const partnerMatches = pgTable('partner_matches', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').notNull().references(() => projects.id),
  partnerId: text('partner_id').notNull().references(() => partners.id),
  status: partnerMatchStatusEnum('status').notNull().default('REQUESTED'),
  quote: integer('quote'),
  settlementShare: decimal('settlement_share', { precision: 5, scale: 2 }),
  contractUrl: text('contract_url'),
  requirements: json('requirements'),
  responseMessage: text('response_message'),
  notes: json('notes'),
  acceptedAt: timestamp('accepted_at'),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Products table
export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').notNull().references(() => projects.id),
  name: text('name').notNull(),
  type: productTypeEnum('type').notNull(),
  price: integer('price').notNull(),
  currency: text('currency').notNull().default('KRW'),
  inventory: integer('inventory'),
  images: text('images').array().default([]),
  metadata: json('metadata'),
  sku: text('sku'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Orders table
export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  projectId: text('project_id').references(() => projects.id),
  totalPrice: integer('total_price').notNull(),
  subtotal: integer('subtotal').notNull(),
  currency: text('currency').notNull().default('KRW'),
  orderStatus: orderStatusEnum('order_status').notNull().default('PENDING'),
  shippingCost: integer('shipping_cost'),
  taxAmount: integer('tax_amount'),
  discountTotal: integer('discount_total'),
  shippingInfo: json('shipping_info'),
  transactionId: text('transaction_id'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Posts table
export const posts = pgTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').references(() => projects.id),
  authorId: text('author_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: postTypeEnum('type').notNull().default('DISCUSSION'),
  visibility: text('visibility').default('PUBLIC'),
  attachments: json('attachments'),
  milestoneId: text('milestone_id'),
  excerpt: text('excerpt'),
  tags: text('tags').array().default([]),
  category: communityCategoryEnum('category').notNull().default('GENERAL'),
  language: text('language').notNull().default('ko'),
  scheduledAt: timestamp('scheduled_at'),
  publishedAt: timestamp('published_at'),
  isPinned: boolean('is_pinned').notNull().default(false),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  status: postStatusEnum('status').notNull().default('ACTIVE'),
  likesCount: integer('likes_count').notNull().default(0),
  dislikesCount: integer('dislikes_count').notNull().default(0),
  commentsCount: integer('comments_count').notNull().default(0),
  reportsCount: integer('reports_count').notNull().default(0),
  editedAt: timestamp('edited_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Comments table
export const comments = pgTable('comments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text('post_id').notNull().references(() => posts.id),
  authorId: text('author_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  parentCommentId: text('parent_comment_id').references(() => comments.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  editedAt: timestamp('edited_at'),
  deletedAt: timestamp('deleted_at'),
  isDeleted: boolean('is_deleted').notNull().default(false),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  metadata: json('metadata'),
  relatedId: text('related_id'),
  relatedType: text('related_type'),
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Wallets table
export const wallets = pgTable('wallets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().unique().references(() => users.id),
  balance: integer('balance').notNull().default(0),
  pendingBalance: integer('pending_balance').notNull().default(0),
  currency: text('currency').notNull().default('KRW'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  projects: many(projects),
  collaborations: many(projectCollaborators),
  fundings: many(fundings),
  posts: many(posts),
  comments: many(comments),
  notifications: many(notifications),
  partner: one(partners),
  orders: many(orders),
  wallet: one(wallets),
  followers: many(userFollows, {
    fields: [users.id],
    references: [userFollows.followingId],
  }),
  following: many(userFollows, {
    fields: [users.id],
    references: [userFollows.followerId],
  }),
  postLikes: many(postLikes),
  postDislikes: many(postDislikes),
  moderationReports: many(moderationReports),
  auditLogs: many(auditLogs),
  permissions: many(userPermissions),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  collaborators: many(projectCollaborators),
  fundings: many(fundings),
  settlements: many(settlements),
  partnerMatches: many(partnerMatches),
  products: many(products),
  orders: many(orders),
  posts: many(posts),
}));

export const projectCollaboratorsRelations = relations(projectCollaborators, ({ one }) => ({
  project: one(projects, {
    fields: [projectCollaborators.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectCollaborators.userId],
    references: [users.id],
  }),
}));

export const fundingsRelations = relations(fundings, ({ one }) => ({
  project: one(projects, {
    fields: [fundings.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [fundings.userId],
    references: [users.id],
  }),
}));

export const settlementsRelations = relations(settlements, ({ one, many }) => ({
  project: one(projects, {
    fields: [settlements.projectId],
    references: [projects.id],
  }),
  payouts: many(settlementPayouts),
}));

export const partnersRelations = relations(partners, ({ one, many }) => ({
  user: one(users, {
    fields: [partners.userId],
    references: [users.id],
  }),
  matches: many(partnerMatches),
}));

export const partnerMatchesRelations = relations(partnerMatches, ({ one }) => ({
  project: one(projects, {
    fields: [partnerMatches.projectId],
    references: [projects.id],
  }),
  partner: one(partners, {
    fields: [partnerMatches.partnerId],
    references: [partners.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  project: one(projects, {
    fields: [products.projectId],
    references: [projects.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [orders.projectId],
    references: [projects.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  project: one(projects, {
    fields: [posts.projectId],
    references: [projects.id],
  }),
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(postLikes),
  dislikes: many(postDislikes),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
  }),
  replies: many(comments),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// User Follows table
export const userFollows = pgTable('user_follows', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  followerId: text('follower_id').notNull().references(() => users.id),
  followingId: text('following_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueFollow: unique('unique_follow', [table.followerId, table.followingId]),
}));

// Post Likes table
export const postLikes = pgTable('post_likes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text('post_id').notNull().references(() => posts.id),
  userId: text('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniquePostLike: unique('unique_post_like', [table.postId, table.userId]),
}));

// Post Dislikes table
export const postDislikes = pgTable('post_dislikes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text('post_id').notNull().references(() => posts.id),
  userId: text('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniquePostDislike: unique('unique_post_dislike', [table.postId, table.userId]),
}));

// Moderation Reports table
export const moderationReports = pgTable('moderation_reports', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  reporterId: text('reporter_id').notNull().references(() => users.id),
  targetType: moderationTargetTypeEnum('target_type').notNull(),
  targetId: text('target_id').notNull(),
  reason: text('reason').notNull(),
  description: text('description'),
  status: moderationStatusEnum('status').notNull().default('PENDING'),
  moderatorId: text('moderator_id').references(() => users.id),
  actionTaken: text('action_taken'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Settlement Payouts table
export const settlementPayouts = pgTable('settlement_payouts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  settlementId: text('settlement_id').notNull().references(() => settlements.id),
  stakeholderType: settlementStakeholderTypeEnum('stakeholder_type').notNull(),
  stakeholderId: text('stakeholder_id').notNull(),
  amount: integer('amount').notNull(),
  status: settlementPayoutStatusEnum('status').notNull().default('PENDING'),
  paymentMethod: text('payment_method'),
  paymentReference: text('payment_reference'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Audit Logs table
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  oldValues: json('old_values'),
  newValues: json('new_values'),
  metadata: json('metadata'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// User Permissions table
export const userPermissions = pgTable('user_permissions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  permission: text('permission').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueUserPermission: unique('unique_user_permission', [table.userId, table.permission, table.resourceType, table.resourceId]),
}));

// Relations
export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(users, {
    fields: [userFollows.followerId],
    references: [users.id],
  }),
  following: one(users, {
    fields: [userFollows.followingId],
    references: [users.id],
  }),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

export const postDislikesRelations = relations(postDislikes, ({ one }) => ({
  post: one(posts, {
    fields: [postDislikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postDislikes.userId],
    references: [users.id],
  }),
}));

export const moderationReportsRelations = relations(moderationReports, ({ one }) => ({
  reporter: one(users, {
    fields: [moderationReports.reporterId],
    references: [users.id],
  }),
  moderator: one(users, {
    fields: [moderationReports.moderatorId],
    references: [users.id],
  }),
}));

export const settlementPayoutsRelations = relations(settlementPayouts, ({ one }) => ({
  settlement: one(settlements, {
    fields: [settlementPayouts.settlementId],
    references: [settlements.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));
