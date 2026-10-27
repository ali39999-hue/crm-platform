-- Migration: 20261027_projects_timetracking
-- Purpose:
--   * Extend "Project" with the columns required by ProjectEntity
--     (apps/api/src/modules/projects/project.repository.ts).
--   * Create "Milestone" and "WorkLog" for the Projects / TimeTracking domains.
--
-- This migration is additive-only: it never drops or renames existing objects.
-- It has NOT been executed against a live PostgreSQL instance in this change
-- (no database is available in the authoring environment), so it must be
-- reviewed and applied with `prisma migrate deploy` before being trusted.

-- ---------------------------------------------------------------------------
-- 1. Project: new nullable/defaulted columns (safe for existing rows)
-- ---------------------------------------------------------------------------

ALTER TABLE "Project" ADD COLUMN "description" TEXT;
ALTER TABLE "Project" ADD COLUMN "health" TEXT NOT NULL DEFAULT 'ON_TRACK';
ALTER TABLE "Project" ADD COLUMN "ownerId" UUID;
ALTER TABLE "Project" ADD COLUMN "ownerName" TEXT;
ALTER TABLE "Project" ADD COLUMN "startDate" TIMESTAMPTZ(6);
ALTER TABLE "Project" ADD COLUMN "targetDate" TIMESTAMPTZ(6);
-- Polymorphic business reference only: intentionally no FK, because an account
-- may be archived/removed while the project keeps its historical label.
ALTER TABLE "Project" ADD COLUMN "associatedAccountId" UUID;
ALTER TABLE "Project" ADD COLUMN "associatedAccountName" TEXT;

CREATE INDEX "Project_organizationId_ownerId_idx" ON "Project"("organizationId", "ownerId");
CREATE INDEX "Project_organizationId_targetDate_idx" ON "Project"("organizationId", "targetDate");

-- ---------------------------------------------------------------------------
-- 2. Milestone (organization-scoped, cascades with its project)
-- ---------------------------------------------------------------------------

CREATE TABLE "Milestone" (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organizationId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    title TEXT NOT NULL,
    "dueDate" TIMESTAMPTZ(6) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY (id)
);

CREATE INDEX "Milestone_organizationId_projectId_dueDate_idx" ON "Milestone"("organizationId", "projectId", "dueDate");
CREATE INDEX "Milestone_projectId_idx" ON "Milestone"("projectId");

-- ---------------------------------------------------------------------------
-- 3. WorkLog (organization-scoped time entries)
-- ---------------------------------------------------------------------------

CREATE TABLE "WorkLog" (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userName" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityTitle" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    description TEXT NOT NULL,
    "isBillable" BOOLEAN NOT NULL DEFAULT true,
    "loggedDate" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkLog_pkey" PRIMARY KEY (id)
);

CREATE INDEX "WorkLog_organizationId_loggedDate_idx" ON "WorkLog"("organizationId", "loggedDate");
CREATE INDEX "WorkLog_organizationId_userId_loggedDate_idx" ON "WorkLog"("organizationId", "userId", "loggedDate");
CREATE INDEX "WorkLog_organizationId_entityType_entityId_idx" ON "WorkLog"("organizationId", "entityType", "entityId");

-- ---------------------------------------------------------------------------
-- 4. Foreign keys
-- ---------------------------------------------------------------------------

ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
