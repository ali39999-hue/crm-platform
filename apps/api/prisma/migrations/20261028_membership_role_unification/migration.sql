-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MembershipRole" ADD VALUE 'SystemOwner';
ALTER TYPE "MembershipRole" ADD VALUE 'OrganizationAdmin';
ALTER TYPE "MembershipRole" ADD VALUE 'Manager';
ALTER TYPE "MembershipRole" ADD VALUE 'Employee';
ALTER TYPE "MembershipRole" ADD VALUE 'Sales';
ALTER TYPE "MembershipRole" ADD VALUE 'SupportAgent';
ALTER TYPE "MembershipRole" ADD VALUE 'CustomerPortalUser';
ALTER TYPE "MembershipRole" ADD VALUE 'Auditor';
ALTER TYPE "MembershipRole" ADD VALUE 'IntegrationAccount';
-- Data migration: map legacy coarse roles onto the unified domain roles.
UPDATE "Membership" SET "role" = 'SystemOwner' WHERE "role" = 'OWNER';
UPDATE "Membership" SET "role" = 'OrganizationAdmin' WHERE "role" = 'ADMIN';
UPDATE "Membership" SET "role" = 'Manager' WHERE "role" = 'MANAGER';
UPDATE "Membership" SET "role" = 'Employee' WHERE "role" = 'MEMBER';
UPDATE "Membership" SET "role" = 'CustomerPortalUser' WHERE "role" = 'CUSTOMER';
UPDATE "Membership" SET "role" = 'Auditor' WHERE "role" = 'AUDITOR';


