CREATE TYPE "public"."PostStatus" AS ENUM('PUBLISHED', 'HIDDEN', 'DELETED');--> statement-breakpoint
ALTER TYPE "public"."CommunityCategory" RENAME TO "PostScope";--> statement-breakpoint
CREATE TABLE "PostBookmark" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "CommunityPostDislike" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "CommunityPostLike" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "CommunityReport" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "CommunityPostDislike" CASCADE;--> statement-breakpoint
DROP TABLE "CommunityPostLike" CASCADE;--> statement-breakpoint
DROP TABLE "CommunityReport" CASCADE;--> statement-breakpoint
ALTER TABLE "CommunityPost" RENAME TO "Category";--> statement-breakpoint
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_postId_CommunityPost_id_fk";
--> statement-breakpoint
ALTER TABLE "Category" DROP CONSTRAINT "CommunityPost_authorId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Category" DROP CONSTRAINT "CommunityPost_projectId_Project_id_fk";
--> statement-breakpoint
ALTER TABLE "Post" ALTER COLUMN "scope" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "Post" ALTER COLUMN "scope" SET DEFAULT 'PROJECT'::text;--> statement-breakpoint
DROP TYPE "public"."PostScope";--> statement-breakpoint
CREATE TYPE "public"."PostScope" AS ENUM('GLOBAL', 'PROJECT');--> statement-breakpoint
ALTER TABLE "Post" ALTER COLUMN "scope" SET DEFAULT 'PROJECT'::"public"."PostScope";--> statement-breakpoint
ALTER TABLE "Post" ALTER COLUMN "scope" SET DATA TYPE "public"."PostScope" USING "scope"::"public"."PostScope";--> statement-breakpoint
DROP INDEX "CommunityPost_authorId_idx";--> statement-breakpoint
DROP INDEX "CommunityPost_projectId_idx";--> statement-breakpoint
DROP INDEX "CommunityPost_category_idx";--> statement-breakpoint
DROP INDEX "CommunityPost_isPinned_idx";--> statement-breakpoint
DROP INDEX "CommunityPost_status_idx";--> statement-breakpoint
DROP INDEX "CommunityPost_createdAt_idx";--> statement-breakpoint
DROP INDEX "CommunityPost_likesCount_idx";--> statement-breakpoint
DROP INDEX "CommunityPost_status_isPinned_idx";--> statement-breakpoint
DROP INDEX "CommunityPost_createdAt_status_idx";--> statement-breakpoint
DROP INDEX "CommunityPost_likesCount_status_idx";--> statement-breakpoint
ALTER TABLE "Post" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "Post" ALTER COLUMN "category" SET DEFAULT 'GENERAL';--> statement-breakpoint
ALTER TABLE "Category" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Category" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Category" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "Category" ADD COLUMN "displayOrder" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Category" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "categoryId" text;--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "scope" "PostScope" DEFAULT 'PROJECT' NOT NULL;--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "status" "PostStatus" DEFAULT 'PUBLISHED' NOT NULL;--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "reportCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "viewCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "PostBookmark" ADD CONSTRAINT "PostBookmark_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PostBookmark" ADD CONSTRAINT "PostBookmark_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "PostBookmark_postId_userId_key" ON "PostBookmark" USING btree ("postId","userId");--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_Category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Category_slug_key" ON "Category" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "Post_scope_categoryId_status_createdAt_idx" ON "Post" USING btree ("scope","categoryId","status","createdAt");--> statement-breakpoint
CREATE INDEX "Post_scope_status_isPinned_createdAt_idx" ON "Post" USING btree ("scope","status","isPinned","createdAt");--> statement-breakpoint
CREATE INDEX "Post_authorId_scope_createdAt_idx" ON "Post" USING btree ("authorId","scope","createdAt");--> statement-breakpoint
CREATE INDEX "Post_reportCount_idx" ON "Post" USING btree ("reportCount");--> statement-breakpoint
ALTER TABLE "Category" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "Category" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "Category" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "Category" DROP COLUMN "authorId";--> statement-breakpoint
ALTER TABLE "Category" DROP COLUMN "projectId";--> statement-breakpoint
ALTER TABLE "Category" DROP COLUMN "images";--> statement-breakpoint
ALTER TABLE "Category" DROP COLUMN "attachments";--> statement-breakpoint
ALTER TABLE "Category" DROP COLUMN "linkPreviews";--> statement-breakpoint
ALTER TABLE "Category" DROP COLUMN "parentPostId";--> statement-breakpoint
ALTER TABLE "Category" DROP COLUMN "likesCount";--> statement-breakpoint
ALTER TABLE "Category" DROP COLUMN "commentsCount";--> statement-breakpoint
ALTER TABLE "Category" DROP COLUMN "replyCount";--> statement-breakpoint
ALTER TABLE "Category" DROP COLUMN "viewCount";--> statement-breakpoint
ALTER TABLE "Category" DROP COLUMN "isPinned";--> statement-breakpoint
ALTER TABLE "Category" DROP COLUMN "status";