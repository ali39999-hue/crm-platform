-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "settings" JSONB;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "description" TEXT,
ADD COLUMN     "leadMemberId" UUID,
ADD COLUMN     "slug" TEXT NOT NULL DEFAULT '';

