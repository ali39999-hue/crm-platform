# گزارش اجرای P01 — قراردادها، امنیت پایه و CI database

**تاریخ:** ۲۷ اکتبر ۲۰۲۶
**HEAD پایه:** `28a74c6` (main، درخت کاری dirty شامل بسته اجرایی)
**وضعیت:** تمام تغییرات local هستند؛ هیچ commit/push/deploy انجام نشده است.

---

## ۱. هدف و acceptance criteria

بستن گپ‌های OPEN فاز P00 که مانع آغاز رسمی P01/P02 بودند، طبق قاعده گیت («فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود»):

| گپ | اولویت | نتیجه |
|---|---|---|
| GAP-006 — tenant-scoper wire نشده | P0 | **بسته شد** |
| GAP-007 — گاردها global نیستند، rate limiter کد مرده | P1 | **بسته شد** (بخش RBAC) |
| GAP-008 — دیتابیس تست در CI نیست | P0 | **wire شد** (تأیید نهایی روی اولین run CI) |
| GAP-002 — ادعای تست تأییدنشده | P1 | **بسته شد** با اعداد اندازه‌گیری‌شده |
| GAP-004 — ناسازگاری نسخه Node | P2 | **بسته شد** با سیاست مستند |

## ۲. فایل‌های تغییریافته

**جدید:**
- `apps/api/src/prisma/tenant-context.ts` — AsyncLocalStorage per-request با `runAsSystemContext` برای jobهای پس‌زمینه
- `apps/api/src/common/auth/tenant-context.middleware.ts` — باز کردن context برای کل زنجیره request
- `apps/api/src/prisma/tenant-scoper.spec.ts` — ۱۶ تست واحد (۱۱ هسته خالص + ۵ wiring)

**تغییریافته:**
- `apps/api/src/prisma/tenant-scoper.ts` — منطق خالص `applyTenantScope` جدا شد؛ **حفره امنیتی بسته شد**: در نسخه قبلی `update`/`delete`/`aggregate`/`groupBy`/`findFirstOrThrow` scope نمی‌شدند؛ حالا با extendedWhereUnique (Prisma 7) همه به `organizationId` وادار می‌شوند
- `apps/api/src/prisma/prisma.service.ts` — getter `tenantClient` (اکستنشن یک‌بار اعمال، context در زمان عملیات خوانده می‌شود)
- `apps/api/src/common/auth/auth.guard.ts` — انتشار identity تأییدشده به context
- `apps/api/src/app.module.ts` — ثبت global سه گارد (`APP_GUARD`: AuthGuard → PermissionsGuard → RateLimiterGuard) + `TenantContextMiddleware` + config ریلکس rate-limit فقط در non-production
- ۳ repo پرisma (tasks/crm/support) — سوئیچ به `tenantClient`
- ۲ spec شبیه‌سازی‌شده — alias `tenantClient` روی mock
- `.github/workflows/ci.yml` — سرویس `postgres:16-alpine` + `DATABASE_URL` + گام `prisma migrate deploy`
- `scripts/security-audit.js` — ignore شدن `.mimosa`/`.zcode`/`playwright-report`/`test-results` (فایل‌های state ابزار، نه سورس — ریشه ۳ blocker کاذب)
- `.gitignore` — `.mimosa/`
- `README.fa.md` — سیاست Node، ردیف ایزولاسیون با شواهد واقعی، لینک این گزارش
- `docs/implementation/P00-GAP-REGISTER.csv` — به‌روزرسانی وضعیت‌ها

## ۳. API / permission changes

- **ساختاری:** از این پس هر controller بدون `@UseGuards` به‌جای باز بودن کامل، توسط گاردهای global محافظت می‌شود. `@Public()` همچنان مسیر عمومی می‌سازد.
- **Rate limit:** production: 60/min عمومی، 10/min مسیرهای حساس (`/auth/*`, `/export`, `/search` + `@SensitiveEndpoint`)؛ non-production: 600/min برای DX/E2E.
- **بدون تغییر قرارداد مسیرها یا DTO.** رفتار happy-path repoها تغییر نکرده (فیلتر دستی موجود حفظ شده؛ scoper دفاع لایه دوم است).

## ۴. تست‌های واقعاً اجراشده و نتیجه

| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ turbo task سبز |
| `pnpm test` | ۴/۴ task سبز؛ `@crm/api`: **۵۶۰ تست در ۴۲ فایل، همه پاس** (شامل ۱۶ تست جدید scoper) |
| `pnpm security:audit` | exit 0؛ بدون blocker؛ کنترل «Tenant isolation enforcement» حالا **اندازه‌گیری‌شده-درست** است |
| `pnpm test:e2e` (Playwright) | **۶۷/۶۷ پاس** (هشدار clipboard headless مثل baseline غیرمرتبط با تست) |
| `python scripts/validation/validate_pack.py` | OK (repo mode) |
| `pnpm audit:persistence` | مانند P00: ۳ durable / ۱۳ InMemory — تغییری نکرده |

## ۵. ریسک باقی‌مانده و موارد تست‌نشده

1. **GAP-001 هنوز OPEN:** ۱۳ دامنه InMemory هستند (منوط به USE_DATABASE فقط ۳ دامنه Prisma می‌شوند). ضمناً در خود repoهای Prisma، products/invoices/macros هنوز Map درون حافظه‌اند.
2. **تأیید migrate deploy فقط روی اولین run CI** رخ می‌دهد (اینجا Docker نیست) — GAP-008 روی IN_PROGRESS مانده.
3. **تست منفی DB-level** (cross-tenant روی postgres واقعی) وجود ندارد؛ پوشش فعلی unit + mock است. اولین قدم P02.
4. **یافته‌های ممیزی RBAC که عمداً تغییر نکردند** (نیازمند تصمیم مالک محصول/تست E2E): سطح دسترسی read روی عملیات write در saved-views، mentions read، notifications read-all/preferences، voip call-event؛ عدم rate-limit captcha/lockout روی login.
5. **`/metrics` عمومی است** (`@Public`) — افشای metric داخلی؛ تصمیم SRE لازم دارد.
6. **Health readiness همیشه `database: connected` گزارش می‌دهد** — دروغ در حالت بدون DB؛ در P13 اصلاح شود.

## ۶. اجرای مرحله دوم — slice بعدی GAP-001 (پروژه‌ها و ثبت زمان)

### ۶.۱ یافته بحرانی: AppModule هرگز نمی‌توانست بوت شود
`ProjectService`، `TimeTrackingService`، `CustomFieldService`، `MentionService` و `ApiKeyService` به‌همراه توکن‌های repositoryشان **فقط در `exports` ثبت شده بودند، نه در `providers`** — Nest فقط providers را instantiate می‌کند؛ یعنی API در اولین بوت واقعی روی وابستگی این پنج سرویس کرش می‌کرد. هیچ تستی این را نمی‌گرفت چون AppModule هیچ‌جا compile نمی‌شد. اصلاح شد و با `app.module.di-coverage.spec.ts` (قاعده exports⊆providers) برای همیشه قفل شد.

### ۶.۲ دو دامنه جدید durable شدند (۳ → ۵)
- `PrismaProjectRepository` (+ Milestone) — مدل‌های schema از قبل موجود بودند
- `PrismaTimeTrackingRepository` (WorkLog) — شامل تبدیل ستون `@db.Date` به رشته تاریخ
- هر دو از `tenantClient` استفاده می‌کنند؛ `Milestone` و `WorkLog` به `TENANT_SCOPED_MODELS` اضافه شدند
- `TimeTrackingService` که کلاس InMemory را مستقیم تزریق می‌کرد به توکن `'TIME_TRACKING_REPOSITORY'` مهاجرت شد
- `audit:persistence`: توکن‌ها حالا ۷ database / 3 in-memory (notification، dlq، job)

### ۶.۳ گیت fail-closed جدید در production
`assertProductionReadiness` حالا حتی در حالت `USE_DATABASE=true` اگر دامنه‌ای هنوز durable نباشد با لیست دقیق (`DOMAINS_WITHOUT_DURABLE_REPOSITORY`) از بوت جلوگیری می‌کند — هیچ fallback خاموش InMemory در production ممکن نیست. وقتی همه repoها پیاده شوند، این گیت خودبه‌خود سبز می‌شود.

### ۶.۴ شواهد مرحله دوم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: **۵۷۴/۵۷۴** (۴۵ فایل — +۱۱ تست repo جدید، +۳ تست DI)؛ domain: ۸۸/۸۸ |
| `pnpm audit:persistence` | PROJECT/TIME tokens → `database`؛ verdict هنوز PRODUCTION_PATH_HAS_IN_MEMORY (صادقانه) |
| `pnpm test:e2e` | ۶۷/۶۷ |

## ۷. اجرای مرحله سوم — Activity و Notification durable شدند (۵ → ۷ دامنه)

### ۷.۱ تغییرات schema (همه افزودنی؛ rollback = drop دو جدول و سه ستون)
- جدول جدید **`ScheduledActivity`** (فعالیت‌های زمان‌بندی‌شده: participants به‌صورت `String[]`، ایندکس‌های بازه زمانی/مالک/وضعیت، FK به Organization و User)
- جدول جدید **`NotificationPreference`** (ترجیحات کانال هر کاربر، PK روی userId)
- ستون `visibility` روی `Activity`، ستون‌های `title`/`message` با default روی `Notification`
- Migration `20261028_activity_notification_persistence` **بدون دیتابیس** با `prisma migrate diff --from-schema --to-schema --script` تولید شد (اینجا Docker نیست) و فقط شامل دلتای جدید است — اجرای واقعی آن روی اولین run CI (گپ GAP-008) راستی‌آزمایی می‌شود

### ۷.۲ پیاده‌سازی
- `PrismaActivityRepository`: فید تایم‌لاین با include نام actor؛ `findByAccount` با فیلتر `metadata.path`؛ `detectConflicts` با overlap در کوئری + `participantIds hasSome`؛ update/delete محدود به org
- `PrismaNotificationRepository`: dedupe با @@unique و catch P2002 (idempotent)؛ `markAllAsRead` با updateMany شمارنده؛ preferences با upsert
- `ActivityService` از تزریق مستقیم کلاس InMemory به توکن `'ACTIVITY_REPOSITORY'` مهاجرت شد؛ Notification از قبل توکن‌محور بود
- `DOMAINS_WITHOUT_DURABLE_REPOSITORY`: حذف activity/notifications؛ فقط `notification-dlq` باقی است
- هم‌راستاسازی نوع `filters` در سه لایه controller/service/interface برای `exactOptionalPropertyTypes`

### ۷.۳ شواهد مرحله سوم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: **۵۸۳/۵۸۳** (۴۷ فایل — +۹ تست repo)؛ domain: ۸۸/۸۸ |
| `pnpm audit:persistence` | **۱۱ توکن: ۹ database / ۲ in-memory** (notification-dlq، job) |
| `pnpm test:e2e` | ۶۷/۶۷ |

## ۸. اجرای مرحله چهارم — mentions، api-key و backup durable شدند (۷ → ۱۰ دامنه)

- مدل‌های جدید schema: **`Mention`**، **`ApiKey`** + **`IntegrationProvider`** (unique per org+providerKey)، **`BackupRecord`** + **`RestoreDrill`** (organizationId نال‌پذیر برای بکاپ‌های سیستمی؛ sizeBytes با BigInt)
- `Mention`/`ApiKey`/`IntegrationProvider` به `TENANT_SCOPED_MODELS` اضافه شدند؛ `BackupRecord`/`RestoreDrill` عمداً scoped نیستند (findById/findAll عملیات platform-admin بدون آرگومان org است — فیلتر دستی در findByOrg، مستند در کامنت repo)
- هر سه سرویس (Mention/ApiKey/Backup) از تزریق مستقیم کلاس InMemory به توکن‌های `'MENTION_REPOSITORY'`/`'API_KEY_REPOSITORY'`/`'BACKUP_REPOSITORY'` مهاجرت شدند
- `update` در backup repo حالا خطای `P2025` را می‌گیرد و null برمی‌گرداند (قرارداد interface)
- migration `20261028_mentions_apikeys_backups` — آفلاین با diff تولید شد
- `DOMAINS_WITHOUT_DURABLE_REPOSITORY` → ۶ دامنه باقی: automation، custom-fields، documents، webhook، jobs، notification-dlq

### شواهد مرحله چهارم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: **۵۹۳/۵۹۳** (۵۰ فایل — +۱۰ تست repo جدید)؛ domain: ۸۸/۸۸ |
| `pnpm audit:persistence` | **۱۴ توکن: ۱۲ database / ۲ in-memory** |
| `pnpm test:e2e` | ۶۷/۶۷ |

## ۹. اجرای مرحله پنجم — jobs، dlq، custom-fields و automation durable شدند (۱۶/۱۶ توکن database)

- مدل‌های جدید: **`NotificationDeadLetter`**، **`Job`**، **`CustomField`**، **`AutomationRule`** + **`AutomationRun`**
- `Job` عمداً scoped نیست (صف سیستم است؛ worker بیرون HTTP اجرا می‌شود) — worker حالا `job.organizationId` را در tenant-context تزریق می‌کند تا هندلرهای آینده (P09) روی مدل‌های scoped سالم کار کنند
- `claimNextRunnableJob` اتمیک است: updateMany شرطی — اگر دو worker همزمان claim کنند فقط یکی count=1 می‌گیرد
- سرویس‌های CustomField و Automation به توکن مهاجرت شدند؛ DLQ و Job از قبل توکن‌محور بودند و فقط سوییچ conditional گرفتند
- `pnpm audit:persistence`: **۱۶ توکن = ۱۶ database / ۰ in-memory**
- `DOMAINS_WITHOUT_DURABLE_REPOSITORY` → ۲ دامنه: documents، webhook

### شواهد مرحله پنجم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: **۶۰۶/۶۰۶** (۵۴ فایل — +۱۳ تست repo)؛ domain: ۸۸/۸۸ |
| `pnpm audit:persistence` | ۱۶/۱۶ توکن database |
| `pnpm test:e2e` | ۶۷/۶۷ |

## ۱۰. Rollback

- تمام تغییرات در فایل‌های مشخص است؛ `git checkout -- <files>` یا حذف ۳ فایل جدید + revert چهار فایل app.module/prisma.service/auth.guard کافی است.
- رفتار ریسک‌دارترین تغییر (گاردهای global) با حذف ۳ provider `APP_GUARD` در `app.module.ts` کامل برمی‌گردد.
