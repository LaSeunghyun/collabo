CREATE TABLE "CommunityPostDislike" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CommunityPostLike" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_postId_Post_id_fk";
--> statement-breakpoint
ALTER TABLE "CommunityPostDislike" ADD CONSTRAINT "CommunityPostDislike_postId_CommunityPost_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."CommunityPost"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CommunityPostDislike" ADD CONSTRAINT "CommunityPostDislike_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CommunityPostLike" ADD CONSTRAINT "CommunityPostLike_postId_CommunityPost_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."CommunityPost"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CommunityPostLike" ADD CONSTRAINT "CommunityPostLike_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "CommunityPostDislike_postId_idx" ON "CommunityPostDislike" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "CommunityPostDislike_userId_idx" ON "CommunityPostDislike" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "CommunityPostDislike_postId_userId_key" ON "CommunityPostDislike" USING btree ("postId","userId");--> statement-breakpoint
CREATE INDEX "CommunityPostLike_postId_idx" ON "CommunityPostLike" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "CommunityPostLike_userId_idx" ON "CommunityPostLike" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "CommunityPostLike_postId_userId_key" ON "CommunityPostLike" USING btree ("postId","userId");--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_CommunityPost_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."CommunityPost"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "Comment_postId_idx" ON "Comment" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "Comment_authorId_idx" ON "Comment" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "Comment_createdAt_idx" ON "Comment" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "CommunityPost_authorId_idx" ON "CommunityPost" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "CommunityPost_projectId_idx" ON "CommunityPost" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "CommunityPost_category_idx" ON "CommunityPost" USING btree ("category");--> statement-breakpoint
CREATE INDEX "CommunityPost_isPinned_idx" ON "CommunityPost" USING btree ("isPinned");--> statement-breakpoint
CREATE INDEX "CommunityPost_status_idx" ON "CommunityPost" USING btree ("status");--> statement-breakpoint
CREATE INDEX "CommunityPost_createdAt_idx" ON "CommunityPost" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "CommunityPost_likesCount_idx" ON "CommunityPost" USING btree ("likesCount");--> statement-breakpoint
CREATE INDEX "CommunityPost_status_isPinned_idx" ON "CommunityPost" USING btree ("status","isPinned");--> statement-breakpoint
CREATE INDEX "CommunityPost_createdAt_status_idx" ON "CommunityPost" USING btree ("createdAt","status");--> statement-breakpoint
CREATE INDEX "CommunityPost_likesCount_status_idx" ON "CommunityPost" USING btree ("likesCount","status");