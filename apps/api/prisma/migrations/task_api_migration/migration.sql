-- Migration: task_api_migration
-- Creates Task-related tables with tenant scope and version for optimistic locking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TaskStatus enum
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'CANCELED');

-- TaskPriority enum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- RecordVisibility enum
CREATE TYPE "RecordVisibility" AS ENUM ('INTERNAL', 'CUSTOMER_SHARED');

-- Task table
CREATE TABLE "Task" (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organizationId" UUID NOT NULL,
    "projectId" UUID,
    "creatorId" UUID NOT NULL,
    "assigneeId" UUID,
    "parentId" UUID,
    key TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status "TaskStatus" NOT NULL DEFAULT 'TODO',
    priority "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    visibility "RecordVisibility" NOT NULL DEFAULT 'INTERNAL',
    "dueAt" TIMESTAMPTZ(6),
    version INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY (id)
);

-- TaskDependency table
CREATE TABLE "TaskDependency" (
    "taskId" UUID NOT NULL,
    "dependsOnId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("taskId", "dependsOnId")
);

-- TaskComment table
CREATE TABLE "TaskComment" (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    "taskId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    body TEXT NOT NULL,
    visibility "RecordVisibility" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY (id)
);

-- Foreign Keys for Task
ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Task"(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for TaskDependency
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Task"(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign Keys for TaskComment
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes for Task
CREATE INDEX "Task_organizationId_status_priority_idx" ON "Task"("organizationId", status, priority);
CREATE INDEX "Task_organizationId_assigneeId_status_idx" ON "Task"("organizationId", "assigneeId", status);
CREATE INDEX "Task_organizationId_dueAt_idx" ON "Task"("organizationId", "dueAt");
CREATE INDEX "Task_projectId_status_idx" ON "Task"("projectId", status);

-- Indexes for TaskDependency
CREATE INDEX "TaskDependency_dependsOnId_idx" ON "TaskDependency"("dependsOnId");

-- Indexes for TaskComment
CREATE INDEX "TaskComment_taskId_createdAt_idx" ON "TaskComment"("taskId", "createdAt");

-- Unique index for Task key per organization
CREATE UNIQUE INDEX "Task_organizationId_key_key" ON "Task"("organizationId", key);