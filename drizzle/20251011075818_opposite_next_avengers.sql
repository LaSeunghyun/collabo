ALTER TABLE "CommunityPost" ADD COLUMN "images" text[] DEFAULT '{"RAY"}' NOT NULL;--> statement-breakpoint
ALTER TABLE "CommunityPost" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "CommunityPost" ADD COLUMN "linkPreviews" jsonb;--> statement-breakpoint
ALTER TABLE "CommunityPost" ADD COLUMN "parentPostId" text;--> statement-breakpoint
ALTER TABLE "CommunityPost" ADD COLUMN "replyCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "CommunityPost" ADD COLUMN "viewCount" integer DEFAULT 0 NOT NULL;