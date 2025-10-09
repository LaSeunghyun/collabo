CREATE TABLE "CommunityPost" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" "CommunityCategory" NOT NULL,
	"authorId" text NOT NULL,
	"projectId" text,
	"likesCount" integer DEFAULT 0 NOT NULL,
	"commentsCount" integer DEFAULT 0 NOT NULL,
	"isPinned" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'PUBLISHED' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CommunityReport" (
	"id" text PRIMARY KEY NOT NULL,
	"reporterId" text NOT NULL,
	"targetType" "ModerationTargetType" NOT NULL,
	"targetId" text NOT NULL,
	"reason" text,
	"status" "ModerationStatus" DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_reporterId_User_id_fk" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;