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

## ۱۰. اجرای مرحله ششم (پایانی) — documents و webhook durable شدند

- مدل‌های جدید: **`DocumentSpace`**، **`Document`**، **`DocumentRevision`** (unique نسخه per document)، **`WebhookSubscription`**، **`WebhookDelivery`**، **`WebhookNonce`** (کلید ترکیبی scope+nonce برای ضد-replay)
- `IDocumentRepository` به کلاس in-memory اضافه شد (قبلاً کلاس خام تزریق می‌شد)؛ سرویس‌های Documents و Webhook به توکن مهاجرت کردند
- `DOMAINS_WITHOUT_DURABLE_REPOSITORY` حالا **خالی** است — گیت fail-closed production خودبه‌خود سبز می‌شود
- `pnpm audit:persistence:strict` (گیت پیش از P14) **سبز** شد

### شواهد مرحله ششم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: **۶۱۴/۶۱۴** (۵۶ فایل — +۸ تست)؛ domain: ۸۸/۸۸ |
| `pnpm audit:persistence:strict` | **exit 0** — ۱۸ توکن = ۱۸ database |
| `pnpm test:e2e` | ۶۷/۶۷ |

### باقی‌مانده صادقانه GAP-001
سه Map درون repoهای پرisma موجود: products/invoices در `PrismaCrmRepository` و macros/orgCounter در `PrismaSupportRepository` — داده ثانویه داخل دامنه‌های durable؛ مدل ProductCatalog/ProformaInvoice/SupportMacro لازم است. به‌علاوه تست منفی DB-level روی postgres واقعی (اولین run CI).

## ۱۱. اجرای مرحله هفتم (نهایی) — آخرین Map ها هم durable شدند

- مدل‌های جدید: **`ProductCatalogItem`** (unique SKU per org، unitPriceMinor با BigInt، taxRate با Decimal)، **`ProformaInvoice`** (unique شماره per org، اقلام Json)، **`SupportMacro`** و **`SupportSequence`**
- **کشف مهم:** Map پنجمی هم وجود داشت — `dealExtensions` در `PrismaCrmRepository` که lossReason/lostAt/nextAction/stageUpdatedAt/products را در حافظه نگه می‌داشت؛ ستون‌های متناظر به مدل Deal اضافه شدند
- شماره تیکت (`TKT-1001...`) حالا با **sequence اتمیک per-org** تولید می‌شود (updateMany increment + unique constraint پشتیبان)
- دیگر هیچ Map حافظه‌ای در هیچ Prisma repository وجود ندارد

### شواهد مرحله هفتم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: **۶۱۴/۶۱۴**؛ domain: ۸۸/۸۸ |
| `pnpm audit:persistence:strict` | **exit 0** |
| `pnpm test:e2e` | ۶۷/۶۷ |

## ۱۲. فاز P02 — گام اول: هویت durable (commit بعدی)

- ستون `passwordHash` روی User + migration `20261028_identity_password`
- **`IIdentityStore`** جدید: `InMemoryIdentityStore` (همان fixtureهای dev/test، غیرفعال در production) و **`PrismaIdentityStore`** که از جدول‌های User/Membership با tenantClient می‌خواند؛ نگاشت نقش‌های Prisma (OWNER/ADMIN/MANAGER/MEMBER/CUSTOMER/AUDITOR) به نقش‌های ماتریس domain (SystemOwner/.../Employee/...) مستند و تست‌شده
- `AuthService` حالا store تزریق‌شده دارد و متدهایش async شدند (`IDENTITY_STORE` conditional با USE_DATABASE)؛ `AuthGuard` async شد؛ verify در DB-mode با PBKDF2 روی `User.passwordHash`
- ناسازگاری قدیمی دو enum نقش مستند شد — یکسان‌سازی schema تصمیم آینده P02 است
- در DB-mode کاربران باید در جدول User با passwordHash provision شوند (ثبت‌نام/دعوت‌نامه = تسک بعدی P02)
- ۳۱ نقطه فراخوانی (گارد/کنترلر/۵ spec) به async مهاجرت کردند

### شواهد فاز P02 گام اول
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: **۶۱۹/۶۱۹** (+۵ تست identity store)؛ domain: ۸۸/۸۸ |
| `pnpm test:e2e` | ۶۷/۶۷ |
| `pnpm audit:persistence:strict` | exit 0 |

## ۱۳. فاز P02 — گام دوم: ثبت‌نام سازمان (tenant onboarding)

- `POST /api/v1/auth/register` عمومی (تحت rate-limit مسیر حساس auth): ایجاد **مالک + سازمان در یک گام**؛ رمز با PBKDF2 هش می‌شود و plaintext هرگز به store نمی‌رسد
- `IIdentityStore.createUserWithOrganization` در هر دو پیاده‌سازی: Prisma (ساخت Organization + User + Membership OWNER، catch P2002 → 409) و InMemory (برای dev/test)
- DTO با اعتبارسنجی class-validator؛ پاسخ مثل login شامل memberships؛ audit event `AUTH_REGISTER`
- تست‌ها: ثبت‌نام موفق → نقش SystemOwner → login با همان رمز؛ رد ایمیل تکراری با 409

### شواهد گام دوم
| دستور | نتیجه |
|---|---|
| `pnpm test` | API: **۶۲۱/۶۲۱** (+۲ تست register) |
| `pnpm test:e2e` | ۶۷/۶۷ |

## ۱۴. فاز P02 — گام سوم: دعوت‌نامه durable اعضا

- مدل **`Invitation`** (tokenHash یکتا با SHA-256، انقضای ۷ روزه، وضعیت PENDING/ACCEPTED/REVOKED، invitedBy، acceptedUserId) + migration هفتم
- یافته امنیتی: جریان قبلی `inviteMember` بلافاصله عضو فعال با userId جعلی می‌ساخت — بدون token، بدون رضایت، بدون رمز؛ مسیر legacy دست‌نخورده ماند (مستند برای مهاجرت در ادامه P02) و مسیر جدید جایگزین آن خواهد شد
- `InvitationService`: ایجاد دعوت‌نامه (manage_members) با **token یک‌بارمصرف که فقط یک بار plaintext برگردانده می‌شود** (فقط hash ذخیره می‌شود)؛ پذیرش عمومی `POST /auth/invitations/accept` (کاربر جدید = تعیین رمز PBKDF2؛ کاربر موجود = عضویت با هویت فعلی)؛ لغو و فهرست با مجوز manage_members
- Invitation عمداً tenant-scoped نیست (endpoint پذیرش عمومی است؛ token خودِ اعتبار است) — فیلتر دستی، مستند در سرویس
- ضد دعوت تکراری: PENDING تکراری، عضو فعال بودن، پذیرش دوباره — همه تست شده

### شواهد گام سوم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: **۶۲۷/۶۲۷** (+۶ تست invitation)؛ domain: ۸۸/۸۸ |
| `pnpm test:e2e` | ۶۷/۶۷ |
| `pnpm audit:persistence:strict` | exit 0 |

## فاز P02 — گام چهارم: یکسان‌سازی enum نقش‌ها

- enum `MembershipRole` در schema حالا **دقیقاً نقش‌های ماتریس domain** است (SystemOwner تا IntegrationAccount)؛ مقادیر قدیمی (OWNER/ADMIN/...) فقط برای سازگاری در type باقی مانده‌اند و دیگر نوشته نمی‌شوند
- migration `20261028_membership_role_unification`: ALTER TYPE ADD VALUE ×۹ + **data migration** نگاشت ردیف‌های قدیمی (OWNER→SystemOwner و ...)
- جدول‌های نگاشت `PRISMA_ROLE_TO_DOMAIN` و `toPrismaRole` حذف شدند؛ نقش‌ها از DB به domain بدون ترجمه جریان دارند
- تصمیم امنیتی: نقش ناشناخته passthrough می‌شود تا ماتریس دسترسی آن را کامل رد کند (fail-closed)، نه سقوط صامت به Employee
- یافته جانبی (ثبت‌شده، خارج از scope این slice): `packages/domain/src/mizito.ts` با مقادیر 'ADMIN'/'OWNER' مقایسه می‌کند که نقش‌های domain نیستند — منطق KPI میزیتو برای بازبینی

### شواهد گام چهارم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: **۶۲۷/۶۲۷**؛ domain: ۸۸/۸۸ |
| `pnpm test:e2e` | ۶۷/۶۷ |
| `pnpm audit:persistence:strict` | exit 0 |

## فاز P02 — گام پنجم: مهاجرت مسیر قدیمی دعوت عضو

- `POST /organization/members/invite` در **DB-mode** به `InvitationService` delegate می‌شود (token یک‌بارمصرف به‌جای عضو فوری با userId جعلی — که در DB واقعی روی FK کاربر کرش می‌کرد)؛ در fixture mode رفتار قدیمی برای dev/E2E حفظ شده و E2E سبز ماند
- شاخه شرطی در کنترلر + spec اختصاصی دو حالته (delegation.spec)
- **بدهی UI مستند:** فرانت‌اند members هنوز وضعیت PENDING invitations را نمایش نمی‌دهد و `getMembers` در DB-mode از جدول Membership نمی‌خواند — گام بعدی P02
- یافته قبلی مizito.ts (مقایسه نقش‌های ناموجود) همچنان برای بازبینی باز است

### شواهد گام پنجم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: **۶۲۹/۶۲۹** (+۲ تست delegation)؛ domain: ۸۸/۸۸ |
| `pnpm test:e2e` | ۶۷/۶۷ |
| `pnpm audit:persistence:strict` | exit 0 |

## فاز P02 — گام ششم: دایرکتوری اعضای durable

- **`OrganizationDirectoryService`**: getMembers/updateMemberRole/revokeMember از جدول Membership (join User) در DB-mode؛ نقش‌ها unified هستند و مستقیم می‌نویسند
- گاردها: عضو غایب 404، عضو غیرفعال 403، تغییر نقش یا لغو SystemOwner 403؛ رویدادهای audit `MEMBER_ROLE_CHANGED` و `MEMBER_REVOKED` با previousRole
- کنترلر روی USE_DATABASE شاخه می‌زند (سه مسیر)؛ fixture mode برای dev/E2E دست‌نخورده
- بدهی UI همچنان باز: نمایش PENDING invitations در فرانت اعضا

### شواهد گام ششم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: **۶۳۳/۶۳۳** (+۴ تست directory)؛ domain: ۸۸/۸۸ |
| `pnpm test:e2e` | ۶۷/۶۷ |
| `pnpm audit:persistence:strict` | exit 0 |

## فاز P02 — گام هفتم: سخت‌گیری مجوزهای ضعیف (یافته‌های ممیزی RBAC)

- **saved-views** create/update/delete: `view_crm` → `edit_crm` (نوشتن داده tenant؛ Auditor و portal user به‌درستی قطع، Employee/SupportAgent طبق scope حفظ)
- **voip call-event**: `view_crm` → `edit_crm` (ثبت رویداد تماس = نوشتن؛ IntegrationAccount با explicit_scope حفظ شد)
- **منشن read و notifications read-all/preferences** عمداً در سطح view ماندند: self-service روی ردیف‌های خود کاربرند و اکشن اختصاصی در ماتریس وجود ندارد — rationale در کنترلرها مستند و به‌عنوان follow-up ماتریس ثبت شد
- E2E و تست‌های واحد پس از سخت‌گیری همه سبز ماندند (تأیید اینکه نقش‌های فعال جریان‌ها دسترسی صحیح دارند)

### شواهد گام هفتم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: ۶۳۳/۶۳۳؛ domain: ۸۸/۸۸ |
| `pnpm test:e2e` | ۶۷/۶۷ |
| `pnpm audit:persistence:strict` | exit 0 |
| `pnpm security:audit` | exit 0 |

## فاز P02 — گام هشتم: تنظیمات سازمان و تیم‌های durable

- ستون **`settings` (Json)** روی Organization (timezone/locale/branding/retentionPolicy) + ستون‌های `slug`/`description`/`leadMemberId` روی Team + migration نهم (`20261028_org_settings_team_fields`)
- **`OrganizationWorkspaceService`**: get/updateSettings با نگهداشت مقادیر پیش‌فرض (Asia/Tehran, fa-IR، retention 90/7)؛ هشت عملیات تیم (CRUD + add/remove member) روی Team/TeamMember واقعی؛ leadMemberName با join کاربر؛ audit برای همه تغییرات
- کنترلر روی USE_DATABASE برای ۸ مسیر شاخه می‌زند؛ fixture mode برای dev/E2E دست‌نخورده
- Teams فقط با userId کار می‌کند (TeamMember.userId) — memberIdهای legacy مسیر مهاجرت جدا دارند

### شواهد گام هشتم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: **۶۳۷/۶۳۷** (+۴ تست workspace)؛ domain: ۸۸/۸۸ |
| `pnpm test:e2e` | ۶۷/۶۷ |
| `pnpm audit:persistence:strict` | exit 0 |

## فاز P02 — گام نهم: اکشن self_service در ماتریس مجوزها

- اکشن **`self_service`** به ACTIONS و ماتریس برای هر ۹ نقش اضافه شد ('yes') — امن به‌دلیل طراحی: این مسیرها فقط ردیف‌های خود کاربر را تغییر می‌دهند و scope از token داخل سرویس می‌آید، نه ورودی
- مسیرهای `mentions :id/read`، `notifications read-all` و `preferences` از `view_internal_tasks` به `self_service` مهاجرت کردند؛ لیست canonical در `rbac-coverage.spec` به‌روز شد
- follow-up باقی: مسیرهای مشابه آینده (مثلاً ویرایش پروفایل) هم باید از این اکشن استفاده کنند

### شواهد گام نهم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: **۶۳۷/۶۳۷**؛ domain: ۸۸/۸۸ |
| `pnpm test:e2e` | ۶۷/۶۷ |
| `pnpm audit:persistence:strict` | exit 0 |

## فاز P02 — گام یازدهم: durability لیست سیاه session

- یافته امنیتی: `revokedTokens/revokedSessions/userRevocations` در TokenService همه Map حافظه بودند — با restart، توکن‌های logoutشده **دوباره معتبر** می‌شدند
- جدول **`RevokedCredential`** (key یکتا، kind=token/session/user، expiresAt برای purge) + migration یازدهم
- الگوی write-through + restore هنگام boot فقط در DB-mode (persist در fixture mode no-op تا رفتار dev/E2E عوض نشود)؛ خواندن‌ها sync و درون‌حافظه می‌مانند تا گارد سریع بماند — استقرار multi-instance به shared store در P13 موکول است
- provider توکن به useFactory با store شرطی تبدیل شد؛ spec رگرسیون DI هم `provide: SomeClass` (توکن کلاسی) را می‌پوشاند
- purge تنبلِ ورودی‌های منقضی در خواندن و purge کامل هنگام boot

### شواهد گام یازدهم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: **۶۴۹/۶۴۹** (+۳ تست persistence)؛ domain: ۸۸/۸۸ |
| `pnpm test:e2e` | ۶۷/۶۷ |
| `pnpm audit:persistence:strict` | exit 0 |

## فاز P02 — گام دوازدهم: حلقه UI دعوت‌نامه‌ها بسته شد

- قرارداد **`OrganizationInvitationDto`** به contracts اضافه شد (منبع واحد برای وب و API)
- `api-client`: `inviteOrganizationMember` حالا اتحاد `member | {invitation, token}` را برمی‌گرداند + دو متد `listOrganizationInvitations` و `revokeOrganizationInvitation`
- **AdminSettingsView**: پاسخ invitation تشخیص داده می‌شود و token یک‌بارمصرف با هشدار «دوباره نمایش داده نمی‌شود» به inviter نشان داده می‌شود؛ fixture mode مسیر member فوری قبلی را دارد و E2E دست‌نخورده ماند
- بدهی UI باقی: رندر فهرست دعوت‌نامه‌های PENDING در تب اعضا (endpoint آماده است) — کنار مهاجرت نهایی getMembers

### شواهد گام دوازدهم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ (وب شامل) |
| `pnpm test` | API: ۶۴۹/۶۴۹؛ domain: ۸۸/۸۸ |
| `pnpm test:e2e` | ۶۷/۶۷ |
| `pnpm audit:persistence:strict` | exit 0 |

## فاز P02 — گام سیزدهم: رندر دعوت‌نامه‌های PENDING در تب اعضا

- `AdminSettingsView`: بارگذاری موازی دعوت‌نامه‌ها + بخش «دعوت‌نامه‌های در انتظار پذیرش» با دکمه لغو (testidهای اختصاصی)
- بعد از هر دعوت DB-mode، فهرست PENDING بلافاصله به‌روز می‌شود؛ fixture mode فهرست خالی است و E2E دست‌نخورده
- `loadData` هر سه منبع را موازی می‌گیرد

### شواهد گام سیزدهم
| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | ۷/۷ |
| `pnpm test` | API: ۶۴۹/۶۴۹؛ domain: ۸۸/۸۸ |
| `pnpm test:e2e` | ۶۷/۶۷ |
| `pnpm audit:persistence:strict` | exit 0 |

## 16. Rollback۱۵. Rollback

- تمام تغییرات در فایل‌های مشخص است؛ `git checkout -- <files>` یا حذف ۳ فایل جدید + revert چهار فایل app.module/prisma.service/auth.guard کافی است.
- رفتار ریسک‌دارترین تغییر (گاردهای global) با حذف ۳ provider `APP_GUARD` در `app.module.ts` کامل برمی‌گردد.
