-- GAP-001 slice 3: durable persistence for Activity (+ scheduled activities)
-- and Notification (+ preferences). Purely additive: two new tables and three
-- new columns with defaults; no data is rewritten.
-- Rollback: DROP TABLE "NotificationPreference"; DROP TABLE "ScheduledActivity";
--           ALTER TABLE "Notification" DROP COLUMN "title", DROP COLUMN "message";
--           ALTER TABLE "Activity" DROP COLUMN "visibility";

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'INTERNAL';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "message" TEXT NOT NULL DEFAULT '',
ADD COLUMN "title" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "ScheduledActivity" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "ownerId" UUID NOT NULL,
    "ownerName" TEXT,
    "participantIds" TEXT[],
    "associatedEntityType" TEXT,
    "associatedEntityId" TEXT,
    "associatedEntityTitle" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'INTERNAL',
    "reminderMinutesBefore" INTEGER,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ScheduledActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "userId" UUID NOT NULL,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "push" BOOLEAN NOT NULL DEFAULT false,
    "digest" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "ScheduledActivity_organizationId_startsAt_endsAt_idx" ON "ScheduledActivity"("organizationId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "ScheduledActivity_organizationId_ownerId_startsAt_idx" ON "ScheduledActivity"("organizationId", "ownerId", "startsAt");

-- CreateIndex
CREATE INDEX "ScheduledActivity_organizationId_status_idx" ON "ScheduledActivity"("organizationId", "status");

-- AddForeignKey
ALTER TABLE "ScheduledActivity" ADD CONSTRAINT "ScheduledActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledActivity" ADD CONSTRAINT "ScheduledActivity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
