import { pgTable, foreignKey, unique, text, jsonb, doublePrecision, boolean, timestamp, integer, index, uniqueIndex, json, numeric, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const communityCategory = pgEnum("CommunityCategory", ['GENERAL', 'NOTICE', 'COLLAB', 'SUPPORT', 'SHOWCASE'])
export const fundingStatus = pgEnum("FundingStatus", ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELLED'])
export const milestoneStatus = pgEnum("MilestoneStatus", ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'RELEASED'])
export const moderationStatus = pgEnum("ModerationStatus", ['PENDING', 'REVIEWING', 'ACTION_TAKEN', 'DISMISSED'])
export const moderationTargetType = pgEnum("ModerationTargetType", ['POST', 'COMMENT'])
export const notificationType = pgEnum("NotificationType", ['FUNDING_SUCCESS', 'NEW_COMMENT', 'PROJECT_MILESTONE', 'PARTNER_REQUEST', 'SETTLEMENT_PAID', 'SYSTEM'])
export const orderStatus = pgEnum("OrderStatus", ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'REFUNDED', 'CANCELLED'])
export const partnerMatchStatus = pgEnum("PartnerMatchStatus", ['REQUESTED', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED'])
export const partnerType = pgEnum("PartnerType", ['STUDIO', 'VENUE', 'PRODUCTION', 'MERCHANDISE', 'OTHER'])
export const paymentProvider = pgEnum("PaymentProvider", ['STRIPE', 'TOSS', 'PAYPAL', 'MANUAL'])
export const postType = pgEnum("PostType", ['UPDATE', 'DISCUSSION', 'AMA'])
export const productType = pgEnum("ProductType", ['PHYSICAL', 'DIGITAL'])
export const projectStatus = pgEnum("ProjectStatus", ['DRAFT', 'REVIEWING', 'LIVE', 'SUCCESSFUL', 'FAILED', 'EXECUTING', 'COMPLETED'])
export const settlementPayoutStatus = pgEnum("SettlementPayoutStatus", ['PENDING', 'IN_PROGRESS', 'PAID'])
export const settlementStakeholderType = pgEnum("SettlementStakeholderType", ['PLATFORM', 'CREATOR', 'PARTNER', 'COLLABORATOR', 'OTHER'])
export const userRole = pgEnum("UserRole", ['CREATOR', 'PARTICIPANT', 'PARTNER', 'ADMIN'])
export const communityCategory = pgEnum("community_category", ['GENERAL', 'QUESTION', 'REVIEW', 'SUGGESTION', 'NOTICE', 'COLLAB', 'SUPPORT', 'SHOWCASE'])
export const deliveryType = pgEnum("delivery_type", ['SHIPPING', 'PICKUP', 'DIGITAL', 'TICKET'])
export const fundingStatus = pgEnum("funding_status", ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELLED'])
export const milestoneStatus = pgEnum("milestone_status", ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'RELEASED'])
export const moderationStatus = pgEnum("moderation_status", ['PENDING', 'REVIEWING', 'ACTION_TAKEN', 'DISMISSED'])
export const moderationTargetType = pgEnum("moderation_target_type", ['POST', 'COMMENT'])
export const notificationType = pgEnum("notification_type", ['FUNDING_SUCCESS', 'NEW_COMMENT', 'PROJECT_MILESTONE', 'PARTNER_REQUEST', 'SETTLEMENT_PAID', 'SYSTEM'])
export const orderStatus = pgEnum("order_status", ['PENDING', 'PAID_PENDING_CAPTURE', 'PAID', 'SHIPPED', 'DELIVERED', 'REFUNDED', 'CANCELLED'])
export const partnerMatchStatus = pgEnum("partner_match_status", ['REQUESTED', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED'])
export const partnerType = pgEnum("partner_type", ['STUDIO', 'VENUE', 'PRODUCTION', 'MERCHANDISE', 'OTHER'])
export const paymentProvider = pgEnum("payment_provider", ['STRIPE', 'TOSS', 'PAYPAL', 'MANUAL'])
export const postStatus = pgEnum("post_status", ['ACTIVE', 'HIDDEN', 'DELETED'])
export const postType = pgEnum("post_type", ['UPDATE', 'DISCUSSION', 'AMA'])
export const productType = pgEnum("product_type", ['PHYSICAL', 'DIGITAL'])
export const projectStatus = pgEnum("project_status", ['DRAFT', 'PRELAUNCH', 'LIVE', 'SUCCEEDED', 'FAILED', 'SETTLING', 'EXECUTING', 'COMPLETED', 'CANCELLED'])
export const settlementPayoutStatus = pgEnum("settlement_payout_status", ['PENDING', 'IN_PROGRESS', 'PAID'])
export const settlementStakeholderType = pgEnum("settlement_stakeholder_type", ['PLATFORM', 'CREATOR', 'PARTNER', 'COLLABORATOR', 'OTHER'])
export const settlementStatus = pgEnum("settlement_status", ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'])
export const ticketStatus = pgEnum("ticket_status", ['PENDING', 'ISSUED', 'USED', 'CANCELLED'])
export const userRole = pgEnum("user_role", ['CREATOR', 'PARTICIPANT', 'PARTNER', 'ADMIN'])


export const partner = pgTable("Partner", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	userId: text().notNull(),
	type: partnerType().notNull(),
	name: text().notNull(),
	description: text(),
	services: jsonb(),
	pricingModel: text(),
	rating: doublePrecision(),
	contactInfo: text().notNull(),
	verified: boolean().default(false).notNull(),
	location: text(),
	availability: jsonb(),
	portfolioUrl: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Partner_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("Partner_userId_key").on(table.userId),
]);

export const partnerMatch = pgTable("PartnerMatch", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	projectId: text().notNull(),
	partnerId: text().notNull(),
	status: partnerMatchStatus().default('REQUESTED').notNull(),
	quote: integer(),
	settlementShare: doublePrecision(),
	contractUrl: text(),
	requirements: jsonb(),
	responseMessage: text(),
	notes: jsonb(),
	acceptedAt: timestamp({ precision: 3, mode: 'string' }),
	completedAt: timestamp({ precision: 3, mode: 'string' }),
	cancelledAt: timestamp({ precision: 3, mode: 'string' }),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [partner.id],
			name: "PartnerMatch_partnerId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "PartnerMatch_projectId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const product = pgTable("Product", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	projectId: text().notNull(),
	name: text().notNull(),
	type: productType().notNull(),
	price: integer().notNull(),
	currency: text().default('KRW').notNull(),
	inventory: integer(),
	images: text().array().default(["RAY"]),
	metadata: jsonb(),
	sku: text(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "Product_projectId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const order = pgTable("Order", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	userId: text().notNull(),
	totalPrice: integer().notNull(),
	subtotal: integer().notNull(),
	currency: text().default('KRW').notNull(),
	orderStatus: orderStatus().default('PENDING').notNull(),
	shippingCost: integer(),
	taxAmount: integer(),
	discountTotal: integer(),
	shippingInfo: jsonb(),
	transactionId: text(),
	metadata: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Order_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const post = pgTable("Post", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	projectId: text(),
	authorId: text().notNull(),
	title: text().notNull(),
	content: text().notNull(),
	type: postType().default('UPDATE').notNull(),
	excerpt: text(),
	tags: text().array().default(["RAY"]),
	category: communityCategory().default('GENERAL').notNull(),
	language: text().default('ko').notNull(),
	scheduledAt: timestamp({ precision: 3, mode: 'string' }),
	publishedAt: timestamp({ precision: 3, mode: 'string' }),
	isPinned: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	visibility: text().default('PUBLIC'),
	attachments: jsonb(),
	milestoneId: text(),
}, (table) => [
	index("Post_authorId_idx").using("btree", table.authorId.asc().nullsLast().op("text_ops")),
	index("Post_projectId_idx").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [user.id],
			name: "Post_authorId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "Post_projectId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const comment = pgTable("Comment", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	postId: text().notNull(),
	authorId: text().notNull(),
	content: text().notNull(),
	parentCommentId: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	editedAt: timestamp({ precision: 3, mode: 'string' }),
	deletedAt: timestamp({ precision: 3, mode: 'string' }),
	isDeleted: boolean().default(false).notNull(),
}, (table) => [
	index("Comment_authorId_idx").using("btree", table.authorId.asc().nullsLast().op("text_ops")),
	index("Comment_postId_idx").using("btree", table.postId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [user.id],
			name: "Comment_authorId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.parentCommentId],
			foreignColumns: [table.id],
			name: "Comment_parentCommentId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [post.id],
			name: "Comment_postId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const kvStore9Cc0B97B = pgTable("kv_store_9cc0b97b", {
	key: text().primaryKey().notNull(),
	value: jsonb().notNull(),
}, (table) => [
	index("kv_store_9cc0b97b_key_idx").using("btree", table.key.asc().nullsLast().op("text_pattern_ops")),
]);

export const notification = pgTable("Notification", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	userId: text().notNull(),
	type: notificationType().notNull(),
	payload: jsonb().notNull(),
	read: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("Notification_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Notification_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const postLike = pgTable("PostLike", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	postId: text().notNull(),
	userId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [post.id],
			name: "PostLike_postId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "PostLike_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("PostLike_postId_userId_key").on(table.postId, table.userId),
]);

export const wallet = pgTable("Wallet", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	userId: text().notNull(),
	balance: integer().default(0).notNull(),
	pendingBalance: integer().default(0).notNull(),
	currency: text().default('KRW').notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Wallet_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("Wallet_userId_key").on(table.userId),
]);

export const auditLog = pgTable("AuditLog", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	userId: text(),
	entity: text().notNull(),
	entityId: text().notNull(),
	action: text().notNull(),
	data: jsonb(),
	ipAddress: text(),
	userAgent: text(),
	metadata: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "AuditLog_userId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const userPermission = pgTable("UserPermission", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	userId: text().notNull(),
	permissionId: text().notNull(),
	assignedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permission.id],
			name: "UserPermission_permissionId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "UserPermission_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("UserPermission_userId_permissionId_key").on(table.userId, table.permissionId),
]);

export const permission = pgTable("Permission", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	key: text().notNull(),
	description: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	unique("Permission_key_key").on(table.key),
]);

export const paymentTransaction = pgTable("PaymentTransaction", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	fundingId: text().notNull(),
	provider: paymentProvider().notNull(),
	externalId: text().notNull(),
	status: fundingStatus().notNull(),
	amount: integer().notNull(),
	currency: text().default('KRW').notNull(),
	gatewayFee: integer().default(0),
	rawPayload: jsonb(),
	metadata: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.fundingId],
			foreignColumns: [funding.id],
			name: "PaymentTransaction_fundingId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("PaymentTransaction_fundingId_key").on(table.fundingId),
]);

export const settlementPayout = pgTable("SettlementPayout", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	settlementId: text().notNull(),
	stakeholderType: settlementStakeholderType().notNull(),
	stakeholderId: text(),
	amount: integer().notNull(),
	percentage: doublePrecision(),
	status: settlementPayoutStatus().default('PENDING').notNull(),
	dueDate: timestamp({ precision: 3, mode: 'string' }),
	paidAt: timestamp({ precision: 3, mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.settlementId],
			foreignColumns: [settlement.id],
			name: "SettlementPayout_settlementId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const user = pgTable("User", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	role: userRole().default('PARTICIPANT').notNull(),
	passwordHash: text(),
	avatarUrl: text(),
	language: text().default('ko').notNull(),
	timezone: text(),
	bio: text(),
	socialLinks: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("User_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("User_email_key").on(table.email),
]);

export const project = pgTable("Project", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	targetAmount: integer().notNull(),
	currentAmount: integer().default(0).notNull(),
	currency: text().default('KRW').notNull(),
	status: projectStatus().default('DRAFT').notNull(),
	startDate: timestamp({ precision: 3, mode: 'string' }),
	endDate: timestamp({ precision: 3, mode: 'string' }),
	rewardTiers: jsonb(),
	milestones: jsonb(),
	thumbnail: text(),
	metadata: jsonb(),
	ownerId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("Project_ownerId_idx").using("btree", table.ownerId.asc().nullsLast().op("text_ops")),
	index("Project_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [user.id],
			name: "Project_ownerId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const projectCollaborator = pgTable("ProjectCollaborator", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	projectId: text().notNull(),
	userId: text().notNull(),
	role: text(),
	share: integer(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "ProjectCollaborator_projectId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "ProjectCollaborator_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("ProjectCollaborator_projectId_userId_key").on(table.projectId, table.userId),
]);

export const funding = pgTable("Funding", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	projectId: text().notNull(),
	userId: text().notNull(),
	amount: integer().notNull(),
	currency: text().default('KRW').notNull(),
	paymentIntentId: text(),
	paymentStatus: fundingStatus().default('PENDING').notNull(),
	rewardTier: jsonb(),
	metadata: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	refundedAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	index("Funding_projectId_idx").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
	index("Funding_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "Funding_projectId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Funding_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("Funding_paymentIntentId_key").on(table.paymentIntentId),
]);

export const settlement = pgTable("Settlement", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	projectId: text().notNull(),
	totalRaised: integer().notNull(),
	platformFee: integer().notNull(),
	creatorShare: integer().notNull(),
	partnerShare: integer().default(0).notNull(),
	collaboratorShare: integer().default(0).notNull(),
	gatewayFees: integer().default(0).notNull(),
	netAmount: integer().default(0).notNull(),
	payoutStatus: settlementPayoutStatus().default('PENDING').notNull(),
	distributionBreakdown: jsonb(),
	notes: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "Settlement_projectId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const projectMilestone = pgTable("ProjectMilestone", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	projectId: text().notNull(),
	title: text().notNull(),
	description: text(),
	dueDate: timestamp({ precision: 3, mode: 'string' }),
	releaseAmount: integer(),
	status: milestoneStatus().default('PLANNED').notNull(),
	order: integer().default(0).notNull(),
	completedAt: timestamp({ precision: 3, mode: 'string' }),
	releasedAt: timestamp({ precision: 3, mode: 'string' }),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "ProjectMilestone_projectId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const projectRewardTier = pgTable("ProjectRewardTier", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	projectId: text().notNull(),
	title: text().notNull(),
	description: text(),
	minimumAmount: integer().notNull(),
	limit: integer(),
	claimed: integer().default(0).notNull(),
	includes: text().array().default(["RAY"]),
	estimatedDelivery: timestamp({ precision: 3, mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "ProjectRewardTier_projectId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const projectRequirement = pgTable("ProjectRequirement", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	projectId: text().notNull(),
	category: text().notNull(),
	minBudget: integer(),
	maxBudget: integer(),
	location: text(),
	services: text().array().default(["RAY"]),
	startDate: timestamp({ precision: 3, mode: 'string' }),
	endDate: timestamp({ precision: 3, mode: 'string' }),
	notes: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "ProjectRequirement_projectId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const orderItem = pgTable("OrderItem", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	orderId: text().notNull(),
	productId: text().notNull(),
	quantity: integer().default(1).notNull(),
	unitPrice: integer().notNull(),
	totalPrice: integer().notNull(),
	metadata: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [order.id],
			name: "OrderItem_orderId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "OrderItem_productId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const userFollow = pgTable("UserFollow", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	followerId: text().notNull(),
	followingId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.followerId],
			foreignColumns: [user.id],
			name: "UserFollow_followerId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.followingId],
			foreignColumns: [user.id],
			name: "UserFollow_followingId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("UserFollow_followerId_followingId_key").on(table.followerId, table.followingId),
]);

export const commentReaction = pgTable("CommentReaction", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	commentId: text().notNull(),
	userId: text().notNull(),
	type: text().default('LIKE').notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [comment.id],
			name: "CommentReaction_commentId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "CommentReaction_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("CommentReaction_commentId_userId_type_key").on(table.commentId, table.userId, table.type),
]);

export const moderationReport = pgTable("ModerationReport", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	reporterId: text(),
	targetType: moderationTargetType().notNull(),
	targetId: text().notNull(),
	reason: text(),
	status: moderationStatus().default('PENDING').notNull(),
	notes: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	resolvedAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.reporterId],
			foreignColumns: [user.id],
			name: "ModerationReport_reporterId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const userBlock = pgTable("UserBlock", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	blockerId: text().notNull(),
	blockedUserId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.blockedUserId],
			foreignColumns: [user.id],
			name: "UserBlock_blockedUserId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.blockerId],
			foreignColumns: [user.id],
			name: "UserBlock_blockerId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("UserBlock_blockerId_blockedUserId_key").on(table.blockerId, table.blockedUserId),
]);

export const authSession = pgTable("AuthSession", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	deviceId: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	lastUsedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	ipHash: text(),
	uaHash: text(),
	remember: boolean().default(false).notNull(),
	isAdmin: boolean().default(false).notNull(),
	client: text().default('web').notNull(),
	absoluteExpiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	revokedAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	index("AuthSession_lastUsedAt_idx").using("btree", table.lastUsedAt.asc().nullsLast().op("timestamp_ops")),
	index("AuthSession_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.deviceId],
			foreignColumns: [authDevice.id],
			name: "AuthSession_deviceId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "AuthSession_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const authDevice = pgTable("AuthDevice", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	userId: text().notNull(),
	deviceName: text(),
	deviceType: text(),
	os: text(),
	client: text().default('web').notNull(),
	uaHash: text(),
	ipHash: text(),
	fingerprint: text(),
	trusted: boolean().default(false).notNull(),
	revokedAt: timestamp({ precision: 3, mode: 'string' }),
	lastSeenAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("AuthDevice_fingerprint_idx").using("btree", table.fingerprint.asc().nullsLast().op("text_ops")),
	index("AuthDevice_lastSeenAt_idx").using("btree", table.lastSeenAt.asc().nullsLast().op("timestamp_ops")),
	index("AuthDevice_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "AuthDevice_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const refreshToken = pgTable("RefreshToken", {
	id: text().primaryKey().notNull(),
	sessionId: text().notNull(),
	tokenHash: text().notNull(),
	tokenFingerprint: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	inactivityExpiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	absoluteExpiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	usedAt: timestamp({ precision: 3, mode: 'string' }),
	rotatedToId: text(),
	revokedAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	uniqueIndex("RefreshToken_rotatedToId_key").using("btree", table.rotatedToId.asc().nullsLast().op("text_ops")),
	index("RefreshToken_sessionId_idx").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	uniqueIndex("RefreshToken_tokenFingerprint_key").using("btree", table.tokenFingerprint.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.rotatedToId],
			foreignColumns: [table.id],
			name: "RefreshToken_rotatedToId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [authSession.id],
			name: "RefreshToken_sessionId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const tokenBlacklist = pgTable("TokenBlacklist", {
	jti: text().primaryKey().notNull(),
	expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
});

export const postDislike = pgTable("PostDislike", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	postId: text().notNull(),
	userId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("PostDislike_postId_idx").using("btree", table.postId.asc().nullsLast().op("text_ops")),
	index("PostDislike_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [post.id],
			name: "PostDislike_postId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "PostDislike_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	unique("PostDislike_post_user_unique").on(table.postId, table.userId),
]);

export const visitLog = pgTable("VisitLog", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	userId: text(),
	sessionId: text(),
	entity: text().notNull(),
	entityId: text().notNull(),
	route: text(),
	referrer: text(),
	client: text().default('web').notNull(),
	ipHash: text(),
	uaHash: text(),
	country: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	occurredAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	path: text(),
	userAgent: text(),
}, (table) => [
	index("VisitLog_createdAt_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("VisitLog_entity_entityId_idx").using("btree", table.entity.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("text_ops")),
	index("VisitLog_occurredAt_idx").using("btree", table.occurredAt.asc().nullsLast().op("timestamp_ops")),
	index("VisitLog_path_idx").using("btree", table.path.asc().nullsLast().op("text_ops")),
	index("VisitLog_sessionId_idx").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("VisitLog_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [authSession.id],
			name: "VisitLog_sessionId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "VisitLog_userId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const posts = pgTable("posts", {
	id: text().primaryKey().notNull(),
	projectId: text("project_id"),
	authorId: text("author_id").notNull(),
	title: text().notNull(),
	content: text().notNull(),
	type: postType().default('DISCUSSION').notNull(),
	visibility: text().default('PUBLIC'),
	attachments: json(),
	milestoneId: text("milestone_id"),
	excerpt: text(),
	tags: text().array().default([""]),
	category: communityCategory().default('GENERAL').notNull(),
	language: text().default('ko').notNull(),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	isPinned: boolean("is_pinned").default(false).notNull(),
	isAnonymous: boolean("is_anonymous").default(false).notNull(),
	status: postStatus().default('ACTIVE').notNull(),
	likesCount: integer("likes_count").default(0).notNull(),
	reportsCount: integer("reports_count").default(0).notNull(),
	editedAt: timestamp("edited_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "posts_author_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "posts_project_id_projects_id_fk"
		}),
]);

export const comments = pgTable("comments", {
	id: text().primaryKey().notNull(),
	postId: text("post_id").notNull(),
	authorId: text("author_id").notNull(),
	content: text().notNull(),
	parentCommentId: text("parent_comment_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	editedAt: timestamp("edited_at", { mode: 'string' }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	isDeleted: boolean("is_deleted").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "comments_author_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.parentCommentId],
			foreignColumns: [table.id],
			name: "comments_parent_comment_id_comments_id_fk"
		}),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "comments_post_id_posts_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	role: userRole().default('PARTICIPANT').notNull(),
	passwordHash: text("password_hash"),
	avatarUrl: text("avatar_url"),
	language: text().default('ko').notNull(),
	timezone: text(),
	bio: text(),
	socialLinks: json("social_links"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const projects = pgTable("projects", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	targetAmount: integer("target_amount").notNull(),
	currentAmount: integer("current_amount").default(0).notNull(),
	currency: text().default('KRW').notNull(),
	status: projectStatus().default('DRAFT').notNull(),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	rewardTiers: json("reward_tiers"),
	milestones: json(),
	thumbnail: text(),
	metadata: json(),
	ownerId: text("owner_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "projects_owner_id_users_id_fk"
		}),
]);

export const fundings = pgTable("fundings", {
	id: text().primaryKey().notNull(),
	projectId: text("project_id").notNull(),
	userId: text("user_id").notNull(),
	amount: integer().notNull(),
	currency: text().default('KRW').notNull(),
	paymentIntentId: text("payment_intent_id"),
	paymentStatus: fundingStatus("payment_status").default('PENDING').notNull(),
	rewardTier: json("reward_tier"),
	metadata: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	refundedAt: timestamp("refunded_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "fundings_project_id_projects_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fundings_user_id_users_id_fk"
		}),
	unique("fundings_payment_intent_id_unique").on(table.paymentIntentId),
]);

export const notifications = pgTable("notifications", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	type: notificationType().notNull(),
	title: text().notNull(),
	content: text().notNull(),
	metadata: json(),
	relatedId: text("related_id"),
	relatedType: text("related_type"),
	isRead: boolean("is_read").default(false).notNull(),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}),
]);

export const orders = pgTable("orders", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	projectId: text("project_id"),
	totalPrice: integer("total_price").notNull(),
	subtotal: integer().notNull(),
	currency: text().default('KRW').notNull(),
	orderStatus: orderStatus("order_status").default('PENDING').notNull(),
	shippingCost: integer("shipping_cost"),
	taxAmount: integer("tax_amount"),
	discountTotal: integer("discount_total"),
	shippingInfo: json("shipping_info"),
	transactionId: text("transaction_id"),
	metadata: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "orders_project_id_projects_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}),
]);

export const partnerMatches = pgTable("partner_matches", {
	id: text().primaryKey().notNull(),
	projectId: text("project_id").notNull(),
	partnerId: text("partner_id").notNull(),
	status: partnerMatchStatus().default('REQUESTED').notNull(),
	quote: integer(),
	settlementShare: numeric("settlement_share", { precision: 5, scale:  2 }),
	contractUrl: text("contract_url"),
	requirements: json(),
	responseMessage: text("response_message"),
	notes: json(),
	acceptedAt: timestamp("accepted_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [partners.id],
			name: "partner_matches_partner_id_partners_id_fk"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "partner_matches_project_id_projects_id_fk"
		}),
]);

export const partners = pgTable("partners", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	type: partnerType().notNull(),
	name: text().notNull(),
	description: text(),
	services: json(),
	pricingModel: text("pricing_model"),
	rating: numeric({ precision: 3, scale:  2 }),
	contactInfo: text("contact_info").notNull(),
	verified: boolean().default(false).notNull(),
	location: text(),
	availability: json(),
	portfolioUrl: text("portfolio_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "partners_user_id_users_id_fk"
		}),
	unique("partners_user_id_unique").on(table.userId),
]);

export const products = pgTable("products", {
	id: text().primaryKey().notNull(),
	projectId: text("project_id").notNull(),
	name: text().notNull(),
	type: productType().notNull(),
	price: integer().notNull(),
	currency: text().default('KRW').notNull(),
	inventory: integer(),
	images: text().array().default([""]),
	metadata: json(),
	sku: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "products_project_id_projects_id_fk"
		}),
]);

export const projectCollaborators = pgTable("project_collaborators", {
	id: text().primaryKey().notNull(),
	projectId: text("project_id").notNull(),
	userId: text("user_id").notNull(),
	role: text(),
	share: integer(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_collaborators_project_id_projects_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "project_collaborators_user_id_users_id_fk"
		}),
]);

export const settlements = pgTable("settlements", {
	id: text().primaryKey().notNull(),
	projectId: text("project_id").notNull(),
	totalAmount: integer("total_amount").notNull(),
	platformFee: integer("platform_fee").notNull(),
	netAmount: integer("net_amount").notNull(),
	status: settlementStatus().default('PENDING').notNull(),
	metadata: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "settlements_project_id_projects_id_fk"
		}),
]);

export const wallets = pgTable("wallets", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	balance: integer().default(0).notNull(),
	pendingBalance: integer("pending_balance").default(0).notNull(),
	currency: text().default('KRW').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wallets_user_id_users_id_fk"
		}),
	unique("wallets_user_id_unique").on(table.userId),
]);
