-- AlterEnum
CREATE TYPE "CommunityCategory" AS ENUM ('GENERAL', 'NOTICE', 'COLLAB', 'SUPPORT', 'SHOWCASE');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "category" "CommunityCategory" NOT NULL DEFAULT 'GENERAL';

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedUserId_key" ON "UserBlock"("blockerId", "blockedUserId");

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
