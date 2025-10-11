-- Add new columns to CommunityPost table
ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS "images" text[] DEFAULT '{"RAY"}' NOT NULL;
ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS "attachments" jsonb;
ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS "linkPreviews" jsonb;
ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS "parentPostId" text;
ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS "replyCount" integer DEFAULT 0 NOT NULL;
ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS "viewCount" integer DEFAULT 0 NOT NULL;
