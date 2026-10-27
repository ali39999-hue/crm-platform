-- CreateTable
CREATE TABLE "RevokedCredential" (
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "revokedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RevokedCredential_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "RevokedCredential_expiresAt_idx" ON "RevokedCredential"("expiresAt");

