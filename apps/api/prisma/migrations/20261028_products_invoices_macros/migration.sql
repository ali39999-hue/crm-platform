-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "lossDescription" TEXT,
ADD COLUMN     "lossReason" TEXT,
ADD COLUMN     "lostAt" TIMESTAMPTZ(6),
ADD COLUMN     "nextActionDueAt" TIMESTAMPTZ(6),
ADD COLUMN     "nextActionTitle" TEXT,
ADD COLUMN     "products" JSONB,
ADD COLUMN     "stageUpdatedAt" TIMESTAMPTZ(6);

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

-- AddForeignKey
ALTER TABLE "ProductCatalogItem" ADD CONSTRAINT "ProductCatalogItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMacro" ADD CONSTRAINT "SupportMacro_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportSequence" ADD CONSTRAINT "SupportSequence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

