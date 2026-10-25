# Enterprise Documents and Collaboration Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an enterprise-grade Documents & Knowledge Base module enabling workspaces to create, organize, version, and share documents across spaces, with strict 4-tier visibility controls (`PRIVATE`, `TEAM`, `WORKSPACE`, `CUSTOMER_VISIBLE`), revision history, CRM record association, and customer portal isolation.

**Architecture:** Add shared contracts and domain validation rules, then implement a NestJS `DocumentsModule` backed by tenant-scoped persistence with automatic revision logging and PII/audit tracking. Build interactive Web frontend components with space navigation, rich markdown editing, revision diffing, and customer portal views.

**Tech Stack:** TypeScript 5.9, NestJS 12, Next.js 16 (App Router), React 19, Vitest, Playwright, Tailwind CSS.

**Spec:** `docs/enterprise-ux/ux/11-docs-collaboration.fa.md` and `ROADMAP.fa.md` (Section 2 & 11).

## Global Constraints
- Node.js >= 22.0.0, pnpm 10.20.0
- All API queries and mutations must be tenant-isolated by `organizationId`
- CustomerPortalUser role must NEVER access `PRIVATE`, `TEAM`, or `WORKSPACE` documents
- Unpublished drafts must never be accessible to external customers
- Every document edit must generate an immutable `DocumentRevision` entry with actor ID and diff/snapshot
- Content must be sanitized against script injection / XSS

## Review Focus
1. Cross-tenant access attempt: `GET /documents/:id` with forged tenant ID returns 404/403.
2. Customer portal permission bypass: Customer attempting to fetch internal document receives 403 Forbidden.
3. Revision history immutability: Previous revisions cannot be updated or deleted, only restored to a new tip revision.
4. Draft vs Published state: Customer queries return only documents with `visibility: 'CUSTOMER_VISIBLE'` AND `isPublished: true`.
5. Concurrent editing conflict: Optimistic locking with integer `version` field prevents silent overwrite.

---

### Task 1: Shared Contracts for Documents & Revisions

**Files:**
- Modify: `packages/contracts/src/index.ts`
- Test: `packages/contracts/src/index.ts` (tested via build/typecheck)

**Interfaces:**
- Produces:
  - `DocumentVisibility = 'PRIVATE' | 'TEAM' | 'WORKSPACE' | 'CUSTOMER_VISIBLE'`
  - `DocumentSummaryDto`
  - `DocumentDetailDto`
  - `DocumentRevisionDto`
  - `DocumentSpaceDto`
  - `CreateDocumentRequest`
  - `UpdateDocumentRequest`
  - `CreateDocumentSpaceRequest`

- [ ] **Step 1: Write type definitions and DTO contracts in `packages/contracts/src/index.ts`**
- [ ] **Step 2: Build contracts package: `pnpm --filter @crm/contracts build`**
- [ ] **Step 3: Run typecheck to verify contracts: `pnpm --filter @crm/contracts typecheck`**
- [ ] **Step 4: Commit contracts changes**

---

### Task 2: Domain Validation & Visibility Rules in `@crm/domain`

**Files:**
- Create: `packages/domain/src/documents.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `packages/domain/src/documents.test.ts`

**Interfaces:**
- Consumes: `DocumentVisibility`, `MembershipRole`
- Produces:
  - `canAccessDocument(role: MembershipRole, visibility: DocumentVisibility, isPublished: boolean): boolean`
  - `assertDocumentAccess(role: MembershipRole, visibility: DocumentVisibility, isPublished: boolean): void`
  - `sanitizeDocumentContent(raw: string): string`

- [ ] **Step 1: Write the failing tests in `packages/domain/src/documents.test.ts`**
- [ ] **Step 2: Run test to verify it fails: `pnpm --filter @crm/domain test`**
- [ ] **Step 3: Implement domain logic in `packages/domain/src/documents.ts`**
- [ ] **Step 4: Run test to verify it passes: `pnpm --filter @crm/domain test`**
- [ ] **Step 5: Commit domain changes**

---

### Task 3: Backend Documents Module in `@crm/api`

**Files:**
- Create: `apps/api/src/modules/documents/dto/create-document.dto.ts`
- Create: `apps/api/src/modules/documents/dto/update-document.dto.ts`
- Create: `apps/api/src/modules/documents/dto/document-query.dto.ts`
- Create: `apps/api/src/modules/documents/document.repository.ts`
- Create: `apps/api/src/modules/documents/document.service.ts`
- Create: `apps/api/src/modules/documents/document.controller.ts`
- Create: `apps/api/src/modules/documents/documents.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/src/modules/documents/document.spec.ts`

**Interfaces:**
- Consumes: `@crm/contracts`, `@crm/domain`, `AuditService`, `ActivityService`
- Produces: `DocumentsController`, `DocumentsService`, `DocumentRepository`

- [ ] **Step 1: Write unit and integration tests in `apps/api/src/modules/documents/document.spec.ts` covering CRUD, tenant isolation, visibility checks, and revision history**
- [ ] **Step 2: Run test to verify it fails: `pnpm --filter @crm/api test`**
- [ ] **Step 3: Implement repository, service, controller, and module with full auditing**
- [ ] **Step 4: Run test to verify it passes: `pnpm --filter @crm/api test`**
- [ ] **Step 5: Commit backend changes**

---

### Task 4: Web UI Documents Workspace in `@crm/web`

**Files:**
- Create: `apps/web/src/components/DocumentsView.tsx`
- Create: `apps/web/src/components/CreateDocumentModal.tsx`
- Modify: `apps/web/src/components/index.ts`
- Modify: `apps/web/src/lib/api-client.ts`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/portal/page.tsx`

**Interfaces:**
- Consumes: `apiClient.documents`, `customerApiClient.documents`
- Produces: `DocumentsView`, `CreateDocumentModal`

- [ ] **Step 1: Add document API client methods in `apps/web/src/lib/api-client.ts`**
- [ ] **Step 2: Build `DocumentsView` and `CreateDocumentModal` with space tree, editor, and revision drawer**
- [ ] **Step 3: Add Documents tab to main workspace in `apps/web/src/app/page.tsx` and customer documents in `apps/web/src/app/portal/page.tsx`**
- [ ] **Step 4: Typecheck and build web app: `pnpm --filter @crm/web build`**
- [ ] **Step 5: Commit web changes**

---

### Task 5: End-to-End Tests & CI Verification

**Files:**
- Create: `tests/e2e/documents-workflow.spec.ts`
- Test: `pnpm test:e2e`

- [ ] **Step 1: Write Playwright E2E tests for document creation, revision tracking, and customer portal visibility isolation**
- [ ] **Step 2: Run full verification: `pnpm typecheck && pnpm test && pnpm build`**
- [ ] **Step 3: Commit and push changes to GitHub**
- [ ] **Step 4: Verify GitHub Actions CI run succeeds**
