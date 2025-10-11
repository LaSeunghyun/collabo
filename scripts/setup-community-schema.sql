-- 커뮤니티 관련 enum 생성 (이미 존재하는 경우 무시)
DO $$ 
BEGIN
    -- PostScope enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostScope') THEN
        CREATE TYPE "public"."PostScope" AS ENUM('GLOBAL', 'PROJECT');
    END IF;
    
    -- PostStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostStatus') THEN
        CREATE TYPE "public"."PostStatus" AS ENUM('PUBLISHED', 'HIDDEN', 'DELETED');
    END IF;
END $$;

-- Categories 테이블 생성
CREATE TABLE IF NOT EXISTS "Category" (
    "id" text PRIMARY KEY NOT NULL,
    "slug" text NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp NOT NULL
);

-- Categories 테이블에 unique constraint 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Category_slug_key') THEN
        ALTER TABLE "Category" ADD CONSTRAINT "Category_slug_key" UNIQUE ("slug");
    END IF;
END $$;

-- Post 테이블에 새로운 컬럼들 추가
DO $$ 
BEGIN
    -- scope 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Post' AND column_name = 'scope') THEN
        ALTER TABLE "Post" ADD COLUMN "scope" "PostScope" DEFAULT 'PROJECT' NOT NULL;
    END IF;
    
    -- status 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Post' AND column_name = 'status') THEN
        ALTER TABLE "Post" ADD COLUMN "status" "PostStatus" DEFAULT 'PUBLISHED' NOT NULL;
    END IF;
    
    -- categoryId 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Post' AND column_name = 'categoryId') THEN
        ALTER TABLE "Post" ADD COLUMN "categoryId" text REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    -- reportCount 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Post' AND column_name = 'reportCount') THEN
        ALTER TABLE "Post" ADD COLUMN "reportCount" integer DEFAULT 0 NOT NULL;
    END IF;
    
    -- viewCount 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Post' AND column_name = 'viewCount') THEN
        ALTER TABLE "Post" ADD COLUMN "viewCount" integer DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- PostBookmarks 테이블 생성
CREATE TABLE IF NOT EXISTS "PostBookmark" (
    "id" text PRIMARY KEY NOT NULL,
    "postId" text NOT NULL REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "userId" text NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "createdAt" timestamp DEFAULT now() NOT NULL
);

-- PostBookmarks 테이블에 unique constraint 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PostBookmark_postId_userId_key') THEN
        ALTER TABLE "PostBookmark" ADD CONSTRAINT "PostBookmark_postId_userId_key" UNIQUE ("postId", "userId");
    END IF;
END $$;

-- 인덱스 생성
DO $$ 
BEGIN
    -- Post 테이블 인덱스들
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Post_scope_categoryId_status_createdAt_idx') THEN
        CREATE INDEX "Post_scope_categoryId_status_createdAt_idx" ON "Post" ("scope", "categoryId", "status", "createdAt" DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Post_scope_status_isPinned_createdAt_idx') THEN
        CREATE INDEX "Post_scope_status_isPinned_createdAt_idx" ON "Post" ("scope", "status", "isPinned", "createdAt" DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Post_authorId_scope_createdAt_idx') THEN
        CREATE INDEX "Post_authorId_scope_createdAt_idx" ON "Post" ("authorId", "scope", "createdAt" DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Post_reportCount_idx') THEN
        CREATE INDEX "Post_reportCount_idx" ON "Post" ("reportCount");
    END IF;
END $$;
