# پرامپت اجرای اصلاحات بعد از ممیزی ۲۶ اکتبر

تو Lead Engineer مخزن `ali39999-hue/crm-platform` هستی. هدف، تبدیل ادعاهای تکمیل backlog به شواهد قابل تکرار و بستن ریسک‌های production است، نه افزودن تعداد بیشتری صفحه نمایشی.

## قواعد الزامی
- قبل از تغییر، وضعیت فعلی شاخه و working tree را بخوان؛ فایل‌های موجود را overwrite کورکورانه نکن.
- secret یا credential واقعی را در prompt، fixture، log یا commit قرار نده.
- از push/deploy به production خودداری کن؛ فقط تغییرات محلی یا branch اختصاصی بساز.
- همه تغییرات باید تست مثبت و منفی و معیار پذیرش داشته باشند.
- demo/offline mode از production جدا باشد؛ production نباید با داده ساختگی شکست API را پنهان کند.
- وضعیت backlog را فقط بعد از اجرای تست‌های مربوط تغییر بده؛ عنوان commit یا وجود فایل معادل verified نیست.

## گام 1 — ارزیابی baseline
1. `pnpm install --frozen-lockfile`, `pnpm db:generate`, `pnpm typecheck`, `pnpm test`, `pnpm build` را اجرا و خروجی/commit را ثبت کن.
2. بررسی کن `pnpm test:e2e` و `pnpm security:audit` واقعاً اجرا می‌شوند یا نه؛ اگر نه، آن‌ها را به CI required checks اضافه کن.
3. گزارش کوتاه از مسیرهای تست‌شده، تعداد تست‌ها، تعداد fail، فایل‌های تغییرکرده و محدودیت‌های محیط ارائه کن.

## گام 2 — بستن P0 احراز هویت
1. در `AuthGuard` مسیر پذیرفتن `x-user-id` یا raw identity به‌عنوان credential را در production حذف کن.
2. اگر تست‌ها به این مسیر نیاز دارند، adapter/fixture مجزای test ایجاد کن؛ fallback فقط با env/feature flag صریح، پیش‌فرض خاموش، خارج از production فعال باشد.
3. `AuthService` را از کاربران seed شده و رمز `password123` در runtime عمومی جدا کن. seed فقط در fixture یا دستور dev واضح باشد. رمز production از DB/IdP و با hash امن اعتبارسنجی شود.
4. تست‌های درخواست با `x-user-id` تنها، email به‌عنوان Bearer، JWT جعلی، منقضی، revoke شده، org غیرعضو، user غیرفعال و نقش بدون permission را اضافه کن.
5. بررسی کن claim سازمان با membership معتبر مطابقت دارد؛ header دلخواه نباید context را به سازمان دیگر منتقل کند.

## گام 3 — persistence واقعی
1. providerهای `app.module.ts` را فهرست کن و تمام repositoryهای InMemory را مشخص کن.
2. در production، startup را در صورت فعال بودن هر InMemory repository fail-fast کن.
3. برای هر domain adapter Prisma اضافه یا تکمیل کن؛ ترجیحاً CRM, Support, Teams/Projects/Tasks, Activity/Audit, Notifications, Automation, Documents, Integrations/Webhooks, Jobs/Backup.
4. همه queryها، relationها، search، export، saved views و attachmentها را به organization scope محدود کن.
5. Integration tests را روی PostgreSQL واقعی CI اجرا کن؛ داده پس از restart باقی بماند؛ transaction، conflict، unique constraints، pagination و rollback تست شوند.

## گام 4 — اصلاح Frontend و مسیرها
1. هر target_path در `docs/enterprise-ux/ux/01-page-route-inventory.csv` را به یک route واقعی Next.js یا یک view-state که عمداً URL مستقل ندارد نگاشت کن.
2. هر صفحه هدف را با direct navigation، refresh، browser back/forward، roles، mobile viewport و RTL تست کن.
3. `apps/web/src/app/page.tsx` را به route/feature components تقسیم کن؛ ابتدا ساختار و تست حفظ شود، سپس بهبود بصری به‌صورت سیستماتیک انجام شود.
4. fallback arrays در `apps/web/src/lib/api-client.ts` فقط در demo mode فعال شوند. در production API error، failed write و offline state را صادقانه نمایش بده؛ موفقیت ساختگی نداشته باش.
5. Audit UI را از داده `INITIAL_AUDITS` جدا و به رویدادهای persist شده سرور متصل کن.
6. برای هر route حالت loading/empty/error/forbidden/validation/offline و معیار accessibility تعریف کن.

## گام 5 — CI و release gates
Required checks باید شامل format/lint، typecheck، unit، integration/PostgreSQL، security audit، E2E و build باشند. حداقل سناریوهای E2E: ورود کارکنان/مشتری، cross-org denial، CRUD Account/Deal/Task/Ticket، pipeline transition، audit event واقعی، تیم/پروژه، API-key permissions و offline sync.

## گام 6 — خروجی و اثبات
در انتها این موارد را تولید کن:
- لیست فایل‌های تغییرکرده با دلیل هر تغییر؛
- تست‌هایی که اجرا شدند و نتیجه دقیق؛
- تست‌هایی که به دلیل نبود سرویس/secret قابل اجرا نبودند؛
- mapping route inventory به تست یا کد واقعی؛
- backlog با وضعیت‌های `planned`, `implemented-unverified`, `verified-in-test`, `verified-in-staging`, `production-ready`؛
- ریسک‌های باقیمانده و تصمیم‌هایی که نیازمند دخالت انسانی‌اند.

**تعریف Done:** هیچ P0 باز نباشد؛ persistence و جداسازی سازمانی با تست integration تأیید شود؛ هیچ feature با fallback نمایشی در production موفق جلوه نکند؛ required CI شامل E2E/security/DB باشد؛ و شواهد تست برای هر task پیوند داده شده باشد. هرگز فقط به‌خاطر سبز بودن build یا شمارش فایل‌ها epic را 100٪ اعلام نکن.
