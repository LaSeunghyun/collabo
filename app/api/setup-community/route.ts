import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const db = await getDbClient();
    console.log('커뮤니티 스키마 설정 시작...');

    // PostScope enum 생성
    await db.execute(sql`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostScope') THEN
              CREATE TYPE "public"."PostScope" AS ENUM('GLOBAL', 'PROJECT');
          END IF;
      END $$;
    `);
    console.log('PostScope enum 생성 완료');

    // PostStatus enum 생성
    await db.execute(sql`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostStatus') THEN
              CREATE TYPE "public"."PostStatus" AS ENUM('PUBLISHED', 'HIDDEN', 'DELETED');
          END IF;
      END $$;
    `);
    console.log('PostStatus enum 생성 완료');

    // Categories 테이블 생성
    await db.execute(sql`
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
    `);
    console.log('Category 테이블 생성 완료');

    // Categories unique constraint
    await db.execute(sql`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Category_slug_key') THEN
              ALTER TABLE "Category" ADD CONSTRAINT "Category_slug_key" UNIQUE ("slug");
          END IF;
      END $$;
    `);
    console.log('Category unique constraint 추가 완료');

    // Post 테이블에 새로운 컬럼들 추가
    await db.execute(sql`
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
    `);
    console.log('Post 테이블 컬럼 추가 완료');

    // PostBookmarks 테이블 생성
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "PostBookmark" (
          "id" text PRIMARY KEY NOT NULL,
          "postId" text NOT NULL REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          "userId" text NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          "createdAt" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log('PostBookmark 테이블 생성 완료');

    // PostBookmarks unique constraint
    await db.execute(sql`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PostBookmark_postId_userId_key') THEN
              ALTER TABLE "PostBookmark" ADD CONSTRAINT "PostBookmark_postId_userId_key" UNIQUE ("postId", "userId");
          END IF;
      END $$;
    `);
    console.log('PostBookmark unique constraint 추가 완료');

    // 인덱스 생성
    await db.execute(sql`
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
    `);
    console.log('인덱스 생성 완료');

    return NextResponse.json({
      success: true,
      message: '커뮤니티 스키마 설정이 완료되었습니다!',
    });
  } catch (error) {
    console.error('스키마 설정 오류:', error);
    return NextResponse.json(
      { error: '스키마 설정에 실패했습니다.', details: error },
      { status: 500 }
    );
  }
}
