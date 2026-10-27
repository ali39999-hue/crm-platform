# برنامه اجرایی پیاده‌سازی ۱۰۰٪ ماژول‌ها و الگوهای میزیتو (Mizito)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** پیاده‌سازی و ارتقای تمامی ماژول‌ها و رفتارهای کاری میزیتو شامل مکاتبات اداری و کارتابل نامه‌ها (دبیرخانه، ارجاع، پاراف با منطق قفل)، صورتجلسات دیجیتال سازمانی با مصوبات و امضا، ارتقای وظایف و پروژه‌ها (وزن وظیفه، تاییدکننده، پیشرفت وزنی) و داشبورد مانیتورینگ ۵گانه روی وب، API و کلاینت موبایل.

**Architecture:** 
1. لایه دامنه (`packages/domain`): توابع خالص برای تولید شماره اندیکاتور، اعتبارسنجی حذف نامه/پاراف، محاسبه پیشرفت وزنی و بررسی تغییر وضعیت وظیفه بر اساس نقش تاییدکننده.
2. لایه قراردادها (`packages/contracts`): تایپ‌ها و DTOهای کامل مکاتبات اداری، صورتجلسات، و ارتقای مدل وظایف.
3. لایه سرور (`apps/api`): کنترلرها و سرویس‌های ماژول `letters` و `meetings` و ارتقای `tasks`.
4. لایه وب (`apps/web`): کامپوننت‌های کارتابل نامه‌ها (`OfficeLettersView.tsx`)، صورتجلسات سازمانی (`MeetingMinutesView.tsx`)، و داشبورد مانیتورینگ ۵گانه (`ExecutiveMonitoringView.tsx`).
5. لایه موبایل (`apps/mobile`): افزودن کارت نامه‌ها و صورتجلسات به تب‌های اپلیکیشن Expo.

**Tech Stack:** NestJS 12, Next.js 16 App Router, React 19, React Native Expo 57, PostgreSQL, Prisma 7, Vitest, Turborepo.

**Spec:** `docs/references/mizito-scrape/00-mizito-complete-module-matrix.fa.md`

## Global Constraints

- تمام کدهای تجاری و قواعد محاسباتی در `@crm/domain` با پوشش آزمون واحد ۱۰۰٪ TDD.
- تفکیک قطعی چندمستأجری (`tenantId`) در سرتاسر پایگاه داده و سرویس‌ها.
- عدم استفاده از رازها یا توکن‌های واقعی در کدها یا تست‌ها.
- سازگاری کامل با TypeScript strict بدون خطای کامپایل.

---

### Task 1: منطق دامنه مکاتبات اداری، اندیکاتور، پاراف و پیشرفت وزنی در `@crm/domain`

**Files:**
- Modify: `packages/domain/src/crm.ts`
- Modify: `packages/domain/src/project.ts`
- Test: `packages/domain/src/mizito.spec.ts`

**Interfaces:**
- Produces:
  - `generateIndicatorNumber(options: { year: number; secretariatCode: string; sequenceNumber: number }): string`
  - `canDeleteLetter(actor: { id: string; role: string }, letter: { senderId: string; isRead: boolean }): boolean`
  - `canDeleteParaff(actor: { id: string; role: string }, paraff: { authorId: string; isRead: boolean }): boolean`
  - `calculateWeightedProjectProgress(tasks: Array<{ weight?: number; progressPercent?: number }>): number`
  - `evaluateTaskApprovalTransition(options: { hasApprover: boolean; actorId: string; approverId?: string; targetStatus: string }): { nextStatus: string; requiresApproval: boolean }`
  - `calculateMonitoringScore(metrics: { delayedTasks: number; totalTasks: number; activeProjects: number; signedMinutesRate: number }): number`

- [ ] **Step 1: Write failing test in `packages/domain/src/mizito.spec.ts`**
- [ ] **Step 2: Run test to verify it fails (`pnpm --filter @crm/domain test`)**
- [ ] **Step 3: Implement domain functions in `crm.ts` and `project.ts`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit changes**

---

### Task 2: قراردادها و DTOهای مکاتبات، صورتجلسات و ارتقای وظایف در `@crm/contracts`

**Files:**
- Modify: `packages/contracts/src/index.ts`
- Test: `turbo run typecheck`

**Interfaces:**
- Produces:
  - `LetterDto`, `CreateLetterRequest`, `ReferLetterRequest`, `LetterParaffDto`, `CreateParaffRequest`
  - `MeetingMinuteDto`, `CreateMeetingMinuteRequest`, `MeetingResolutionDto`, `SignMeetingRequest`
  - `TaskSummary` & `TaskDetails` updated with `weight?: number`, `approverId?: string`, `approvalStatus?: string`
  - `ExecutiveMonitoringDto`

- [ ] **Step 1: Define DTOs in `packages/contracts/src/index.ts`**
- [ ] **Step 2: Verify typecheck passes across workspace**
- [ ] **Step 3: Commit changes**

---

### Task 3: سرویس‌ها و روت‌های API نامه‌ها، دبیرخانه و صورتجلسات در `apps/api`

**Files:**
- Create: `apps/api/src/modules/letters/letters.service.ts`
- Create: `apps/api/src/modules/letters/letters.controller.ts`
- Create: `apps/api/src/modules/letters/letters.module.ts`
- Create: `apps/api/src/modules/meetings/meetings.service.ts`
- Create: `apps/api/src/modules/meetings/meetings.controller.ts`
- Create: `apps/api/src/modules/meetings/meetings.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/src/modules/letters/letters.spec.ts`
- Test: `apps/api/src/modules/meetings/meetings.spec.ts`

- [ ] **Step 1: Write unit tests for LettersService and MeetingsService**
- [ ] **Step 2: Run tests to verify failure**
- [ ] **Step 3: Implement services, controllers, and modules with tenant isolation**
- [ ] **Step 4: Register modules in `app.module.ts` and run tests to verify pass**
- [ ] **Step 5: Commit changes**

---

### Task 4: کامپوننت‌های کارتابل نامه‌ها، صورتجلسات و مانیتورینگ در `apps/web`

**Files:**
- Create: `apps/web/src/components/OfficeLettersView.tsx`
- Create: `apps/web/src/components/MeetingMinutesView.tsx`
- Create: `apps/web/src/components/ExecutiveMonitoringView.tsx`
- Modify: `apps/web/src/lib/api-client.ts`
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Add client methods to `api-client.ts` in web**
- [ ] **Step 2: Implement UI views with Jalali dates, indicators, and RTL styling**
- [ ] **Step 3: Connect navigation tabs in `apps/web/src/app/page.tsx`**
- [ ] **Step 4: Run build and typecheck to verify 0 errors**
- [ ] **Step 5: Commit changes**

---

### Task 5: ارتقای اپلیکیشن موبایل Expo با تب مکاتبات و صورتجلسات

**Files:**
- Modify: `apps/mobile/src/lib/api-client.ts`
- Modify: `apps/mobile/App.tsx`
- Test: `pnpm --filter @crm/mobile typecheck`

- [ ] **Step 1: Add mobile API client methods**
- [ ] **Step 2: Add quick access to Letters and Meetings in `App.tsx`**
- [ ] **Step 3: Verify TypeScript compilation**
- [ ] **Step 4: Commit changes**

---

### Task 6: اعتبارسنجی کامل، تست‌های جامع و همگام‌سازی با گیت‌هاب

**Files:**
- Update: `README.fa.md`
- Update: `docs/re-audit-2026-10-26/04-EVIDENCE-MANIFEST.json`
- CI: Run all 500+ tests and push to GitHub repository

- [ ] **Step 1: Run full test suite across workspace**
- [ ] **Step 2: Verify git status and commit message formatting**
- [ ] **Step 3: Push to origin/main and monitor CI green run**
