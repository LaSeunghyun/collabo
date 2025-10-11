-- 누락된 커뮤니티 관련 테이블 생성
-- 이 스크립트를 데이터베이스에서 실행하세요

-- CommunityPostLike 테이블 생성
CREATE TABLE IF NOT EXISTS "CommunityPostLike" (
    "id" text PRIMARY KEY NOT NULL,
    "postId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL
);

-- CommunityPostDislike 테이블 생성
CREATE TABLE IF NOT EXISTS "CommunityPostDislike" (
    "id" text PRIMARY KEY NOT NULL,
    "postId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL
);

-- 외래키 제약조건 추가
ALTER TABLE "CommunityPostLike" 
ADD CONSTRAINT "CommunityPostLike_postId_CommunityPost_id_fk" 
FOREIGN KEY ("postId") REFERENCES "public"."CommunityPost"("id") 
ON DELETE cascade ON UPDATE cascade;

ALTER TABLE "CommunityPostLike" 
ADD CONSTRAINT "CommunityPostLike_userId_User_id_fk" 
FOREIGN KEY ("userId") REFERENCES "public"."User"("id") 
ON DELETE restrict ON UPDATE cascade;

ALTER TABLE "CommunityPostDislike" 
ADD CONSTRAINT "CommunityPostDislike_postId_CommunityPost_id_fk" 
FOREIGN KEY ("postId") REFERENCES "public"."CommunityPost"("id") 
ON DELETE cascade ON UPDATE cascade;

ALTER TABLE "CommunityPostDislike" 
ADD CONSTRAINT "CommunityPostDislike_userId_User_id_fk" 
FOREIGN KEY ("userId") REFERENCES "public"."User"("id") 
ON DELETE restrict ON UPDATE cascade;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS "CommunityPostLike_postId_idx" ON "CommunityPostLike" USING btree ("postId");
CREATE INDEX IF NOT EXISTS "CommunityPostLike_userId_idx" ON "CommunityPostLike" USING btree ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "CommunityPostLike_postId_userId_key" ON "CommunityPostLike" USING btree ("postId","userId");

CREATE INDEX IF NOT EXISTS "CommunityPostDislike_postId_idx" ON "CommunityPostDislike" USING btree ("postId");
CREATE INDEX IF NOT EXISTS "CommunityPostDislike_userId_idx" ON "CommunityPostDislike" USING btree ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "CommunityPostDislike_postId_userId_key" ON "CommunityPostDislike" USING btree ("postId","userId");

-- CommunityPost 테이블에 인덱스 추가
CREATE INDEX IF NOT EXISTS "CommunityPost_authorId_idx" ON "CommunityPost" USING btree ("authorId");
CREATE INDEX IF NOT EXISTS "CommunityPost_projectId_idx" ON "CommunityPost" USING btree ("projectId");
CREATE INDEX IF NOT EXISTS "CommunityPost_category_idx" ON "CommunityPost" USING btree ("category");
CREATE INDEX IF NOT EXISTS "CommunityPost_isPinned_idx" ON "CommunityPost" USING btree ("isPinned");
CREATE INDEX IF NOT EXISTS "CommunityPost_status_idx" ON "CommunityPost" USING btree ("status");
CREATE INDEX IF NOT EXISTS "CommunityPost_createdAt_idx" ON "CommunityPost" USING btree ("createdAt");
CREATE INDEX IF NOT EXISTS "CommunityPost_likesCount_idx" ON "CommunityPost" USING btree ("likesCount");
CREATE INDEX IF NOT EXISTS "CommunityPost_status_isPinned_idx" ON "CommunityPost" USING btree ("status","isPinned");
CREATE INDEX IF NOT EXISTS "CommunityPost_createdAt_status_idx" ON "CommunityPost" USING btree ("createdAt","status");
CREATE INDEX IF NOT EXISTS "CommunityPost_likesCount_status_idx" ON "CommunityPost" USING btree ("likesCount","status");

-- Comment 테이블에 인덱스 추가
CREATE INDEX IF NOT EXISTS "Comment_postId_idx" ON "Comment" USING btree ("postId");
CREATE INDEX IF NOT EXISTS "Comment_authorId_idx" ON "Comment" USING btree ("authorId");
CREATE INDEX IF NOT EXISTS "Comment_createdAt_idx" ON "Comment" USING btree ("createdAt");

-- 성공 메시지
SELECT 'All tables and indexes created successfully!' as status;
