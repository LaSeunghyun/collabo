import { relations } from "drizzle-orm/relations";
import { user, partner, partnerMatch, project, product, order, post, comment, notification, postLike, wallet, auditLog, permission, userPermission, funding, paymentTransaction, settlement, settlementPayout, projectCollaborator, projectMilestone, projectRewardTier, projectRequirement, orderItem, userFollow, commentReaction, moderationReport, userBlock, authDevice, authSession, refreshToken, postDislike, visitLog, users, posts, projects, comments, fundings, notifications, orders, partners, partnerMatches, products, projectCollaborators, settlements, wallets } from "./schema";

export const partnerRelations = relations(partner, ({one, many}) => ({
	user: one(user, {
		fields: [partner.userId],
		references: [user.id]
	}),
	partnerMatches: many(partnerMatch),
}));

export const userRelations = relations(user, ({many}) => ({
	partners: many(partner),
	orders: many(order),
	posts: many(post),
	comments: many(comment),
	notifications: many(notification),
	postLikes: many(postLike),
	wallets: many(wallet),
	auditLogs: many(auditLog),
	userPermissions: many(userPermission),
	projects: many(project),
	projectCollaborators: many(projectCollaborator),
	fundings: many(funding),
	userFollows_followerId: many(userFollow, {
		relationName: "userFollow_followerId_user_id"
	}),
	userFollows_followingId: many(userFollow, {
		relationName: "userFollow_followingId_user_id"
	}),
	commentReactions: many(commentReaction),
	moderationReports: many(moderationReport),
	userBlocks_blockedUserId: many(userBlock, {
		relationName: "userBlock_blockedUserId_user_id"
	}),
	userBlocks_blockerId: many(userBlock, {
		relationName: "userBlock_blockerId_user_id"
	}),
	authSessions: many(authSession),
	authDevices: many(authDevice),
	postDislikes: many(postDislike),
	visitLogs: many(visitLog),
}));

export const partnerMatchRelations = relations(partnerMatch, ({one}) => ({
	partner: one(partner, {
		fields: [partnerMatch.partnerId],
		references: [partner.id]
	}),
	project: one(project, {
		fields: [partnerMatch.projectId],
		references: [project.id]
	}),
}));

export const projectRelations = relations(project, ({one, many}) => ({
	partnerMatches: many(partnerMatch),
	products: many(product),
	posts: many(post),
	user: one(user, {
		fields: [project.ownerId],
		references: [user.id]
	}),
	projectCollaborators: many(projectCollaborator),
	fundings: many(funding),
	settlements: many(settlement),
	projectMilestones: many(projectMilestone),
	projectRewardTiers: many(projectRewardTier),
	projectRequirements: many(projectRequirement),
}));

export const productRelations = relations(product, ({one, many}) => ({
	project: one(project, {
		fields: [product.projectId],
		references: [project.id]
	}),
	orderItems: many(orderItem),
}));

export const orderRelations = relations(order, ({one, many}) => ({
	user: one(user, {
		fields: [order.userId],
		references: [user.id]
	}),
	orderItems: many(orderItem),
}));

export const postRelations = relations(post, ({one, many}) => ({
	user: one(user, {
		fields: [post.authorId],
		references: [user.id]
	}),
	project: one(project, {
		fields: [post.projectId],
		references: [project.id]
	}),
	comments: many(comment),
	postLikes: many(postLike),
	postDislikes: many(postDislike),
}));

export const commentRelations = relations(comment, ({one, many}) => ({
	user: one(user, {
		fields: [comment.authorId],
		references: [user.id]
	}),
	comment: one(comment, {
		fields: [comment.parentCommentId],
		references: [comment.id],
		relationName: "comment_parentCommentId_comment_id"
	}),
	comments: many(comment, {
		relationName: "comment_parentCommentId_comment_id"
	}),
	post: one(post, {
		fields: [comment.postId],
		references: [post.id]
	}),
	commentReactions: many(commentReaction),
}));

export const notificationRelations = relations(notification, ({one}) => ({
	user: one(user, {
		fields: [notification.userId],
		references: [user.id]
	}),
}));

export const postLikeRelations = relations(postLike, ({one}) => ({
	post: one(post, {
		fields: [postLike.postId],
		references: [post.id]
	}),
	user: one(user, {
		fields: [postLike.userId],
		references: [user.id]
	}),
}));

export const walletRelations = relations(wallet, ({one}) => ({
	user: one(user, {
		fields: [wallet.userId],
		references: [user.id]
	}),
}));

export const auditLogRelations = relations(auditLog, ({one}) => ({
	user: one(user, {
		fields: [auditLog.userId],
		references: [user.id]
	}),
}));

export const userPermissionRelations = relations(userPermission, ({one}) => ({
	permission: one(permission, {
		fields: [userPermission.permissionId],
		references: [permission.id]
	}),
	user: one(user, {
		fields: [userPermission.userId],
		references: [user.id]
	}),
}));

export const permissionRelations = relations(permission, ({many}) => ({
	userPermissions: many(userPermission),
}));

export const paymentTransactionRelations = relations(paymentTransaction, ({one}) => ({
	funding: one(funding, {
		fields: [paymentTransaction.fundingId],
		references: [funding.id]
	}),
}));

export const fundingRelations = relations(funding, ({one, many}) => ({
	paymentTransactions: many(paymentTransaction),
	project: one(project, {
		fields: [funding.projectId],
		references: [project.id]
	}),
	user: one(user, {
		fields: [funding.userId],
		references: [user.id]
	}),
}));

export const settlementPayoutRelations = relations(settlementPayout, ({one}) => ({
	settlement: one(settlement, {
		fields: [settlementPayout.settlementId],
		references: [settlement.id]
	}),
}));

export const settlementRelations = relations(settlement, ({one, many}) => ({
	settlementPayouts: many(settlementPayout),
	project: one(project, {
		fields: [settlement.projectId],
		references: [project.id]
	}),
}));

export const projectCollaboratorRelations = relations(projectCollaborator, ({one}) => ({
	project: one(project, {
		fields: [projectCollaborator.projectId],
		references: [project.id]
	}),
	user: one(user, {
		fields: [projectCollaborator.userId],
		references: [user.id]
	}),
}));

export const projectMilestoneRelations = relations(projectMilestone, ({one}) => ({
	project: one(project, {
		fields: [projectMilestone.projectId],
		references: [project.id]
	}),
}));

export const projectRewardTierRelations = relations(projectRewardTier, ({one}) => ({
	project: one(project, {
		fields: [projectRewardTier.projectId],
		references: [project.id]
	}),
}));

export const projectRequirementRelations = relations(projectRequirement, ({one}) => ({
	project: one(project, {
		fields: [projectRequirement.projectId],
		references: [project.id]
	}),
}));

export const orderItemRelations = relations(orderItem, ({one}) => ({
	order: one(order, {
		fields: [orderItem.orderId],
		references: [order.id]
	}),
	product: one(product, {
		fields: [orderItem.productId],
		references: [product.id]
	}),
}));

export const userFollowRelations = relations(userFollow, ({one}) => ({
	user_followerId: one(user, {
		fields: [userFollow.followerId],
		references: [user.id],
		relationName: "userFollow_followerId_user_id"
	}),
	user_followingId: one(user, {
		fields: [userFollow.followingId],
		references: [user.id],
		relationName: "userFollow_followingId_user_id"
	}),
}));

export const commentReactionRelations = relations(commentReaction, ({one}) => ({
	comment: one(comment, {
		fields: [commentReaction.commentId],
		references: [comment.id]
	}),
	user: one(user, {
		fields: [commentReaction.userId],
		references: [user.id]
	}),
}));

export const moderationReportRelations = relations(moderationReport, ({one}) => ({
	user: one(user, {
		fields: [moderationReport.reporterId],
		references: [user.id]
	}),
}));

export const userBlockRelations = relations(userBlock, ({one}) => ({
	user_blockedUserId: one(user, {
		fields: [userBlock.blockedUserId],
		references: [user.id],
		relationName: "userBlock_blockedUserId_user_id"
	}),
	user_blockerId: one(user, {
		fields: [userBlock.blockerId],
		references: [user.id],
		relationName: "userBlock_blockerId_user_id"
	}),
}));

export const authSessionRelations = relations(authSession, ({one, many}) => ({
	authDevice: one(authDevice, {
		fields: [authSession.deviceId],
		references: [authDevice.id]
	}),
	user: one(user, {
		fields: [authSession.userId],
		references: [user.id]
	}),
	refreshTokens: many(refreshToken),
	visitLogs: many(visitLog),
}));

export const authDeviceRelations = relations(authDevice, ({one, many}) => ({
	authSessions: many(authSession),
	user: one(user, {
		fields: [authDevice.userId],
		references: [user.id]
	}),
}));

export const refreshTokenRelations = relations(refreshToken, ({one, many}) => ({
	refreshToken: one(refreshToken, {
		fields: [refreshToken.rotatedToId],
		references: [refreshToken.id],
		relationName: "refreshToken_rotatedToId_refreshToken_id"
	}),
	refreshTokens: many(refreshToken, {
		relationName: "refreshToken_rotatedToId_refreshToken_id"
	}),
	authSession: one(authSession, {
		fields: [refreshToken.sessionId],
		references: [authSession.id]
	}),
}));

export const postDislikeRelations = relations(postDislike, ({one}) => ({
	post: one(post, {
		fields: [postDislike.postId],
		references: [post.id]
	}),
	user: one(user, {
		fields: [postDislike.userId],
		references: [user.id]
	}),
}));

export const visitLogRelations = relations(visitLog, ({one}) => ({
	authSession: one(authSession, {
		fields: [visitLog.sessionId],
		references: [authSession.id]
	}),
	user: one(user, {
		fields: [visitLog.userId],
		references: [user.id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	user: one(users, {
		fields: [posts.authorId],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [posts.projectId],
		references: [projects.id]
	}),
	comments: many(comments),
}));

export const usersRelations = relations(users, ({many}) => ({
	posts: many(posts),
	comments: many(comments),
	projects: many(projects),
	fundings: many(fundings),
	notifications: many(notifications),
	orders: many(orders),
	partners: many(partners),
	projectCollaborators: many(projectCollaborators),
	wallets: many(wallets),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	posts: many(posts),
	user: one(users, {
		fields: [projects.ownerId],
		references: [users.id]
	}),
	fundings: many(fundings),
	orders: many(orders),
	partnerMatches: many(partnerMatches),
	products: many(products),
	projectCollaborators: many(projectCollaborators),
	settlements: many(settlements),
}));

export const commentsRelations = relations(comments, ({one, many}) => ({
	user: one(users, {
		fields: [comments.authorId],
		references: [users.id]
	}),
	comment: one(comments, {
		fields: [comments.parentCommentId],
		references: [comments.id],
		relationName: "comments_parentCommentId_comments_id"
	}),
	comments: many(comments, {
		relationName: "comments_parentCommentId_comments_id"
	}),
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id]
	}),
}));

export const fundingsRelations = relations(fundings, ({one}) => ({
	project: one(projects, {
		fields: [fundings.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [fundings.userId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const ordersRelations = relations(orders, ({one}) => ({
	project: one(projects, {
		fields: [orders.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
}));

export const partnerMatchesRelations = relations(partnerMatches, ({one}) => ({
	partner: one(partners, {
		fields: [partnerMatches.partnerId],
		references: [partners.id]
	}),
	project: one(projects, {
		fields: [partnerMatches.projectId],
		references: [projects.id]
	}),
}));

export const partnersRelations = relations(partners, ({one, many}) => ({
	partnerMatches: many(partnerMatches),
	user: one(users, {
		fields: [partners.userId],
		references: [users.id]
	}),
}));

export const productsRelations = relations(products, ({one}) => ({
	project: one(projects, {
		fields: [products.projectId],
		references: [projects.id]
	}),
}));

export const projectCollaboratorsRelations = relations(projectCollaborators, ({one}) => ({
	project: one(projects, {
		fields: [projectCollaborators.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [projectCollaborators.userId],
		references: [users.id]
	}),
}));

export const settlementsRelations = relations(settlements, ({one}) => ({
	project: one(projects, {
		fields: [settlements.projectId],
		references: [projects.id]
	}),
}));

export const walletsRelations = relations(wallets, ({one}) => ({
	user: one(users, {
		fields: [wallets.userId],
		references: [users.id]
	}),
}));