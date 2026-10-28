Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('SystemOwner', 'OrganizationAdmin', 'Manager', 'Employee', 'Sales', 'SupportAgent', 'CustomerPortalUser', 'Auditor', 'IntegrationAccount', 'OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'CUSTOMER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'CANCELED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RecordVisibility" AS ENUM ('INTERNAL', 'CUSTOMER_SHARED');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'OPEN', 'PENDING_CUSTOMER', 'PENDING_INTERNAL', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "settings" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT,
    "mfaSecret" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "leadMemberId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "teamId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("teamId","userId")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "teamId" UUID,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "health" TEXT NOT NULL DEFAULT 'ON_TRACK',
    "ownerId" UUID,
    "ownerName" TEXT,
    "startDate" TIMESTAMPTZ(6),
    "targetDate" TIMESTAMPTZ(6),
    "associatedAccountId" UUID,
    "associatedAccountName" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMPTZ(6) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkLog" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userName" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityTitle" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "isBillable" BOOLEAN NOT NULL DEFAULT true,
    "loggedDate" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WorkLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "projectId" UUID,
    "creatorId" UUID NOT NULL,
    "assigneeId" UUID,
    "parentId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "visibility" "RecordVisibility" NOT NULL DEFAULT 'INTERNAL',
    "dueAt" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDependency" (
    "taskId" UUID NOT NULL,
    "dependsOnId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("taskId","dependsOnId")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "RecordVisibility" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "ownerId" UUID,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'COMPANY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "website" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "accountId" UUID,
    "ownerId" UUID,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "accountId" UUID,
    "ownerId" UUID,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "accountId" UUID,
    "ownerId" UUID,
    "name" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'QUALIFICATION',
    "amountMinor" BIGINT,
    "currency" TEXT,
    "probability" INTEGER,
    "targetCloseAt" TIMESTAMPTZ(6),
    "lossReason" TEXT,
    "lossDescription" TEXT,
    "lostAt" TIMESTAMPTZ(6),
    "nextActionTitle" TEXT,
    "nextActionDueAt" TIMESTAMPTZ(6),
    "stageUpdatedAt" TIMESTAMPTZ(6),
    "products" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "accountId" UUID,
    "assigneeId" UUID,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "authorId" UUID,
    "body" TEXT NOT NULL,
    "visibility" "RecordVisibility" NOT NULL DEFAULT 'CUSTOMER_SHARED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "actorId" UUID,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'INTERNAL',
    "occurredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "requestId" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL DEFAULT '',
    "payload" JSONB NOT NULL,
    "dedupeKey" TEXT,
    "readAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "Mention" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "sourceEntityType" TEXT NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "authorId" UUID NOT NULL,
    "authorName" TEXT NOT NULL,
    "recipientId" UUID NOT NULL,
    "recipientName" TEXT NOT NULL,
    "contextSnippet" TEXT NOT NULL,
    "readAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "hashedKey" TEXT NOT NULL,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMPTZ(6),
    "expiresAt" TIMESTAMPTZ(6),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationProvider" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "providerKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "configSummary" JSONB,
    "lastSyncedAt" TIMESTAMPTZ(6),
    "errorMessage" TEXT,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "IntegrationProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRecord" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "recordCounts" JSONB NOT NULL,
    "rpoTargetMinutes" INTEGER NOT NULL,
    "rtoEstimatedSeconds" INTEGER NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(6),
    "metadata" JSONB,

    CONSTRAINT "BackupRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestoreDrill" (
    "id" UUID NOT NULL,
    "backupId" UUID NOT NULL,
    "organizationId" UUID,
    "executedBy" UUID NOT NULL,
    "success" BOOLEAN NOT NULL,
    "integrityVerified" BOOLEAN NOT NULL,
    "checksumMatched" BOOLEAN NOT NULL,
    "decryptionSuccessful" BOOLEAN NOT NULL,
    "versionCompatible" BOOLEAN NOT NULL,
    "schemaCompatible" BOOLEAN NOT NULL,
    "simulatedRecordsRestored" INTEGER NOT NULL,
    "rtoActualMs" INTEGER NOT NULL,
    "rpoActualMinutes" INTEGER NOT NULL,
    "rpoTargetMinutes" INTEGER NOT NULL,
    "rtoEstimatedSeconds" INTEGER NOT NULL,
    "meetsRpoTarget" BOOLEAN NOT NULL,
    "meetsRtoTarget" BOOLEAN NOT NULL,
    "executedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT NOT NULL,
    "validationErrors" TEXT[],

    CONSTRAINT "RestoreDrill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDeadLetter" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "dedupeKey" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMPTZ(6),

    CONSTRAINT "NotificationDeadLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "runAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomField" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" TEXT[],
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "conditionField" TEXT,
    "conditionValue" TEXT,
    "actionType" TEXT NOT NULL,
    "actionPayload" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "ruleId" UUID NOT NULL,
    "ruleName" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "executedAction" TEXT NOT NULL,
    "actionDetails" TEXT NOT NULL,
    "payloadSummary" TEXT NOT NULL,
    "executedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER NOT NULL,

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSpace" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "DocumentSpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'WORKSPACE',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "authorId" UUID NOT NULL,
    "authorName" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT[],
    "associatedEntityType" TEXT,
    "associatedEntityId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRevision" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summaryChange" TEXT,
    "authorId" UUID NOT NULL,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookSubscription" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "error" TEXT,
    "durationMs" INTEGER,
    "headers" JSONB NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextRetryAt" TIMESTAMPTZ(6),

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookNonce" (
    "scope" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WebhookNonce_pkey" PRIMARY KEY ("scope","nonce")
);

-- CreateTable
CREATE TABLE "ProductCatalogItem" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPriceMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "taxRatePercent" DECIMAL(5,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProformaInvoice" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "dealId" UUID NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "subtotalMinor" BIGINT NOT NULL,
    "discountTotalMinor" BIGINT NOT NULL,
    "taxTotalMinor" BIGINT NOT NULL,
    "finalTotalMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "issueDate" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProformaInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMacro" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "shortcut" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SupportMacro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportSequence" (
    "organizationId" UUID NOT NULL,
    "lastValue" INTEGER NOT NULL,

    CONSTRAINT "SupportSequence_pkey" PRIMARY KEY ("organizationId")
);

-- CreateTable
CREATE TABLE "RevokedCredential" (
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "revokedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RevokedCredential_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitedBy" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMPTZ(6),
    "acceptedUserId" UUID,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Membership_userId_active_idx" ON "Membership"("userId", "active");

-- CreateIndex
CREATE INDEX "Membership_organizationId_role_active_idx" ON "Membership"("organizationId", "role", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_organizationId_userId_key" ON "Membership"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Team_organizationId_idx" ON "Team"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_organizationId_name_key" ON "Team"("organizationId", "name");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX "Project_organizationId_status_idx" ON "Project"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Project_organizationId_ownerId_idx" ON "Project"("organizationId", "ownerId");

-- CreateIndex
CREATE INDEX "Project_organizationId_targetDate_idx" ON "Project"("organizationId", "targetDate");

-- CreateIndex
CREATE UNIQUE INDEX "Project_organizationId_key_key" ON "Project"("organizationId", "key");

-- CreateIndex
CREATE INDEX "Milestone_organizationId_projectId_dueDate_idx" ON "Milestone"("organizationId", "projectId", "dueDate");

-- CreateIndex
CREATE INDEX "Milestone_projectId_idx" ON "Milestone"("projectId");

-- CreateIndex
CREATE INDEX "WorkLog_organizationId_loggedDate_idx" ON "WorkLog"("organizationId", "loggedDate");

-- CreateIndex
CREATE INDEX "WorkLog_organizationId_userId_loggedDate_idx" ON "WorkLog"("organizationId", "userId", "loggedDate");

-- CreateIndex
CREATE INDEX "WorkLog_organizationId_entityType_entityId_idx" ON "WorkLog"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "Task_organizationId_status_priority_idx" ON "Task"("organizationId", "status", "priority");

-- CreateIndex
CREATE INDEX "Task_organizationId_assigneeId_status_idx" ON "Task"("organizationId", "assigneeId", "status");

-- CreateIndex
CREATE INDEX "Task_organizationId_dueAt_idx" ON "Task"("organizationId", "dueAt");

-- CreateIndex
CREATE INDEX "Task_projectId_status_idx" ON "Task"("projectId", "status");

-- CreateIndex
CREATE INDEX "TaskDependency_dependsOnId_idx" ON "TaskDependency"("dependsOnId");

-- CreateIndex
CREATE INDEX "TaskComment_taskId_createdAt_idx" ON "TaskComment"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "Account_organizationId_name_idx" ON "Account"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Account_organizationId_ownerId_idx" ON "Account"("organizationId", "ownerId");

-- CreateIndex
CREATE INDEX "Contact_organizationId_lastName_firstName_idx" ON "Contact"("organizationId", "lastName", "firstName");

-- CreateIndex
CREATE INDEX "Contact_organizationId_email_idx" ON "Contact"("organizationId", "email");

-- CreateIndex
CREATE INDEX "Lead_organizationId_status_createdAt_idx" ON "Lead"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_organizationId_email_idx" ON "Lead"("organizationId", "email");

-- CreateIndex
CREATE INDEX "Deal_organizationId_stage_targetCloseAt_idx" ON "Deal"("organizationId", "stage", "targetCloseAt");

-- CreateIndex
CREATE INDEX "Deal_organizationId_ownerId_idx" ON "Deal"("organizationId", "ownerId");

-- CreateIndex
CREATE INDEX "Ticket_organizationId_status_priority_createdAt_idx" ON "Ticket"("organizationId", "status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_organizationId_assigneeId_status_idx" ON "Ticket"("organizationId", "assigneeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_organizationId_reference_key" ON "Ticket"("organizationId", "reference");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_createdAt_idx" ON "TicketMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_organizationId_entityType_entityId_occurredAt_idx" ON "Activity"("organizationId", "entityType", "entityId", "occurredAt");

-- CreateIndex
CREATE INDEX "Activity_organizationId_actorId_occurredAt_idx" ON "Activity"("organizationId", "actorId", "occurredAt");

-- CreateIndex
CREATE INDEX "ScheduledActivity_organizationId_startsAt_endsAt_idx" ON "ScheduledActivity"("organizationId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "ScheduledActivity_organizationId_ownerId_startsAt_idx" ON "ScheduledActivity"("organizationId", "ownerId", "startsAt");

-- CreateIndex
CREATE INDEX "ScheduledActivity_organizationId_status_idx" ON "ScheduledActivity"("organizationId", "status");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_createdAt_idx" ON "AuditEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_entityType_entityId_createdAt_idx" ON "AuditEvent"("organizationId", "entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_organizationId_createdAt_idx" ON "Notification"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_organizationId_userId_dedupeKey_key" ON "Notification"("organizationId", "userId", "dedupeKey");

-- CreateIndex
CREATE INDEX "Mention_organizationId_recipientId_readAt_idx" ON "Mention"("organizationId", "recipientId", "readAt");

-- CreateIndex
CREATE INDEX "Mention_organizationId_sourceEntityType_sourceEntityId_idx" ON "Mention"("organizationId", "sourceEntityType", "sourceEntityId");

-- CreateIndex
CREATE INDEX "ApiKey_organizationId_active_idx" ON "ApiKey"("organizationId", "active");

-- CreateIndex
CREATE INDEX "IntegrationProvider_organizationId_status_idx" ON "IntegrationProvider"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationProvider_organizationId_providerKey_key" ON "IntegrationProvider"("organizationId", "providerKey");

-- CreateIndex
CREATE INDEX "BackupRecord_organizationId_status_idx" ON "BackupRecord"("organizationId", "status");

-- CreateIndex
CREATE INDEX "BackupRecord_expiresAt_idx" ON "BackupRecord"("expiresAt");

-- CreateIndex
CREATE INDEX "RestoreDrill_backupId_idx" ON "RestoreDrill"("backupId");

-- CreateIndex
CREATE INDEX "NotificationDeadLetter_organizationId_status_failedAt_idx" ON "NotificationDeadLetter"("organizationId", "status", "failedAt");

-- CreateIndex
CREATE INDEX "Job_status_runAt_priority_idx" ON "Job"("status", "runAt", "priority");

-- CreateIndex
CREATE INDEX "Job_organizationId_status_idx" ON "Job"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Job_type_idx" ON "Job"("type");

-- CreateIndex
CREATE INDEX "CustomField_organizationId_entityType_active_idx" ON "CustomField"("organizationId", "entityType", "active");

-- CreateIndex
CREATE UNIQUE INDEX "CustomField_organizationId_entityType_key_key" ON "CustomField"("organizationId", "entityType", "key");

-- CreateIndex
CREATE INDEX "AutomationRule_organizationId_trigger_enabled_idx" ON "AutomationRule"("organizationId", "trigger", "enabled");

-- CreateIndex
CREATE INDEX "AutomationRun_organizationId_executedAt_idx" ON "AutomationRun"("organizationId", "executedAt");

-- CreateIndex
CREATE INDEX "AutomationRun_ruleId_idx" ON "AutomationRun"("ruleId");

-- CreateIndex
CREATE INDEX "DocumentSpace_organizationId_idx" ON "DocumentSpace"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSpace_organizationId_slug_key" ON "DocumentSpace"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "Document_organizationId_spaceId_isPublished_idx" ON "Document"("organizationId", "spaceId", "isPublished");

-- CreateIndex
CREATE INDEX "Document_organizationId_visibility_idx" ON "Document"("organizationId", "visibility");

-- CreateIndex
CREATE INDEX "DocumentRevision_documentId_idx" ON "DocumentRevision"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRevision_documentId_version_key" ON "DocumentRevision"("documentId", "version");

-- CreateIndex
CREATE INDEX "WebhookSubscription_organizationId_enabled_idx" ON "WebhookSubscription"("organizationId", "enabled");

-- CreateIndex
CREATE INDEX "WebhookDelivery_organizationId_status_timestamp_idx" ON "WebhookDelivery"("organizationId", "status", "timestamp");

-- CreateIndex
CREATE INDEX "WebhookDelivery_subscriptionId_idx" ON "WebhookDelivery"("subscriptionId");

-- CreateIndex
CREATE INDEX "WebhookNonce_expiresAt_idx" ON "WebhookNonce"("expiresAt");

-- CreateIndex
CREATE INDEX "ProductCatalogItem_organizationId_active_idx" ON "ProductCatalogItem"("organizationId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCatalogItem_organizationId_sku_key" ON "ProductCatalogItem"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "ProformaInvoice_organizationId_dealId_idx" ON "ProformaInvoice"("organizationId", "dealId");

-- CreateIndex
CREATE UNIQUE INDEX "ProformaInvoice_organizationId_invoiceNumber_key" ON "ProformaInvoice"("organizationId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "SupportMacro_organizationId_category_idx" ON "SupportMacro"("organizationId", "category");

-- CreateIndex
CREATE INDEX "RevokedCredential_expiresAt_idx" ON "RevokedCredential"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_organizationId_status_idx" ON "Invitation"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledActivity" ADD CONSTRAINT "ScheduledActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledActivity" ADD CONSTRAINT "ScheduledActivity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationProvider" ADD CONSTRAINT "IntegrationProvider_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRecord" ADD CONSTRAINT "BackupRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestoreDrill" ADD CONSTRAINT "RestoreDrill_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "BackupRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDeadLetter" ADD CONSTRAINT "NotificationDeadLetter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSpace" ADD CONSTRAINT "DocumentSpace_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "DocumentSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRevision" ADD CONSTRAINT "DocumentRevision_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookSubscription" ADD CONSTRAINT "WebhookSubscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "WebhookSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCatalogItem" ADD CONSTRAINT "ProductCatalogItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMacro" ADD CONSTRAINT "SupportMacro_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportSequence" ADD CONSTRAINT "SupportSequence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

