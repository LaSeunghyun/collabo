-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'SUPPORTERS');

-- AlterTable
ALTER TABLE "Post"
  ADD COLUMN     "attachments" JSONB,
  ADD COLUMN     "milestoneId" TEXT,
  ADD COLUMN     "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC';

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ProjectMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
