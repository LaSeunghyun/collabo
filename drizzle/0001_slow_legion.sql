ALTER TABLE "Post" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "Post" ALTER COLUMN "category" SET DEFAULT 'GENERAL'::text;--> statement-breakpoint
DROP TYPE "public"."CommunityCategory";--> statement-breakpoint
CREATE TYPE "public"."CommunityCategory" AS ENUM('MUSIC', 'ART', 'LITERATURE', 'PERFORMANCE', 'PHOTO');--> statement-breakpoint
ALTER TABLE "Post" ALTER COLUMN "category" SET DEFAULT 'GENERAL'::"public"."CommunityCategory";--> statement-breakpoint
ALTER TABLE "Post" ALTER COLUMN "category" SET DATA TYPE "public"."CommunityCategory" USING "category"::"public"."CommunityCategory";