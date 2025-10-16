import { relations } from "drizzle-orm/relations";
import {
	users, partners, partnerMatches, projects, products, orders, posts, projectMilestones,
	comments, notification, postLikes, wallets, auditLogs, permissions, userPermissions,
	fundings, paymentTransactions, settlements, settlementPayouts, projectCollaborators,
	projectRewardTiers, projectRequirements, orderItems, userFollows, commentReactions,
	moderationReports, userBlocks, authDevices, authSessions, refreshTokens, postDislikes, visitLogs
} from "./schema";

export const partnerRelations = relations(partners, ({ one, many }) => ({
	user: one(users, {
		fields: [partners.userId],
		references: [users.id]
	}),
	partnerMatches: many(partnerMatches),
}));

export const userRelations = relations(users, ({ many }) => ({
	partners: many(partners),
	orders: many(orders),
	posts: many(posts),
	comments: many(comments),
	notifications: many(notification),
	postLikes: many(postLikes),
	wallets: many(wallets),
	auditLogs: many(auditLogs),
	userPermissions: many(userPermissions),
	projects: many(projects),
	projectCollaborators: many(projectCollaborators),
	fundings: many(fundings),
	userFollows_followerId: many(userFollows, {
		relationName: "userFollow_followerId_user_id"
	}),
	userFollows_followingId: many(userFollows, {
		relationName: "userFollow_followingId_user_id"
	}),
	commentReactions: many(commentReactions),
	moderationReports: many(moderationReports),
	userBlocks_blockedUserId: many(userBlocks, {
		relationName: "userBlock_blockedUserId_user_id"
	}),
	userBlocks_blockerId: many(userBlocks, {
		relationName: "userBlock_blockerId_user_id"
	}),
	authSessions: many(authSessions),
	authDevices: many(authDevices),
	postDislikes: many(postDislikes),
	visitLogs: many(visitLogs),
}));

export const partnerMatchRelations = relations(partnerMatches, ({ one }) => ({
	partner: one(partners, {
		fields: [partnerMatches.partnerId],
		references: [partners.id]
	}),
	project: one(projects, {
		fields: [partnerMatches.projectId],
		references: [projects.id]
	}),
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
	partnerMatches: many(partnerMatches),
	products: many(products),
	posts: many(posts),
	user: one(users, {
		fields: [projects.ownerId],
		references: [users.id]
	}),
	projectCollaborators: many(projectCollaborators),
	fundings: many(fundings),
	settlements: many(settlements),
	projectMilestones: many(projectMilestones),
	projectRewardTiers: many(projectRewardTiers),
	projectRequirements: many(projectRequirements),
}));

export const productRelations = relations(products, ({ one, many }) => ({
	project: one(projects, {
		fields: [products.projectId],
		references: [projects.id]
	}),
	orderItems: many(orderItems),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	orderItems: many(orderItems),
}));

export const postRelations = relations(posts, ({ one, many }) => ({
	user: one(users, {
		fields: [posts.authorId],
		references: [users.id]
	}),
	projectMilestone: one(projectMilestones, {
		fields: [posts.milestoneId],
		references: [projectMilestones.id]
	}),
	project: one(projects, {
		fields: [posts.projectId],
		references: [projects.id]
	}),
	comments: many(comments),
	postLikes: many(postLikes),
	postDislikes: many(postDislikes),
}));

export const projectMilestoneRelations = relations(projectMilestones, ({ one, many }) => ({
	posts: many(posts),
	project: one(projects, {
		fields: [projectMilestones.projectId],
		references: [projects.id]
	}),
}));

export const commentRelations = relations(comments, ({ one, many }) => ({
	user: one(users, {
		fields: [comments.authorId],
		references: [users.id]
	}),
	comment: one(comments, {
		fields: [comments.parentCommentId],
		references: [comments.id],
		relationName: "comment_parentCommentId_comment_id"
	}),
	comments: many(comments, {
		relationName: "comment_parentCommentId_comment_id"
	}),
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id]
	}),
	commentReactions: many(commentReactions),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
	user: one(users, {
		fields: [notification.userId],
		references: [users.id]
	}),
}));

export const postLikeRelations = relations(postLikes, ({ one }) => ({
	post: one(posts, {
		fields: [postLikes.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [postLikes.userId],
		references: [users.id]
	}),
}));

export const walletRelations = relations(wallets, ({ one }) => ({
	user: one(users, {
		fields: [wallets.userId],
		references: [users.id]
	}),
}));

export const auditLogRelations = relations(auditLogs, ({ one }) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	}),
}));

export const userPermissionRelations = relations(userPermissions, ({ one }) => ({
	permission: one(permissions, {
		fields: [userPermissions.permissionId],
		references: [permissions.id]
	}),
	user: one(users, {
		fields: [userPermissions.userId],
		references: [users.id]
	}),
}));

export const permissionRelations = relations(permissions, ({ many }) => ({
	userPermissions: many(userPermissions),
}));

export const paymentTransactionRelations = relations(paymentTransactions, ({ one }) => ({
	funding: one(fundings, {
		fields: [paymentTransactions.fundingId],
		references: [fundings.id]
	}),
}));

export const fundingRelations = relations(fundings, ({ one, many }) => ({
	paymentTransactions: many(paymentTransactions),
	project: one(projects, {
		fields: [fundings.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [fundings.userId],
		references: [users.id]
	}),
}));

export const settlementPayoutRelations = relations(settlementPayouts, ({ one }) => ({
	settlement: one(settlements, {
		fields: [settlementPayouts.settlementId],
		references: [settlements.id]
	}),
}));

export const settlementRelations = relations(settlements, ({ one, many }) => ({
	settlementPayouts: many(settlementPayouts),
	project: one(projects, {
		fields: [settlements.projectId],
		references: [projects.id]
	}),
}));

export const projectCollaboratorRelations = relations(projectCollaborators, ({ one }) => ({
	project: one(projects, {
		fields: [projectCollaborators.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [projectCollaborators.userId],
		references: [users.id]
	}),
}));

export const projectRewardTierRelations = relations(projectRewardTiers, ({ one }) => ({
	project: one(projects, {
		fields: [projectRewardTiers.projectId],
		references: [projects.id]
	}),
}));

export const projectRequirementRelations = relations(projectRequirements, ({ one }) => ({
	project: one(projects, {
		fields: [projectRequirements.projectId],
		references: [projects.id]
	}),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
}));

export const userFollowRelations = relations(userFollows, ({ one }) => ({
	user_followerId: one(users, {
		fields: [userFollows.followerId],
		references: [users.id],
		relationName: "userFollow_followerId_user_id"
	}),
	user_followingId: one(users, {
		fields: [userFollows.followingId],
		references: [users.id],
		relationName: "userFollow_followingId_user_id"
	}),
}));

export const commentReactionRelations = relations(commentReactions, ({ one }) => ({
	comment: one(comments, {
		fields: [commentReactions.commentId],
		references: [comments.id]
	}),
	user: one(users, {
		fields: [commentReactions.userId],
		references: [users.id]
	}),
}));

export const moderationReportRelations = relations(moderationReports, ({ one }) => ({
	user: one(users, {
		fields: [moderationReports.reporterId],
		references: [users.id]
	}),
}));

export const userBlockRelations = relations(userBlocks, ({ one }) => ({
	user_blockedUserId: one(users, {
		fields: [userBlocks.blockedUserId],
		references: [users.id],
		relationName: "userBlock_blockedUserId_user_id"
	}),
	user_blockerId: one(users, {
		fields: [userBlocks.blockerId],
		references: [users.id],
		relationName: "userBlock_blockerId_user_id"
	}),
}));

export const authSessionRelations = relations(authSessions, ({ one, many }) => ({
	authDevice: one(authDevices, {
		fields: [authSessions.deviceId],
		references: [authDevices.id]
	}),
	user: one(users, {
		fields: [authSessions.userId],
		references: [users.id]
	}),
	refreshTokens: many(refreshTokens),
}));

export const authDeviceRelations = relations(authDevices, ({ one, many }) => ({
	authSessions: many(authSessions),
	user: one(users, {
		fields: [authDevices.userId],
		references: [users.id]
	}),
}));

export const refreshTokenRelations = relations(refreshTokens, ({ one, many }) => ({
	refreshToken: one(refreshTokens, {
		fields: [refreshTokens.rotatedToId],
		references: [refreshTokens.id],
		relationName: "refreshToken_rotatedToId_refreshToken_id"
	}),
	refreshTokens: many(refreshTokens, {
		relationName: "refreshToken_rotatedToId_refreshToken_id"
	}),
	authSession: one(authSessions, {
		fields: [refreshTokens.sessionId],
		references: [authSessions.id]
	}),
}));

export const postDislikeRelations = relations(postDislikes, ({ one }) => ({
	post: one(posts, {
		fields: [postDislikes.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [postDislikes.userId],
		references: [users.id]
	}),
}));

export const visitLogRelations = relations(visitLogs, ({ one }) => ({
	user: one(users, {
		fields: [visitLogs.userId],
		references: [users.id]
	}),
}));