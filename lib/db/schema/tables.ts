import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import {
  communityCategoryEnum,
  fundingStatusEnum,
  milestoneStatusEnum,
  moderationStatusEnum,
  moderationTargetTypeEnum,
  notificationTypeEnum,
  orderStatusEnum,
  partnerMatchStatusEnum,
  partnerTypeEnum,
  paymentProviderEnum,
  postTypeEnum,
  productTypeEnum,
  projectStatusEnum,
  settlementPayoutStatusEnum,
  settlementStakeholderTypeEnum,
  userRoleEnum,
} from './enums';

export const users = pgTable(
  'User',
  {
    id: text('id').notNull().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    role: userRoleEnum('role').notNull().default('PARTICIPANT'),
    passwordHash: text('passwordHash'),
    avatarUrl: text('avatarUrl'),
    language: text('language').notNull().default('ko'),
    timezone: text('timezone'),
    bio: text('bio'),
    socialLinks: jsonb('socialLinks'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex('User_email_key').on(table.email),
  }),
);

export const projects = pgTable(
  'Project',
  {
    id: text('id').notNull().primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    targetAmount: integer('targetAmount').notNull(),
    currentAmount: integer('currentAmount').notNull().default(0),
    currency: text('currency').notNull().default('KRW'),
    status: projectStatusEnum('status').notNull().default('DRAFT'),
    startDate: timestamp('startDate', { mode: 'string' }),
    endDate: timestamp('endDate', { mode: 'string' }),
    rewardTiers: jsonb('rewardTiers'),
    milestones: jsonb('milestones'),
    thumbnail: text('thumbnail'),
    metadata: jsonb('metadata'),
    ownerId: text('ownerId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
);

export const projectMilestones = pgTable(
  'ProjectMilestone',
  {
    id: text('id').notNull().primaryKey(),
    projectId: text('projectId')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    dueDate: timestamp('dueDate', { mode: 'string' }),
    releaseAmount: integer('releaseAmount'),
    status: milestoneStatusEnum('status').notNull().default('PLANNED'),
    order: integer('order').notNull().default(0),
    completedAt: timestamp('completedAt', { mode: 'string' }),
    releasedAt: timestamp('releasedAt', { mode: 'string' }),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
);

export const projectRewardTiers = pgTable(
  'ProjectRewardTier',
  {
    id: text('id').notNull().primaryKey(),
    projectId: text('projectId')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    minimumAmount: integer('minimumAmount').notNull(),
    limit: integer('limit'),
    claimed: integer('claimed').notNull().default(0),
    includes: text('includes').array().notNull().default(['RAY']),
    estimatedDelivery: timestamp('estimatedDelivery', { mode: 'string' }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
);

export const projectRequirements = pgTable(
  'ProjectRequirement',
  {
    id: text('id').notNull().primaryKey(),
    projectId: text('projectId')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    category: text('category').notNull(),
    minBudget: integer('minBudget'),
    maxBudget: integer('maxBudget'),
    location: text('location'),
    services: text('services').array().notNull().default(['RAY']),
    startDate: timestamp('startDate', { mode: 'string' }),
    endDate: timestamp('endDate', { mode: 'string' }),
    notes: jsonb('notes'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
);

export const partners = pgTable(
  'Partner',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    type: partnerTypeEnum('type').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    services: jsonb('services'),
    pricingModel: text('pricingModel'),
    rating: doublePrecision('rating'),
    contactInfo: text('contactInfo').notNull(),
    verified: boolean('verified').notNull().default(false),
    location: text('location'),
    availability: jsonb('availability'),
    portfolioUrl: text('portfolioUrl'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
  (table) => ({
    userUnique: uniqueIndex('Partner_userId_key').on(table.userId),
  }),
);

export const partnerMatches = pgTable(
  'PartnerMatch',
  {
    id: text('id').notNull().primaryKey(),
    projectId: text('projectId')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    partnerId: text('partnerId')
      .notNull()
      .references(() => partners.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    status: partnerMatchStatusEnum('status').notNull().default('REQUESTED'),
    quote: integer('quote'),
    settlementShare: doublePrecision('settlementShare'),
    contractUrl: text('contractUrl'),
    requirements: jsonb('requirements'),
    responseMessage: text('responseMessage'),
    notes: jsonb('notes'),
    acceptedAt: timestamp('acceptedAt', { mode: 'string' }),
    completedAt: timestamp('completedAt', { mode: 'string' }),
    cancelledAt: timestamp('cancelledAt', { mode: 'string' }),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
);

export const projectCollaborators = pgTable(
  'ProjectCollaborator',
  {
    id: text('id').notNull().primaryKey(),
    projectId: text('projectId')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    role: text('role'),
    share: integer('share'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    projectUserUnique: uniqueIndex('ProjectCollaborator_projectId_userId_key').on(
      table.projectId,
      table.userId,
    ),
  }),
);

export const authDevices = pgTable(
  'AuthDevice',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    deviceName: text('deviceName'),
    deviceType: text('deviceType'),
    os: text('os'),
    client: text('client').notNull().default('web'),
    uaHash: text('uaHash'),
    ipHash: text('ipHash'),
    fingerprint: text('fingerprint'),
    trusted: boolean('trusted').notNull().default(false),
    revokedAt: timestamp('revokedAt', { mode: 'string' }),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    fingerprintIdx: index('AuthDevice_fingerprint_idx').on(table.fingerprint),
    lastSeenAtIdx: index('AuthDevice_lastSeenAt_idx').on(table.updatedAt),
    userIdIdx: index('AuthDevice_userId_idx').on(table.userId),
  }),
);

export const authSessions = pgTable(
  'AuthSession',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    deviceId: text('deviceId').references(() => authDevices.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    lastUsedAt: timestamp('lastUsedAt', { mode: 'string' }).defaultNow().notNull(),
    ipHash: text('ipHash'),
    uaHash: text('uaHash'),
    remember: boolean('remember').notNull().default(false),
    isAdmin: boolean('isAdmin').notNull().default(false),
    client: text('client').notNull().default('web'),
    absoluteExpiresAt: timestamp('absoluteExpiresAt', { mode: 'string' }).notNull(),
    revokedAt: timestamp('revokedAt', { mode: 'string' }),
  },
  (table) => ({
    userIdx: index('AuthSession_userId_idx').on(table.userId),
    lastUsedIdx: index('AuthSession_lastUsedAt_idx').on(table.lastUsedAt),
  }),
);

export const refreshTokens = pgTable(
  'RefreshToken',
  {
    id: text('id').notNull().primaryKey(),
    sessionId: text('sessionId')
      .notNull()
      .references(() => authSessions.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    tokenHash: text('tokenHash').notNull(),
    tokenFingerprint: text('tokenFingerprint').notNull(),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    inactivityExpiresAt: timestamp('inactivityExpiresAt', { mode: 'string' }).notNull(),
    absoluteExpiresAt: timestamp('absoluteExpiresAt', { mode: 'string' }).notNull(),
    usedAt: timestamp('usedAt', { mode: 'string' }),
    rotatedToId: text('rotatedToId').references(() => refreshTokens.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    revokedAt: timestamp('revokedAt', { mode: 'string' }),
  },
  (table) => ({
    tokenFingerprintUnique: uniqueIndex('RefreshToken_tokenFingerprint_key').on(
      table.tokenFingerprint,
    ),
    rotatedToUnique: uniqueIndex('RefreshToken_rotatedToId_key').on(table.rotatedToId),
    sessionIdx: index('RefreshToken_sessionId_idx').on(table.sessionId),
  }),
);

export const tokenBlacklist = pgTable('TokenBlacklist', {
  jti: text('jti').notNull().primaryKey(),
  expiresAt: timestamp('expiresAt', { mode: 'string' }).notNull(),
});

export const fundings = pgTable(
  'Funding',
  {
    id: text('id').notNull().primaryKey(),
    projectId: text('projectId')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    amount: integer('amount').notNull(),
    currency: text('currency').notNull().default('KRW'),
    paymentIntentId: text('paymentIntentId'),
    paymentStatus: fundingStatusEnum('paymentStatus').notNull().default('PENDING'),
    rewardTier: jsonb('rewardTier'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
    refundedAt: timestamp('refundedAt', { mode: 'string' }),
  },
  (table) => ({
    paymentIntentUnique: uniqueIndex('Funding_paymentIntentId_key').on(
      table.paymentIntentId,
    ),
  }),
);

export const settlements = pgTable(
  'Settlement',
  {
    id: text('id').notNull().primaryKey(),
    projectId: text('projectId')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    totalRaised: integer('totalRaised').notNull(),
    platformFee: integer('platformFee').notNull(),
    creatorShare: integer('creatorShare').notNull(),
    partnerShare: integer('partnerShare').notNull().default(0),
    collaboratorShare: integer('collaboratorShare').notNull().default(0),
    gatewayFees: integer('gatewayFees').notNull().default(0),
    netAmount: integer('netAmount').notNull().default(0),
    payoutStatus: settlementPayoutStatusEnum('payoutStatus')
      .notNull()
      .default('PENDING'),
    distributionBreakdown: jsonb('distributionBreakdown'),
    notes: jsonb('notes'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
);

export const settlementPayouts = pgTable(
  'SettlementPayout',
  {
    id: text('id').notNull().primaryKey(),
    settlementId: text('settlementId')
      .notNull()
      .references(() => settlements.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    stakeholderType: settlementStakeholderTypeEnum('stakeholderType').notNull(),
    stakeholderId: text('stakeholderId'),
    amount: integer('amount').notNull(),
    percentage: doublePrecision('percentage'),
    status: settlementPayoutStatusEnum('status').notNull().default('PENDING'),
    dueDate: timestamp('dueDate', { mode: 'string' }),
    paidAt: timestamp('paidAt', { mode: 'string' }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
);

export const products = pgTable(
  'Product',
  {
    id: text('id').notNull().primaryKey(),
    projectId: text('projectId')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    name: text('name').notNull(),
    type: productTypeEnum('type').notNull(),
    price: integer('price').notNull(),
    currency: text('currency').notNull().default('KRW'),
    inventory: integer('inventory'),
    images: text('images').array().notNull().default(['RAY']),
    metadata: jsonb('metadata'),
    sku: text('sku'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
);

export const orders = pgTable(
  'Order',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    totalPrice: integer('totalPrice').notNull(),
    subtotal: integer('subtotal').notNull(),
    currency: text('currency').notNull().default('KRW'),
    orderStatus: orderStatusEnum('orderStatus').notNull().default('PENDING'),
    shippingCost: integer('shippingCost'),
    taxAmount: integer('taxAmount'),
    discountTotal: integer('discountTotal'),
    shippingInfo: jsonb('shippingInfo'),
    transactionId: text('transactionId'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
);

export const orderItems = pgTable(
  'OrderItem',
  {
    id: text('id').notNull().primaryKey(),
    orderId: text('orderId')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    productId: text('productId')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: integer('unitPrice').notNull(),
    totalPrice: integer('totalPrice').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
);

export const posts = pgTable(
  'Post',
  {
    id: text('id').notNull().primaryKey(),
    projectId: text('projectId').references(() => projects.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    authorId: text('authorId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    type: postTypeEnum('type').notNull().default('UPDATE'),
    visibility: text('visibility').default('PUBLIC'),
    attachments: jsonb('attachments'),
    milestoneId: text('milestoneId').references(() => projectMilestones.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    excerpt: text('excerpt'),
    tags: text('tags').array().notNull().default(['RAY']),
    category: communityCategoryEnum('category').notNull().default('GENERAL'),
    language: text('language').notNull().default('ko'),
    scheduledAt: timestamp('scheduledAt', { mode: 'string' }),
    publishedAt: timestamp('publishedAt', { mode: 'string' }),
    isPinned: boolean('isPinned').notNull().default(false),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
);

export const comments = pgTable(
  'Comment',
  {
    id: text('id').notNull().primaryKey(),
    postId: text('postId')
      .notNull()
      .references(() => posts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    authorId: text('authorId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    content: text('content').notNull(),
    parentCommentId: text('parentCommentId').references(() => comments.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
    editedAt: timestamp('editedAt', { mode: 'string' }),
    deletedAt: timestamp('deletedAt', { mode: 'string' }),
    isDeleted: boolean('isDeleted').notNull().default(false),
  },
);

export const postLikes = pgTable(
  'PostLike',
  {
    id: text('id').notNull().primaryKey(),
    postId: text('postId')
      .notNull()
      .references(() => posts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    postUserUnique: uniqueIndex('PostLike_postId_userId_key').on(
      table.postId,
      table.userId,
    ),
  }),
);

export const postDislikes = pgTable(
  'PostDislike',
  {
    id: text('id').notNull().primaryKey(),
    postId: text('postId')
      .notNull()
      .references(() => posts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    postUserUnique: uniqueIndex('PostDislike_postId_userId_key').on(
      table.postId,
      table.userId,
    ),
  }),
);

export const notifications = pgTable(
  'Notification',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    payload: jsonb('payload').notNull(),
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
  },
);

export const visitLogs = pgTable(
  'VisitLog',
  {
    id: text('id').notNull().primaryKey(),
    sessionId: text('sessionId').notNull(),
    userId: text('userId').references(() => users.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    path: text('path'),
    userAgent: text('userAgent'),
    ipHash: text('ipHash'),
    occurredAt: timestamp('occurredAt', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    occurredAtIdx: index('VisitLog_occurredAt_idx').on(table.occurredAt),
    sessionIdIdx: index('VisitLog_sessionId_idx').on(table.sessionId),
    userIdIdx: index('VisitLog_userId_idx').on(table.userId),
  }),
);

export const wallets = pgTable(
  'Wallet',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    balance: integer('balance').notNull().default(0),
    pendingBalance: integer('pendingBalance').notNull().default(0),
    currency: text('currency').notNull().default('KRW'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
  (table) => ({
    userUnique: uniqueIndex('Wallet_userId_key').on(table.userId),
  }),
);

export const auditLogs = pgTable(
  'AuditLog',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('userId').references(() => users.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    entity: text('entity').notNull(),
    entityId: text('entityId').notNull(),
    action: text('action').notNull(),
    data: jsonb('data'),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
  },
);

export const permissions = pgTable(
  'Permission',
  {
    id: text('id').notNull().primaryKey(),
    key: text('key').notNull(),
    description: text('description'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    keyUnique: uniqueIndex('Permission_key_key').on(table.key),
  }),
);

export const userPermissions = pgTable(
  'UserPermission',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    permissionId: text('permissionId')
      .notNull()
      .references(() => permissions.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    assignedAt: timestamp('assignedAt', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    userPermissionUnique: uniqueIndex('UserPermission_userId_permissionId_key').on(
      table.userId,
      table.permissionId,
    ),
  }),
);

export const paymentTransactions = pgTable(
  'PaymentTransaction',
  {
    id: text('id').notNull().primaryKey(),
    fundingId: text('fundingId')
      .notNull()
      .references(() => fundings.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    provider: paymentProviderEnum('provider').notNull(),
    externalId: text('externalId').notNull(),
    status: fundingStatusEnum('status').notNull(),
    amount: integer('amount').notNull(),
    currency: text('currency').notNull().default('KRW'),
    gatewayFee: integer('gatewayFee').default(0),
    rawPayload: jsonb('rawPayload'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).notNull(),
  },
  (table) => ({
    fundingUnique: uniqueIndex('PaymentTransaction_fundingId_key').on(table.fundingId),
  }),
);

export const userFollows = pgTable(
  'UserFollow',
  {
    id: text('id').notNull().primaryKey(),
    followerId: text('followerId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    followingId: text('followingId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    followerFollowingUnique: uniqueIndex('UserFollow_followerId_followingId_key').on(
      table.followerId,
      table.followingId,
    ),
  }),
);

export const commentReactions = pgTable(
  'CommentReaction',
  {
    id: text('id').notNull().primaryKey(),
    commentId: text('commentId')
      .notNull()
      .references(() => comments.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    type: text('type').notNull().default('LIKE'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    commentUserTypeUnique: uniqueIndex(
      'CommentReaction_commentId_userId_type_key',
    ).on(table.commentId, table.userId, table.type),
  }),
);

export const moderationReports = pgTable(
  'ModerationReport',
  {
    id: text('id').notNull().primaryKey(),
    reporterId: text('reporterId').references(() => users.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    targetType: moderationTargetTypeEnum('targetType').notNull(),
    targetId: text('targetId').notNull(),
    reason: text('reason'),
    status: moderationStatusEnum('status').notNull().default('PENDING'),
    notes: jsonb('notes'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    resolvedAt: timestamp('resolvedAt', { mode: 'string' }),
  },
);

export const userBlocks = pgTable(
  'UserBlock',
  {
    id: text('id').notNull().primaryKey(),
    blockerId: text('blockerId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    blockedUserId: text('blockedUserId')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    blockerBlockedUnique: uniqueIndex('UserBlock_blockerId_blockedUserId_key').on(
      table.blockerId,
      table.blockedUserId,
    ),
  }),
);

// Relations

export const usersRelations = relations(users, ({ many, one }) => ({
  projects: many(projects, { relationName: 'OwnerProjects' }),
  collaborations: many(projectCollaborators),
  fundings: many(fundings),
  posts: many(posts),
  comments: many(comments),
  postLikes: many(postLikes),
  postDislikes: many(postDislikes),
  commentReactions: many(commentReactions),
  notifications: many(notifications),
  partner: one(partners),
  orders: many(orders),
  wallet: one(wallets),
  auditLogs: many(auditLogs),
  permissions: many(userPermissions),
  following: many(userFollows, { relationName: 'UserFollowing' }),
  followers: many(userFollows, { relationName: 'UserFollowers' }),
  filedReports: many(moderationReports, {
    relationName: 'ModerationReportReporter',
  }),
  blockedUsers: many(userBlocks, { relationName: 'UserBlocker' }),
  blockedBy: many(userBlocks, { relationName: 'UserBlocked' }),
  visitLogs: many(visitLogs),
  authDevices: many(authDevices),
  authSessions: many(authSessions),
}));

export const projectsRelations = relations(projects, ({ many, one }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
    relationName: 'OwnerProjects',
  }),
  collaborators: many(projectCollaborators),
  fundings: many(fundings),
  settlements: many(settlements),
  partnerMatches: many(partnerMatches),
  products: many(products),
  posts: many(posts),
  milestoneEntries: many(projectMilestones),
  rewardTierEntries: many(projectRewardTiers),
  requirements: many(projectRequirements),
}));

export const projectMilestonesRelations = relations(
  projectMilestones,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectMilestones.projectId],
      references: [projects.id],
    }),
    posts: many(posts, {
      relationName: 'ProjectMilestonePosts',
    }),
  }),
);

export const projectRewardTiersRelations = relations(
  projectRewardTiers,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectRewardTiers.projectId],
      references: [projects.id],
    }),
  }),
);

export const projectRequirementsRelations = relations(
  projectRequirements,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectRequirements.projectId],
      references: [projects.id],
    }),
  }),
);

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

export const projectCollaboratorsRelations = relations(
  projectCollaborators,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectCollaborators.projectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [projectCollaborators.userId],
      references: [users.id],
    }),
  }),
);

export const authDevicesRelations = relations(authDevices, ({ one, many }) => ({
  user: one(users, {
    fields: [authDevices.userId],
    references: [users.id],
  }),
  sessions: many(authSessions),
}));

export const authSessionsRelations = relations(authSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
  device: one(authDevices, {
    fields: [authSessions.deviceId],
    references: [authDevices.id],
  }),
  refreshTokens: many(refreshTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  session: one(authSessions, {
    fields: [refreshTokens.sessionId],
    references: [authSessions.id],
  }),
  rotatedTo: one(refreshTokens, {
    fields: [refreshTokens.rotatedToId],
    references: [refreshTokens.id],
    relationName: 'RefreshTokenRotation',
  }),
  rotatedFrom: one(refreshTokens, {
    relationName: 'RefreshTokenRotation',
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
  transaction: one(paymentTransactions),
}));

export const settlementsRelations = relations(settlements, ({ one, many }) => ({
  project: one(projects, {
    fields: [settlements.projectId],
    references: [projects.id],
  }),
  payouts: many(settlementPayouts),
}));

export const settlementPayoutsRelations = relations(
  settlementPayouts,
  ({ one }) => ({
    settlement: one(settlements, {
      fields: [settlementPayouts.settlementId],
      references: [settlements.id],
    }),
  }),
);

export const productsRelations = relations(products, ({ one, many }) => ({
  project: one(projects, {
    fields: [products.projectId],
    references: [projects.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
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
  milestone: one(projectMilestones, {
    fields: [posts.milestoneId],
    references: [projectMilestones.id],
    relationName: 'ProjectMilestonePosts',
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
    relationName: 'CommentReplies',
  }),
  replies: many(comments, {
    relationName: 'CommentReplies',
  }),
  reactions: many(commentReactions),
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const visitLogsRelations = relations(visitLogs, ({ one }) => ({
  user: one(users, {
    fields: [visitLogs.userId],
    references: [users.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  users: many(userPermissions),
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
  permission: one(permissions, {
    fields: [userPermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const paymentTransactionsRelations = relations(
  paymentTransactions,
  ({ one }) => ({
    funding: one(fundings, {
      fields: [paymentTransactions.fundingId],
      references: [fundings.id],
    }),
  }),
);

export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(users, {
    fields: [userFollows.followerId],
    references: [users.id],
    relationName: 'UserFollowing',
  }),
  following: one(users, {
    fields: [userFollows.followingId],
    references: [users.id],
    relationName: 'UserFollowers',
  }),
}));

export const commentReactionsRelations = relations(commentReactions, ({ one }) => ({
  comment: one(comments, {
    fields: [commentReactions.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [commentReactions.userId],
    references: [users.id],
  }),
}));

export const moderationReportsRelations = relations(
  moderationReports,
  ({ one }) => ({
    reporter: one(users, {
      fields: [moderationReports.reporterId],
      references: [users.id],
      relationName: 'ModerationReportReporter',
    }),
  }),
);

export const userBlocksRelations = relations(userBlocks, ({ one }) => ({
  blocker: one(users, {
    fields: [userBlocks.blockerId],
    references: [users.id],
    relationName: 'UserBlocker',
  }),
  blocked: one(users, {
    fields: [userBlocks.blockedUserId],
    references: [users.id],
    relationName: 'UserBlocked',
  }),
}));
