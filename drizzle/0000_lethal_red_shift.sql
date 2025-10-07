CREATE TYPE "public"."CommunityCategory" AS ENUM('GENERAL', 'NOTICE', 'COLLAB', 'SUPPORT', 'SHOWCASE');--> statement-breakpoint
CREATE TYPE "public"."FundingStatus" AS ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."MilestoneStatus" AS ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'RELEASED');--> statement-breakpoint
CREATE TYPE "public"."ModerationStatus" AS ENUM('PENDING', 'REVIEWING', 'ACTION_TAKEN', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."ModerationTargetType" AS ENUM('POST', 'COMMENT');--> statement-breakpoint
CREATE TYPE "public"."NotificationType" AS ENUM('FUNDING_SUCCESS', 'NEW_COMMENT', 'PROJECT_MILESTONE', 'PARTNER_REQUEST', 'SETTLEMENT_PAID', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."OrderStatus" AS ENUM('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'REFUNDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."PartnerMatchStatus" AS ENUM('REQUESTED', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."PartnerType" AS ENUM('STUDIO', 'VENUE', 'PRODUCTION', 'MERCHANDISE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."PaymentProvider" AS ENUM('STRIPE', 'TOSS', 'PAYPAL', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."PostType" AS ENUM('UPDATE', 'DISCUSSION', 'AMA');--> statement-breakpoint
CREATE TYPE "public"."ProductType" AS ENUM('PHYSICAL', 'DIGITAL');--> statement-breakpoint
CREATE TYPE "public"."ProjectStatus" AS ENUM('DRAFT', 'REVIEWING', 'LIVE', 'SUCCESSFUL', 'FAILED', 'EXECUTING', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."SettlementPayoutStatus" AS ENUM('PENDING', 'IN_PROGRESS', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."SettlementStakeholderType" AS ENUM('PLATFORM', 'CREATOR', 'PARTNER', 'COLLABORATOR', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('CREATOR', 'PARTICIPANT', 'PARTNER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "AuditLog" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"entity" text NOT NULL,
	"entityId" text NOT NULL,
	"action" text NOT NULL,
	"data" jsonb,
	"ipAddress" text,
	"userAgent" text,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AuthDevice" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"deviceFingerprint" text NOT NULL,
	"firstSeenAt" timestamp DEFAULT now() NOT NULL,
	"lastSeenAt" timestamp DEFAULT now() NOT NULL,
	"label" text
);
--> statement-breakpoint
CREATE TABLE "AuthSession" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"deviceId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastUsedAt" timestamp DEFAULT now() NOT NULL,
	"ipHash" text,
	"uaHash" text,
	"remember" boolean DEFAULT false NOT NULL,
	"isAdmin" boolean DEFAULT false NOT NULL,
	"client" text DEFAULT 'web' NOT NULL,
	"absoluteExpiresAt" timestamp NOT NULL,
	"revokedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "CommentReaction" (
	"id" text PRIMARY KEY NOT NULL,
	"commentId" text NOT NULL,
	"userId" text NOT NULL,
	"type" text DEFAULT 'LIKE' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Comment" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"authorId" text NOT NULL,
	"content" text NOT NULL,
	"parentCommentId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"editedAt" timestamp,
	"deletedAt" timestamp,
	"isDeleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Funding" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"userId" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'KRW' NOT NULL,
	"paymentIntentId" text,
	"paymentStatus" "FundingStatus" DEFAULT 'PENDING' NOT NULL,
	"rewardTier" jsonb,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"refundedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "ModerationReport" (
	"id" text PRIMARY KEY NOT NULL,
	"reporterId" text,
	"targetType" "ModerationTargetType" NOT NULL,
	"targetId" text NOT NULL,
	"reason" text,
	"status" "ModerationStatus" DEFAULT 'PENDING' NOT NULL,
	"notes" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"resolvedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "Notification" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" "NotificationType" NOT NULL,
	"payload" jsonb NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OrderItem" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"productId" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unitPrice" integer NOT NULL,
	"totalPrice" integer NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Order" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"totalPrice" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"currency" text DEFAULT 'KRW' NOT NULL,
	"orderStatus" "OrderStatus" DEFAULT 'PENDING' NOT NULL,
	"shippingCost" integer,
	"taxAmount" integer,
	"discountTotal" integer,
	"shippingInfo" jsonb,
	"transactionId" text,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PartnerMatch" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"partnerId" text NOT NULL,
	"status" "PartnerMatchStatus" DEFAULT 'REQUESTED' NOT NULL,
	"quote" integer,
	"settlementShare" double precision,
	"contractUrl" text,
	"requirements" jsonb,
	"responseMessage" text,
	"notes" jsonb,
	"acceptedAt" timestamp,
	"completedAt" timestamp,
	"cancelledAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Partner" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" "PartnerType" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"services" jsonb,
	"pricingModel" text,
	"rating" double precision,
	"contactInfo" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"location" text,
	"availability" jsonb,
	"portfolioUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PaymentTransaction" (
	"id" text PRIMARY KEY NOT NULL,
	"fundingId" text NOT NULL,
	"provider" "PaymentProvider" NOT NULL,
	"externalId" text NOT NULL,
	"status" "FundingStatus" NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'KRW' NOT NULL,
	"gatewayFee" integer DEFAULT 0,
	"rawPayload" jsonb,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Permission" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PostDislike" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PostLike" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Post" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text,
	"authorId" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"type" "PostType" DEFAULT 'UPDATE' NOT NULL,
	"visibility" text DEFAULT 'PUBLIC',
	"attachments" jsonb,
	"milestoneId" text,
	"excerpt" text,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"category" "CommunityCategory" DEFAULT 'GENERAL' NOT NULL,
	"language" text DEFAULT 'ko' NOT NULL,
	"scheduledAt" timestamp,
	"publishedAt" timestamp,
	"isPinned" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Product" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"name" text NOT NULL,
	"type" "ProductType" NOT NULL,
	"price" integer NOT NULL,
	"currency" text DEFAULT 'KRW' NOT NULL,
	"inventory" integer,
	"images" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"metadata" jsonb,
	"sku" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProjectCollaborator" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"userId" text NOT NULL,
	"role" text,
	"share" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProjectMilestone" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"dueDate" timestamp,
	"releaseAmount" integer,
	"status" "MilestoneStatus" DEFAULT 'PLANNED' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"completedAt" timestamp,
	"releasedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProjectRequirement" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"category" text NOT NULL,
	"minBudget" integer,
	"maxBudget" integer,
	"location" text,
	"services" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"startDate" timestamp,
	"endDate" timestamp,
	"notes" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProjectRewardTier" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"minimumAmount" integer NOT NULL,
	"limit" integer,
	"claimed" integer DEFAULT 0 NOT NULL,
	"includes" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"estimatedDelivery" timestamp,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Project" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"targetAmount" integer NOT NULL,
	"currentAmount" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'KRW' NOT NULL,
	"status" "ProjectStatus" DEFAULT 'DRAFT' NOT NULL,
	"startDate" timestamp,
	"endDate" timestamp,
	"rewardTiers" jsonb,
	"milestones" jsonb,
	"thumbnail" text,
	"metadata" jsonb,
	"ownerId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "RefreshToken" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionId" text NOT NULL,
	"tokenHash" text NOT NULL,
	"tokenFingerprint" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"inactivityExpiresAt" timestamp NOT NULL,
	"absoluteExpiresAt" timestamp NOT NULL,
	"usedAt" timestamp,
	"rotatedToId" text,
	"revokedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "SettlementPayout" (
	"id" text PRIMARY KEY NOT NULL,
	"settlementId" text NOT NULL,
	"stakeholderType" "SettlementStakeholderType" NOT NULL,
	"stakeholderId" text,
	"amount" integer NOT NULL,
	"percentage" double precision,
	"status" "SettlementPayoutStatus" DEFAULT 'PENDING' NOT NULL,
	"dueDate" timestamp,
	"paidAt" timestamp,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Settlement" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"totalRaised" integer NOT NULL,
	"platformFee" integer NOT NULL,
	"creatorShare" integer NOT NULL,
	"partnerShare" integer DEFAULT 0 NOT NULL,
	"collaboratorShare" integer DEFAULT 0 NOT NULL,
	"gatewayFees" integer DEFAULT 0 NOT NULL,
	"netAmount" integer DEFAULT 0 NOT NULL,
	"payoutStatus" "SettlementPayoutStatus" DEFAULT 'PENDING' NOT NULL,
	"distributionBreakdown" jsonb,
	"notes" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TokenBlacklist" (
	"jti" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UserBlock" (
	"id" text PRIMARY KEY NOT NULL,
	"blockerId" text NOT NULL,
	"blockedUserId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UserFollow" (
	"id" text PRIMARY KEY NOT NULL,
	"followerId" text NOT NULL,
	"followingId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UserPermission" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"permissionId" text NOT NULL,
	"assignedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "UserRole" DEFAULT 'PARTICIPANT' NOT NULL,
	"passwordHash" text,
	"avatarUrl" text,
	"language" text DEFAULT 'ko' NOT NULL,
	"timezone" text,
	"bio" text,
	"socialLinks" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "VisitLog" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionId" text NOT NULL,
	"userId" text,
	"path" text,
	"userAgent" text,
	"ipHash" text,
	"occurredAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Wallet" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"pendingBalance" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'KRW' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AuthDevice" ADD CONSTRAINT "AuthDevice_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_deviceId_AuthDevice_id_fk" FOREIGN KEY ("deviceId") REFERENCES "public"."AuthDevice"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CommentReaction" ADD CONSTRAINT "CommentReaction_commentId_Comment_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."Comment"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CommentReaction" ADD CONSTRAINT "CommentReaction_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentCommentId_Comment_id_fk" FOREIGN KEY ("parentCommentId") REFERENCES "public"."Comment"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Funding" ADD CONSTRAINT "Funding_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Funding" ADD CONSTRAINT "Funding_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_reporterId_User_id_fk" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_Order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_Product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PartnerMatch" ADD CONSTRAINT "PartnerMatch_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PartnerMatch" ADD CONSTRAINT "PartnerMatch_partnerId_Partner_id_fk" FOREIGN KEY ("partnerId") REFERENCES "public"."Partner"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_fundingId_Funding_id_fk" FOREIGN KEY ("fundingId") REFERENCES "public"."Funding"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PostDislike" ADD CONSTRAINT "PostDislike_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PostDislike" ADD CONSTRAINT "PostDislike_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_milestoneId_ProjectMilestone_id_fk" FOREIGN KEY ("milestoneId") REFERENCES "public"."ProjectMilestone"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Product" ADD CONSTRAINT "Product_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ProjectCollaborator" ADD CONSTRAINT "ProjectCollaborator_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ProjectCollaborator" ADD CONSTRAINT "ProjectCollaborator_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ProjectRequirement" ADD CONSTRAINT "ProjectRequirement_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ProjectRewardTier" ADD CONSTRAINT "ProjectRewardTier_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_User_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_sessionId_AuthSession_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."AuthSession"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_rotatedToId_RefreshToken_id_fk" FOREIGN KEY ("rotatedToId") REFERENCES "public"."RefreshToken"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "SettlementPayout" ADD CONSTRAINT "SettlementPayout_settlementId_Settlement_id_fk" FOREIGN KEY ("settlementId") REFERENCES "public"."Settlement"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_User_id_fk" FOREIGN KEY ("blockerId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedUserId_User_id_fk" FOREIGN KEY ("blockedUserId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_User_id_fk" FOREIGN KEY ("followerId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followingId_User_id_fk" FOREIGN KEY ("followingId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_Permission_id_fk" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "VisitLog" ADD CONSTRAINT "VisitLog_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "AuthDevice_userId_deviceFingerprint_key" ON "AuthDevice" USING btree ("userId","deviceFingerprint");--> statement-breakpoint
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "AuthSession_lastUsedAt_idx" ON "AuthSession" USING btree ("lastUsedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "CommentReaction_commentId_userId_type_key" ON "CommentReaction" USING btree ("commentId","userId","type");--> statement-breakpoint
CREATE UNIQUE INDEX "Funding_paymentIntentId_key" ON "Funding" USING btree ("paymentIntentId");--> statement-breakpoint
CREATE UNIQUE INDEX "Partner_userId_key" ON "Partner" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "PaymentTransaction_fundingId_key" ON "PaymentTransaction" USING btree ("fundingId");--> statement-breakpoint
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "PostDislike_postId_userId_key" ON "PostDislike" USING btree ("postId","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "PostLike_postId_userId_key" ON "PostLike" USING btree ("postId","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "ProjectCollaborator_projectId_userId_key" ON "ProjectCollaborator" USING btree ("projectId","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "RefreshToken_tokenFingerprint_key" ON "RefreshToken" USING btree ("tokenFingerprint");--> statement-breakpoint
CREATE UNIQUE INDEX "RefreshToken_rotatedToId_key" ON "RefreshToken" USING btree ("rotatedToId");--> statement-breakpoint
CREATE INDEX "RefreshToken_sessionId_idx" ON "RefreshToken" USING btree ("sessionId");--> statement-breakpoint
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedUserId_key" ON "UserBlock" USING btree ("blockerId","blockedUserId");--> statement-breakpoint
CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "UserFollow" USING btree ("followerId","followingId");--> statement-breakpoint
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key" ON "UserPermission" USING btree ("userId","permissionId");--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email");--> statement-breakpoint
CREATE INDEX "VisitLog_occurredAt_idx" ON "VisitLog" USING btree ("occurredAt");--> statement-breakpoint
CREATE INDEX "VisitLog_sessionId_idx" ON "VisitLog" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "VisitLog_userId_idx" ON "VisitLog" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet" USING btree ("userId");