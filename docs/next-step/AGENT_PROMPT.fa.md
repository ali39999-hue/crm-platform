# پرامپت اجرای مرحله بعد CRM

تو مسئول اجرای مرحله بعد مخزن `https://github.com/ali39999-hue/crm-platform` هستی. این کار را با چرخه‌ی Release Train و تست‌محور انجام بده؛ تغییرات باید در branch مجزا انجام شوند و بدون تأیید انسانی روی production یا `main` منتشر نشوند.

## هدف این مرحله

ابتدا CI را تعمیر کن، سپس اولین vertical slice واقعی Task را از PostgreSQL تا وب و موبایل پیاده‌سازی کن. فعلاً قابلیت‌های نمایشی جدید، microservice، workflow builder یا AI مستقل نساز.

## قوانین اجباری

1. پیش از تغییر، وضعیت branch، آخرین commit، فایل‌های dirty و CI جاری را ثبت کن.
2. ابتدا `AGENTS.md`، `README.fa.md`، بخش‌های مرتبط `ROADMAP.fa.md`، `docs/01-architecture.fa.md`، `docs/06-security-threat-model.fa.md` و backlog را بخوان.
3. شکست فعلی CI با `Unable to locate executable file: pnpm` را از ریشه حل کن. `pnpm/action-setup` باید پیش از `actions/setup-node` دارای cache pnpm اجرا شود. از نسخه‌های معتبر جاری استفاده کن و lockfile را بدون دلیل تغییر نده.
4. اجرای واقعی `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, `pnpm build` را مستند کن. اگر تست شکست خورد، علت را اصلاح کن؛ تست را حذف یا موقتاً skip نکن.
5. از `InMemoryTaskRepository`، `InMemoryCrmRepository` و `InMemorySupportRepository` در runtime production استفاده نکن. برای Task ابتدا provider پایدار Prisma/PostgreSQL بساز و in-memory adapter را صرفاً برای unit test نگه دار.
6. در تمام queryها و mutationها organization scope را از identity/membership تأییدشده استخراج کن، نه از body دلخواه کاربر. تست‌های cross-organization منفی الزامی‌اند.
7. transition تسک باید server-side با state machine دامنه validate شود. برای هم‌زمانی از `version` یا مکانیزم compare-and-swap استفاده کن و audit را به عملیات مرتبط وصل کن.
8. وب‌سایت دارای `INITIAL_TASKS` و موبایل دارای `INITIAL_TASKS` و صف `string[]` نمایشی هستند. مسیر production را به API واقعی متصل کن؛ پیام «با سرور همگام شد» فقط پس از تأیید واقعی سرور مجاز است.
9. Sync آفلاین موبایل باید durable، دارای mutationId/idempotency، retry محدود، conflict handling و تست پس از restart باشد؛ اگر امکان تکمیل امن در این مرحله نیست، کنترل نمایشی را به‌وضوح demo برچسب بزن یا پنهان کن.
10. فایل‌های بزرگ `apps/web/src/app/page.tsx` و `apps/mobile/App.tsx` را با تغییرات کوچک و تست‌پذیر refactor کن. بازنویسی کل UI و تغییرات نامرتبط را با کار Backend مخلوط نکن.
11. به هر تغییر، تست مناسب اضافه کن. معیارهای دستی یا نتیجه‌ی تستی که اجرا نشده را «سبز» گزارش نکن.
12. Secretها را نساز یا commit نکن. migration مخرب بدون backup/rollback plan اجرا نکن.

## ترتیب اجرای کار

**PR-1: CI unblock** — فقط workflow و قفل نسخه‌های لازم. CI باید install/typecheck/test/build را اجرا کند.  
**PR-2: Persistence & Task API** — Prisma provider/repository، migration، task CRUD/transition، tenant scope و audit.  
**PR-3: Web integration** — API client typed، loading/error/empty state و E2E persistence.  
**PR-4: Mobile integration** — API client و سپس sync آفلاین واقعی؛ اگر offline scope بزرگ است آن را به PR مستقل جدا کن.

## گزارش پایانی موردنیاز

- commit/branch/PR هر تغییر؛
- لیست فایل‌های تغییرکرده و علت؛
- دستورات تست اجراشده و خروجی واقعی؛
- CI run link؛
- موارد باقی‌مانده و ریسک‌ها؛
- تأیید اینکه هیچ deploy یا push به production انجام نشده است.

Do not claim production readiness until tenant isolation, authentication, persistence, audit, backups, and E2E checks are demonstrated.
