CREATE TYPE "public"."PostStatus" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "status" "PostStatus" DEFAULT 'DRAFT' NOT NULL;