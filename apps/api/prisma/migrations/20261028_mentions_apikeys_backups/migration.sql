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

