import { pgTable, uniqueIndex, foreignKey, text, jsonb, doublePrecision, boolean, timestamp, integer, index, pgEnum } from "drizzle-orm/pg-core"
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


export const partner = pgTable("Partner", {
	id: text().primaryKey().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("Partner_userId_key").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Partner_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const partnerMatch = pgTable("PartnerMatch", {
	id: text().primaryKey().notNull(),
	projectId: text().notNull(),
	partnerId: text().notNull(),
	status: partnerMatchStatus().default('REQUESTED').notNull(),
	quote: integer(),
	settlementShare: doublePrecision(),
	contractUrl: text(),
	requirements: jsonb(),
	responseMessage: text(),
	notes: jsonb(),
	acceptedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	cancelledAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [partner.id],
			name: "PartnerMatch_partnerId_Partner_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "PartnerMatch_projectId_Project_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const product = pgTable("Product", {
	id: text().primaryKey().notNull(),
	projectId: text().notNull(),
	name: text().notNull(),
	type: productType().notNull(),
	price: integer().notNull(),
	currency: text().default('KRW').notNull(),
	inventory: integer(),
	images: text().array().default(["RAY"]).notNull(),
	metadata: jsonb(),
	sku: text(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "Product_projectId_Project_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const order = pgTable("Order", {
	id: text().primaryKey().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Order_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const post = pgTable("Post", {
	id: text().primaryKey().notNull(),
	projectId: text(),
	authorId: text().notNull(),
	title: text().notNull(),
	content: text().notNull(),
	type: postType().default('UPDATE').notNull(),
	excerpt: text(),
	tags: text().array().default(["RAY"]).notNull(),
	category: communityCategory().default('GENERAL').notNull(),
	language: text().default('ko').notNull(),
	scheduledAt: timestamp({ mode: 'string' }),
	publishedAt: timestamp({ mode: 'string' }),
	isPinned: boolean().default(false).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
	visibility: text().default('PUBLIC'),
	attachments: jsonb(),
	milestoneId: text(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [user.id],
			name: "Post_authorId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.milestoneId],
			foreignColumns: [projectMilestone.id],
			name: "Post_milestoneId_ProjectMilestone_id_fk"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "Post_projectId_Project_id_fk"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const comment = pgTable("Comment", {
	id: text().primaryKey().notNull(),
	postId: text().notNull(),
	authorId: text().notNull(),
	content: text().notNull(),
	parentCommentId: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
	editedAt: timestamp({ mode: 'string' }),
	deletedAt: timestamp({ mode: 'string' }),
	isDeleted: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [user.id],
			name: "Comment_authorId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.parentCommentId],
			foreignColumns: [table.id],
			name: "Comment_parentCommentId_Comment_id_fk"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [post.id],
			name: "Comment_postId_Post_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const notification = pgTable("Notification", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	type: notificationType().notNull(),
	payload: jsonb().notNull(),
	read: boolean().default(false).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Notification_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const postLike = pgTable("PostLike", {
	id: text().primaryKey().notNull(),
	postId: text().notNull(),
	userId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("PostLike_postId_userId_key").using("btree", table.postId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [post.id],
			name: "PostLike_postId_Post_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "PostLike_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const wallet = pgTable("Wallet", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	balance: integer().default(0).notNull(),
	pendingBalance: integer().default(0).notNull(),
	currency: text().default('KRW').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("Wallet_userId_key").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Wallet_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const auditLog = pgTable("AuditLog", {
	id: text().primaryKey().notNull(),
	userId: text(),
	entity: text().notNull(),
	entityId: text().notNull(),
	action: text().notNull(),
	data: jsonb(),
	ipAddress: text(),
	userAgent: text(),
	metadata: jsonb(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "AuditLog_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const userPermission = pgTable("UserPermission", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	permissionId: text().notNull(),
	assignedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("UserPermission_userId_permissionId_key").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.permissionId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permission.id],
			name: "UserPermission_permissionId_Permission_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "UserPermission_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const permission = pgTable("Permission", {
	id: text().primaryKey().notNull(),
	key: text().notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("Permission_key_key").using("btree", table.key.asc().nullsLast().op("text_ops")),
]);

export const paymentTransaction = pgTable("PaymentTransaction", {
	id: text().primaryKey().notNull(),
	fundingId: text().notNull(),
	provider: paymentProvider().notNull(),
	externalId: text().notNull(),
	status: fundingStatus().notNull(),
	amount: integer().notNull(),
	currency: text().default('KRW').notNull(),
	gatewayFee: integer().default(0),
	rawPayload: jsonb(),
	metadata: jsonb(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("PaymentTransaction_fundingId_key").using("btree", table.fundingId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.fundingId],
			foreignColumns: [funding.id],
			name: "PaymentTransaction_fundingId_Funding_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const settlementPayout = pgTable("SettlementPayout", {
	id: text().primaryKey().notNull(),
	settlementId: text().notNull(),
	stakeholderType: settlementStakeholderType().notNull(),
	stakeholderId: text(),
	amount: integer().notNull(),
	percentage: doublePrecision(),
	status: settlementPayoutStatus().default('PENDING').notNull(),
	dueDate: timestamp({ mode: 'string' }),
	paidAt: timestamp({ mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.settlementId],
			foreignColumns: [settlement.id],
			name: "SettlementPayout_settlementId_Settlement_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const user = pgTable("User", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	role: userRole().default('PARTICIPANT').notNull(),
	passwordHash: text(),
	avatarUrl: text(),
	language: text().default('ko').notNull(),
	timezone: text(),
	bio: text(),
	socialLinks: jsonb(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("User_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const project = pgTable("Project", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	targetAmount: integer().notNull(),
	currentAmount: integer().default(0).notNull(),
	currency: text().default('KRW').notNull(),
	status: projectStatus().default('DRAFT').notNull(),
	startDate: timestamp({ mode: 'string' }),
	endDate: timestamp({ mode: 'string' }),
	rewardTiers: jsonb(),
	milestones: jsonb(),
	thumbnail: text(),
	metadata: jsonb(),
	ownerId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [user.id],
			name: "Project_ownerId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const projectCollaborator = pgTable("ProjectCollaborator", {
	id: text().primaryKey().notNull(),
	projectId: text().notNull(),
	userId: text().notNull(),
	role: text(),
	share: integer(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("ProjectCollaborator_projectId_userId_key").using("btree", table.projectId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "ProjectCollaborator_projectId_Project_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "ProjectCollaborator_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const funding = pgTable("Funding", {
	id: text().primaryKey().notNull(),
	projectId: text().notNull(),
	userId: text().notNull(),
	amount: integer().notNull(),
	currency: text().default('KRW').notNull(),
	paymentIntentId: text(),
	paymentStatus: fundingStatus().default('PENDING').notNull(),
	rewardTier: jsonb(),
	metadata: jsonb(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
	refundedAt: timestamp({ mode: 'string' }),
}, (table) => [
	uniqueIndex("Funding_paymentIntentId_key").using("btree", table.paymentIntentId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "Funding_projectId_Project_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Funding_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const settlement = pgTable("Settlement", {
	id: text().primaryKey().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "Settlement_projectId_Project_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const projectMilestone = pgTable("ProjectMilestone", {
	id: text().primaryKey().notNull(),
	projectId: text().notNull(),
	title: text().notNull(),
	description: text(),
	dueDate: timestamp({ mode: 'string' }),
	releaseAmount: integer(),
	status: milestoneStatus().default('PLANNED').notNull(),
	order: integer().default(0).notNull(),
	completedAt: timestamp({ mode: 'string' }),
	releasedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "ProjectMilestone_projectId_Project_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const projectRewardTier = pgTable("ProjectRewardTier", {
	id: text().primaryKey().notNull(),
	projectId: text().notNull(),
	title: text().notNull(),
	description: text(),
	minimumAmount: integer().notNull(),
	limit: integer(),
	claimed: integer().default(0).notNull(),
	includes: text().array().default(["RAY"]).notNull(),
	estimatedDelivery: timestamp({ mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "ProjectRewardTier_projectId_Project_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const projectRequirement = pgTable("ProjectRequirement", {
	id: text().primaryKey().notNull(),
	projectId: text().notNull(),
	category: text().notNull(),
	minBudget: integer(),
	maxBudget: integer(),
	location: text(),
	services: text().array().default(["RAY"]).notNull(),
	startDate: timestamp({ mode: 'string' }),
	endDate: timestamp({ mode: 'string' }),
	notes: jsonb(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "ProjectRequirement_projectId_Project_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const orderItem = pgTable("OrderItem", {
	id: text().primaryKey().notNull(),
	orderId: text().notNull(),
	productId: text().notNull(),
	quantity: integer().default(1).notNull(),
	unitPrice: integer().notNull(),
	totalPrice: integer().notNull(),
	metadata: jsonb(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [order.id],
			name: "OrderItem_orderId_Order_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "OrderItem_productId_Product_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const userFollow = pgTable("UserFollow", {
	id: text().primaryKey().notNull(),
	followerId: text().notNull(),
	followingId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("UserFollow_followerId_followingId_key").using("btree", table.followerId.asc().nullsLast().op("text_ops"), table.followingId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.followerId],
			foreignColumns: [user.id],
			name: "UserFollow_followerId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.followingId],
			foreignColumns: [user.id],
			name: "UserFollow_followingId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const commentReaction = pgTable("CommentReaction", {
	id: text().primaryKey().notNull(),
	commentId: text().notNull(),
	userId: text().notNull(),
	type: text().default('LIKE').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("CommentReaction_commentId_userId_type_key").using("btree", table.commentId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops"), table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [comment.id],
			name: "CommentReaction_commentId_Comment_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "CommentReaction_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const moderationReport = pgTable("ModerationReport", {
	id: text().primaryKey().notNull(),
	reporterId: text(),
	targetType: moderationTargetType().notNull(),
	targetId: text().notNull(),
	reason: text(),
	status: moderationStatus().default('PENDING').notNull(),
	notes: jsonb(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.reporterId],
			foreignColumns: [user.id],
			name: "ModerationReport_reporterId_User_id_fk"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const userBlock = pgTable("UserBlock", {
	id: text().primaryKey().notNull(),
	blockerId: text().notNull(),
	blockedUserId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("UserBlock_blockerId_blockedUserId_key").using("btree", table.blockerId.asc().nullsLast().op("text_ops"), table.blockedUserId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.blockedUserId],
			foreignColumns: [user.id],
			name: "UserBlock_blockedUserId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.blockerId],
			foreignColumns: [user.id],
			name: "UserBlock_blockerId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const authSession = pgTable("AuthSession", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	deviceId: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	lastUsedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipHash: text(),
	uaHash: text(),
	remember: boolean().default(false).notNull(),
	isAdmin: boolean().default(false).notNull(),
	client: text().default('web').notNull(),
	absoluteExpiresAt: timestamp({ mode: 'string' }).notNull(),
	revokedAt: timestamp({ mode: 'string' }),
}, (table) => [
	index("AuthSession_lastUsedAt_idx").using("btree", table.lastUsedAt.asc().nullsLast().op("timestamp_ops")),
	index("AuthSession_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.deviceId],
			foreignColumns: [authDevice.id],
			name: "AuthSession_deviceId_AuthDevice_id_fk"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "AuthSession_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const authDevice = pgTable("AuthDevice", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	deviceName: text(),
	deviceType: text(),
	os: text(),
	client: text().default('web').notNull(),
	uaHash: text(),
	ipHash: text(),
	fingerprint: text(),
	trusted: boolean().default(false).notNull(),
	revokedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
	indexes: [
		index("AuthDevice_fingerprint_idx").using("btree", table.fingerprint.asc().nullsLast().op("text_ops")),
		index("AuthDevice_lastSeenAt_idx").using("btree", table.updatedAt.asc().nullsLast().op("timestamp_ops")),
		index("AuthDevice_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	],
	foreignKeys: [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "AuthDevice_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
	]
}));

export const refreshToken = pgTable("RefreshToken", {
	id: text().primaryKey().notNull(),
	sessionId: text().notNull(),
	tokenHash: text().notNull(),
	tokenFingerprint: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	inactivityExpiresAt: timestamp({ mode: 'string' }).notNull(),
	absoluteExpiresAt: timestamp({ mode: 'string' }).notNull(),
	usedAt: timestamp({ mode: 'string' }),
	rotatedToId: text(),
	revokedAt: timestamp({ mode: 'string' }),
}, (table) => [
	uniqueIndex("RefreshToken_rotatedToId_key").using("btree", table.rotatedToId.asc().nullsLast().op("text_ops")),
	index("RefreshToken_sessionId_idx").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	uniqueIndex("RefreshToken_tokenFingerprint_key").using("btree", table.tokenFingerprint.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.rotatedToId],
			foreignColumns: [table.id],
			name: "RefreshToken_rotatedToId_RefreshToken_id_fk"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [authSession.id],
			name: "RefreshToken_sessionId_AuthSession_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const tokenBlacklist = pgTable("TokenBlacklist", {
	jti: text().primaryKey().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
});

export const postDislike = pgTable("PostDislike", {
	id: text().primaryKey().notNull(),
	postId: text().notNull(),
	userId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("PostDislike_postId_userId_key").using("btree", table.postId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [post.id],
			name: "PostDislike_postId_Post_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "PostDislike_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const visitLog = pgTable("VisitLog", {
	id: text().primaryKey().notNull(),
	userId: text(),
	sessionId: text().notNull(),
	ipHash: text(),
	occurredAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	path: text(),
	userAgent: text(),
}, (table) => [
	index("VisitLog_occurredAt_idx").using("btree", table.occurredAt.asc().nullsLast().op("timestamp_ops")),
	index("VisitLog_sessionId_idx").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("VisitLog_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "VisitLog_userId_User_id_fk"
		}).onUpdate("cascade").onDelete("set null"),
]);

// Community tables
export const communityPosts = pgTable("CommunityPost", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	content: text().notNull(),
	category: communityCategory().notNull(),
	authorId: text().notNull(),
	projectId: text(),
	likesCount: integer().default(0).notNull(),
	commentsCount: integer().default(0).notNull(),
	isPinned: boolean().default(false).notNull(),
	status: text().default('PUBLISHED').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
		columns: [table.authorId],
		foreignColumns: [user.id],
		name: "CommunityPost_authorId_User_id_fk"
	}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
		columns: [table.projectId],
		foreignColumns: [project.id],
		name: "CommunityPost_projectId_Project_id_fk"
	}).onUpdate("cascade").onDelete("set null"),
]);

export const communityReports = pgTable("CommunityReport", {
	id: text().primaryKey().notNull(),
	reporterId: text().notNull(),
	targetType: moderationTargetType().notNull(),
	targetId: text().notNull(),
	reason: text(),
	status: moderationStatus().default('PENDING').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
		columns: [table.reporterId],
		foreignColumns: [user.id],
		name: "CommunityReport_reporterId_User_id_fk"
	}).onUpdate("cascade").onDelete("restrict"),
]);

// Export aliases for compatibility
export const users = user;
export const authSessions = authSession;
export const authDevices = authDevice;