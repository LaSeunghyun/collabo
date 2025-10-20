CREATE TABLE "AnnouncementRead" (
	"id" text PRIMARY KEY NOT NULL,
	"announcementId" text NOT NULL,
	"userId" text NOT NULL,
	"readAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Announcement" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"isPinned" boolean DEFAULT false NOT NULL,
	"publishedAt" timestamp,
	"authorId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_announcementId_Announcement_id_fk" FOREIGN KEY ("announcementId") REFERENCES "public"."Announcement"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "AnnouncementRead_announcementId_userId_key" ON "AnnouncementRead" USING btree ("announcementId","userId");--> statement-breakpoint
CREATE INDEX "Announcement_publishedAt_idx" ON "Announcement" USING btree ("publishedAt");--> statement-breakpoint
CREATE INDEX "Announcement_category_idx" ON "Announcement" USING btree ("category");--> statement-breakpoint
CREATE INDEX "Announcement_isPinned_idx" ON "Announcement" USING btree ("isPinned");