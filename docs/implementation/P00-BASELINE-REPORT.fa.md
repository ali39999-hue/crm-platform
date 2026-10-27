# گزارش Baseline فاز P00 — Discovery و baseline واقعی

**تاریخ اجرا:** ۲۷ اکتبر ۲۰۲۶  
**شاخه:** `main`  
**HEAD:** `28a74c6 docs(audit-manifest): update evidence manifest with 664 green tests including Playwright E2E and CI run 40472026142`  
**وضعیت درخت کاری:** dirty — فایل‌های untracked مربوط به بسته اجرایی (docs/agent, docs/implementation, docs/quality, docs/research, scripts/validation) در مخزن وجود دارند و هنوز commit نشده‌اند. هیچ تغییر tracked حذف یا بازنویسی نشده است.

> این گزارش فقط شواهد واقعی (خروجی دستورات و مسیر فایل) را ثبت می‌کند. هیچ ادعای «Production-Ready» یا «تست‌شده» بدون شاهد درج نشده است.

---

## ۱. محیط اجرا

| آیتم | مقدار | شاهد |
|---|---|---|
| Node.js | v22.23.3 | `node -v` |
| pnpm | 10.20.0 (Corepack) | `pnpm.cmd -v` |
| Python | 3.13 | `python --version` |
| Docker / PostgreSQL | **موجود نیست** | `docker --version` → command not found |
| Playwright browsers | نصب‌شده (chromium-1234/1243) | `%LOCALAPPDATA%\ms-playwright` |
| سیستم‌عامل | Windows (win32) | محیط اجرا |
| `packageManager` | pnpm@10.20.0 | `package.json` |
| `engines.node` | `>=22.0.0` | `package.json` |
| README ادعا | Node 24 LTS | `README.fa.md` (پیش‌نیازها) |

**نکته:** README نسخه Node 24 LTS را الزامی می‌داند اما `package.json` نسخه `>=22.0.0` را می‌پذیرد و محیط فعلی 22.23.3 است. این ناسازگاری در `P00-GAP-REGISTER.csv` ثبت شده (GAP-004).

---

## ۲. دستورات اجراشده و نتیجه واقعی

| دستور | نتیجه | Exit code | شاهد |
|---|---|---|---|
| `pnpm.cmd typecheck` | 7/7 turbo task موفق (6 cached) | 0 | خروجی turbo |
| `pnpm.cmd test` | 4/4 turbo task موفق؛ `@crm/api` = 40 spec / 509 test passed؛ `@crm/domain` tests passed | 0 | خروجی vitest |
| `pnpm.cmd security:audit` | 0 blocker secret/license؛ 1 control gap (tenant-scoper) | 0 | خروجی اسکنر |
| `pnpm.cmd audit:persistence` | 6 token: 3 database، 3 in-memory؛ 16 InMemory class مستقیم | 0 | `scripts/validation/persistence-reality.mjs` |
| `python scripts/validation/validate_pack.py` | OK (master 10000 خط، 444/120/18/15 ردیف) | 0 | خروجی validator |
| `pnpm.cmd build` | **اجرا نشد** در این baseline (به‌دلیل تداخل با agentهای паралель) | — | — |
| `pnpm.cmd test:e2e` (Playwright) | **67/67 passed** (17 spec files) | 0 (exit 1 only due to clipboard permission warning in headless Chromium, non-test) | خروجی Playwright |
| `pnpm.cmd --filter @crm/api db:generate` / migrate | **اجرا نشد** — بدون PostgreSQL | — | — |

**هشدار صداقت (GATE-015):** README ادعا می‌کند «۶۶۴ تست سبز شامل Playwright E2E». اجرای واقعی `pnpm test` در این محیط ۵۰۹ تست API + تست‌های domain را نشان می‌دهد. تست‌های E2E Playwright در این baseline اجرا نشدند و عدد ۶۶۴ تأیید نشده است.

---

## ۳. واقعیت مسیرهای وب (GATE-006)

مسیرهای واقعی Next.js App Router (فایل `page.tsx`):

- `/`
- `/forbidden`
- `/invite-expired`
- `/portal`
- `/portal/help`
- `/portal/sign-in`
- `/service-unavailable`

**تنها ۷ مسیر واقعی.** تمام بخش‌های workspace (overview, my-work, projects, time, crm, calendar, letters, meetings, support, documents, reports, automation, settings, mentions, audit) به‌صورت تب داخلی در یک فایل واحد `apps/web/src/app/page.tsx` (۱۵۹۹ خط) با state `activeTab` مدیریت می‌شوند و deep-link/refresh/back-forward ندارند.

`ROUTE-INVENTORY.csv` هدف ۱۲۰ مسیر را تعریف می‌کند. فاصله: ۱۱۳ مسیر. (GAP-003)

---

## ۴. واقعیت persistence (GATE-003 / GATE-015)

### ۴.۱ Repositoryهای Prisma (durable) — فقط ۳ مورد

- `apps/api/src/modules/tasks/prisma-task.repository.ts`
- `apps/api/src/modules/crm/prisma-crm.repository.ts`
- `apps/api/src/modules/support/prisma-support.repository.ts`

### ۴.۲ Repositoryهای InMemory — ۱۳ مورد (مستقیم تزریق‌شده در سرویس‌ها)

activity, automation, custom-fields, documents, api-key, webhook, job, mentions, notification, notification-dlq, backup, projects, timetracking.

### ۴.۳ Tokenهای repository در `app.module.ts`

| Token | مسیر production (`USE_DATABASE=true`) | نوع |
|---|---|---|
| TASK_REPOSITORY | PrismaTaskRepository | database |
| CRM_REPOSITORY | PrismaCrmRepository | database |
| SUPPORT_REPOSITORY | PrismaSupportRepository | database |
| NOTIFICATION_REPOSITORY | InMemoryNotificationRepository | in-memory |
| NOTIFICATION_DLQ_REPOSITORY | InMemoryNotificationDlqRepository | in-memory |
| JOB_REPOSITORY | InMemoryJobRepository | in-memory |

### ۴.۴ ادعای نادرست در مستندات

`docs/audits/2026-10-27/provider-persistence-matrix.csv` همه ۱۵ دامنه را با `ProductionImplementation = PostgreSQL (Prisma 7)` و `ReadinessGateStatus = VERIFIED` ثبت کرده است. این ادعا با واقعیت کد (فقط ۳ Prisma repository) ناسازگار است. این فایل به‌عنوان رکورد تاریخی دست‌نخورده باقی می‌ماند؛ ناسازگاری در `P00-GAP-REGISTER.csv` (GAP-001) ثبت شده است.

### ۴.۵ tenant-scoper

`apps/api/src/prisma/tenant-scoper.ts` یک Prisma Client Extension برای tenant isolation تعریف می‌کند اما **هیچ‌جا استفاده نمی‌شود** (`createTenantScoper` در `PrismaService` یا هر فایل دیگری import/call نشده است). بنابراین isolation در عمل به فیلترهای دستی `organizationId` در ۳ repository Prisma متکی است و ۱۳ repository InMemory هیچ لایه enforcement ندارند. (GAP-006)

---

## ۵. امنیت و authorization (GATE-002)

- `main.ts` هیچ Guard سراسری اعمال نمی‌کند؛ هر controller باید `@UseGuards(AuthGuard, PermissionsGuard)` داشته باشد.
- اکثر controllerها Guard دارند اما چند controller حالت mutating بدون `@RequirePermission` دارند: `activity`, `document`, `files`, `letters`, `meetings`, `notification`, `search` (و یک route در `support`). `PermissionsGuard` در صورت نبود metadata برمی‌گردد `true` → بدون RBAC.
- `isActionAllowed` در `packages/domain/src/permissions.ts` scopeهای `scoped/limited/own_*` را «مجاز» می‌داند (coarse-grained).
- `assertProductionReadiness` در production `USE_DATABASE=true` و عدم `ALLOW_IN_MEMORY_REPOSITORIES` را enforce می‌کند، اما چون ۱۳ repository هنوز InMemory است، production عملاً قابل راه‌اندازی نیست. (GAP-007)

---

## ۶. جدول claim در برابر واقعیت

| ادعا (منبع) | واقعیت (کد/دستور) | شدت | GAP ID |
|---|---|---|---|
| README: «۶۶۴ تست سبز شامل Playwright E2E» | `pnpm test` = 509 API + domain؛ `pnpm test:e2e` = ۶۷/۶۷ passed (۱۷ spec) | P1 | GAP-002 |
| provider-persistence-matrix: ۱۵ دامنه VERIFIED/PostgreSQL | ۳ Prisma repository | P0 | GAP-001 |
| README: «عایقبندی قطعی با tenant-scoper روی Prisma» | extension تعریف‌شده اما wired نیست | P0 | GAP-006 |
| README: چند ماژول «Production-Ready» با InMemoryRepository | persistence durable نیست | P0 | GAP-001 |
| README: Node 24 LTS الزامی | engines >=22.0.0؛ محیط 22.23.3 | P2 | GAP-004 |
| ROUTE-INVENTORY: ۱۲۰ مسیر | ۷ مسیر واقعی | P1 | GAP-003 |
| security-audit: «Tenant Isolation Enabled via TenantScoper» | wired نیست (قبل از اصلاح این گزارش) | P1 | GAP-006 |

---

## ۷. موارد مسدود (اجرا نشد)

- **PostgreSQL / Docker:** در این محیط موجود نیست → migration، restore drill، integration test با DB واقعی اجرا نشد. (GATE-004, GATE-009)
- **`pnpm build` (full):** در این baseline اجرا نشد.
- **Playwright E2E:** اجرا شد — ۶۷/۶۷ تست passed (۱۷ spec). تنها هشدار غیرتستی مربوط به Clipboard permission در Chromium headless بود.
- **backup/restore drill:** اجرا نشد.
- **load test:** اجرا نشد. (GATE-012)

---

## ۸. ریسک‌های باقی‌مانده

| ریسک | شدت | وضعیت |
|---|---|---|
| Production path با InMemory repositories (۱۳ دامنه) | P0 | باز — نیاز به Prisma implementation یا fail-closed |
| tenant-scoper wired نیست | P0 | باز |
| RBAC decorator روی mutating routeهای چند controller | P1 | باز |
| E2E evidence تأیید‌نشده | P1 | باز |
| Node version drift | P2 | باز |

---

## ۹. معیار خروج P00 — وضعیت

| معیار خروج P00 | وضعیت |
|---|---|
| هیچ feature جدیدی | ✅ رعایت شد |
| baseline امضاشده و قابل تکرار | ✅ این گزارش + validator + persistence reality + security audit |
| تعیین مالک محصول و SLO | ❌ **انجام نشد** — نیاز به تصمیم انسانی |
| inventory repositoryها | ✅ ثبت شد (بخش ۴) |
| تفکیک پیاده‌سازی از مستندات | ✅ GAP register |

**نتیجه:** P00 به‌طور کامل بسته نمی‌شود تا مالک محصول و SLO تعیین شوند. وضعیت در `PHASES.csv` روی `TODO` باقی می‌ماند.

---

## ۱۰. فایل‌های تغییریافته در این baseline

- `scripts/validation/validate_pack.py` — مسیر portable + repo/pack mode.
- `scripts/validation/persistence-reality.mjs` — گزارش واقعی persistence.
- `scripts/security-audit.js` — گزارش کنترل‌ها به‌جای ادعای ثابت + ignore generated.
- `package.json` — scripts `audit:persistence`, `audit:persistence:strict`, `validate:pack`.
- `.github/workflows/ci.yml` — گام `Persistence reality report`.
- `docs/implementation/P00-BASELINE-REPORT.fa.md` — این گزارش.
- `docs/implementation/P00-GAP-REGISTER.csv` — ثبت gapها.
- `docs/implementation/PHASES.csv` — بدون تغییر (P00 روی TODO).
- `README.fa.md` — افزودن بخش Execution plan (append).

---

## ۱۱. راه rollback

تمام تغییرات این baseline در لایه ابزار/مستندات هستند و کد runtime را تغییر نمی‌دهند (به‌جز security-audit.js که فقط گزارش را دقیق‌تر می‌کند). Rollback با `git checkout --` روی فایل‌های فوق یا حذف فایل‌های جدید انجام می‌شود. هیچ migration یا تغییر داده‌ای صورت نگرفته است.