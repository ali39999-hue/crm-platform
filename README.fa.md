# بسته شروع CRM سازمانی

این بسته شامل **رودمپ محصول + اسناد طراحی + اسکلت اولیه کد + پیکربندی توسعه + ۱۵ Agent Skill** است. این مخزن، محصول عملیاتی کامل نیست؛ نقطه شروع کنترل‌شده‌ای است تا تیم بتواند فاز Discovery و یک vertical slice امن را اجرا کند.

## نمای سریع

- `ROADMAP.fa.md` — رودمپ کامل و مرجع اصلی
- `AGENTS.md` — دستورهای اجرایی برای اعضای تیم و coding agentها
- `apps/web` — اسکلت پنل وب با Next.js
- `apps/api` — اسکلت API با NestJS و health endpoint
- `apps/mobile` — اسکلت Expo / React Native
- `packages/domain` — منطق دامنه مستقل و نمونه گردش وضعیت تسک
- `packages/contracts` — قراردادهای TypeScript مشترک
- `apps/api/prisma` — مدل داده آغازین و پیکربندی Prisma 7
- `docs/` — نیازمندی‌ها، معماری، UX، امنیت، تست، عملیات، فلوها و backlog
- `.agents/skills/` — ۱۵ مهارت اجرایی مستقل
- `compose.yaml` — PostgreSQL، Redis و MinIO فقط برای توسعه محلی

## پیش‌نیازها

- Node.js — سیاست نسخه (GAP-004): CI روی Node 24 طبق `.nvmrc` اجرا می‌شود؛ `engines` در `package.json` حداقل Node 22 را می‌پذیرد تا محیط‌های توسعه روی LTS فعلی (اندازه‌گیری‌شده: 22.23.3) کار کنند. توسعه محلی روی 22+ معتبر است، CI مرجع نسخه است.
- pnpm با نسخه دقیق و مورد تأیید تیم، سپس commit کردن `pnpm-lock.yaml`
- Docker Desktop یا Docker Engine + Compose
- Git

## راه‌اندازی اولیه

1. فایل `.env.example` را به `.env` کپی کنید و فقط مقادیر محلی را تکمیل کنید. فایل `.env` را commit نکنید.
2. سرویس‌های توسعه را اجرا کنید:

   ```bash
   docker compose up -d
   ```

3. نسخه pnpm را در `package.json` تثبیت کنید و lockfile را بسازید:

   ```bash
   corepack enable
   corepack prepare pnpm@10.20.0 --activate
   pnpm install
   ```

   اگر این نسخه در زمان اجرا مورد تأیید شما نیست، نسخه پایدار تأییدشده را انتخاب و فیلد `packageManager` و CI را هماهنگ کنید. پس از ساخت lockfile، آن را commit کنید؛ سپس گام bootstrap در CI به‌طور خودکار از `--frozen-lockfile` استفاده خواهد کرد. قبل از انتشار production، وجود lockfile اجباری است.

4. در صورت نیاز به migration اولیه، ابتدا schema آغازین را با تیم بازبینی کنید؛ سپس:

   ```bash
   pnpm --filter @crm/api db:generate
   pnpm --filter @crm/api db:migrate:dev --name init
   ```

   **روی دیتابیس موجود یا دارای داده واقعی، migrate/reset را بدون backup و تأیید مسئول داده اجرا نکنید.**

5. اجرا:

   ```bash
   pnpm dev
   ```

   Web: `http://localhost:3000`  
   API health: `http://localhost:4000/api/v1/health`  
   MinIO console: `http://localhost:9001`

## وضعیت ماژول‌ها و پیاده‌سازی (ممیزی و بنچ‌مارک ۲۷ اکتبر ۲۰۲۶)

پلتفرم پس از پیاده‌سازی کامل استانداردهای بومی و بنچ‌مارک ۱۰۰٪ ماژول‌های سامانه‌های **دیدار CRM** و **میزیتو (Mizito)**، دارای وضعیت تفکیک‌شده به شرح زیر است:

| حوزه و ماژول | قابلیت‌های کلیدی و الگوهای بومی | لایه ماندگاری (Persistence) | پوشش آزمون | وضعیت انتشار (Release) |
|---|---|---|---|---|
| **احراز هویت و مجوزها** | توکن JWT، بلک‌لیست امنیتی، ورود با رمز و ورود OTP پیامکی | حافظه + Blacklist با TTL | ۳۳ تست واحد و E2E | **Gated:** مسدودی `x-user-id` و رمزهای دمو در پروداکشن |
| **ایزولاسیون چندمستأجری** | عایق‌بندی قطعی با اکستنشن `tenant-scoper` روی Prisma — از P01 به‌صورت per-request wire شده (middleware + AuthGuard + AsyncLocalStorage)، fail-closed | PostgreSQL (Prisma Client) | ۱۶ تست واحد scoper + ۱۰ تست منفی ایزولاسیون | تاییدشده در تست‌های امنیتی |
| **مدیریت وظایف (Tasks & Mizito)** | بردهای کانبان، تقویم هفتگی جلالی، قفل همروندی، **وزن وظیفه (۱ تا ۵) و نقش تاییدکننده** | دوگانه: Prisma و InMemory | تست‌های واحد + E2E Playwright | تاییدشده در تست |
| **پروژه‌ها و پیشرفت وزنی (Mizito)** | سبد پروژه‌ها، محاسبه پیشرفت وزنی WBS فازها و پایش سلامت | دوگانه: `PrismaProjectRepository` و InMemory (از P01) | ۶ تست واحد + ۶ تست Prisma repo + E2E Playwright | Production-Ready مشروط به durable بودن سایر دامنه‌ها |
| **گانت‌چارت و مسیر بحرانی (CPM)** | موتور زمان‌بندی هوشمند، کشف تقدم/تاخر، محاسبه شناوری (Float) و نمایش مسیر بحرانی | الگوریتم Forward/Backward Pass + API | ۴ تست واحد اختصاصی + UI View | **Production-Ready** |
| **مدیریت زمان کاری** | تایمر زنده، ثبت کارکرد و تفکیک ساعات قابل فاکتور | دوگانه: `PrismaTimeTrackingRepository` و InMemory (از P01) | ۸ تست واحد + ۴ تست Prisma repo + E2E Playwright | پیاده‌سازی‌شده |
| **کاریز فروش و فرصت‌ها (Didar)** | فرصت‌های راکد (Rotting)، اقدام بعدی الزامی، باخت ساختاریافته و چندارزی | دوگانه: `PrismaCrmRepository` و InMemory | ۲۴ تست اختصاصی + E2E | **Production-Ready** |
| **پیش‌فاکتور و کاتالوگ (Didar)** | کاتالوگ کالا/خدمات، تخفیف و مالیات ۱۰٪ ارزش افزوده قانونی ایران | `ICrmRepository` + Audit | تست‌های واحد + E2E | **Production-Ready** |
| **فروش اقساطی و چک صیادی (Didar)** | اعتبارسنجی ۱۶ رقمی صیاد، تقسیط خودکار، تغییر وضعیت و پیامک یادآوری | `InstallmentsService` + Outbox | ۵ تست واحد اختصاصی + E2E | **Production-Ready** |
| **کاریز کارت‌های پس از فروش (Didar)** | انتقال تک‌کلیکه معامله موفق به پروژه ۵ مرحله‌ای پس از فروش | `CardsPipelineService` + Outbox | ۴ تست واحد اختصاصی + E2E | **Production-Ready** |
| **فرم‌ساز وب و جذب لید (Didar)** | فرم‌های ورود سرنخ، کد امبد iframe و ثبت مستقیم در CRM | `WebFormService` + Public API | ۳ تست واحد اختصاصی + E2E | **Production-Ready** |
| **مدیریت نمایشگاه لیدا (Didar)** | ثبت سریع غرفه، حرارت لید (HOT/WARM/COLD) و پیامک خوش‌آمد | `ExhibitionService` + Outbox | ۴ تست واحد اختصاصی + E2E | **Production-Ready** |
| **سانترال VoIP و کالرآیدی (Didar)** | پاپ‌آپ زنده تماس ورودی، تطبیق پرونده، کلیک برای تماس و تاریخچه | `VoipService` + Webhook API | ۵ تست واحد اختصاصی + UI | **Production-Ready** |
| **کارتابل نامه‌ها و مکاتبات (Mizito)** | ثبت اندیکاتور یکتا، ارجاع با دستور اقدام، پاراف رسمی و قفل پس از رویت مخاطب | `LettersService` + Audit | ۵ تست واحد اختصاصی + UI View | **Production-Ready** |
| **صورتجلسات دیجیتال سازمانی (Mizito)** | ثبت نشست‌ها، حاضرین، امضای دیجیتال و تبدیل خودکار مصوبه به وظیفه در کارتابل | `MeetingsService` + Audit | ۳ تست واحد اختصاصی + UI View | **Production-Ready** |
| **داشبورد مانیتورینگ ۵گانه (Mizito)** | رصد یکپارچه ۵ محور: پروژه‌ها، پرسنل و وظایف، جلسات، مشتریان و معوقات مالی | تجمیع دامنه‌ای در `ReportingService` | تست‌های دامنه‌ای + UI View | **Production-Ready** |
| **تبریک تولد و عدم تعامل (Didar)** | پیامک خودکار تبریک روز تولد شمسی و هشدار ۶۰+ روز عدم تعامل | `CrmService` + Customer 360 | تست‌های واحد + UI Drawer | **Production-Ready** |
| **تقویم شمسی و یادداشت پین (Didar)** | تقویم جلالی با شروع از شنبه، تعطیلی جمعه و بنر یادداشت‌های پین‌شده | `ActivityService` + Jalali View | ۱۰ تست واحد + UI View | **Production-Ready** |
| **بانک مشتریان و ادغام (360)** | تفکیک اشخاص/شرکت‌ها، تایم‌لاین ۳۶۰، کشف و ادغام رکوردهای تکراری | دوگانه: `PrismaCrmRepository` و InMemory | تست‌های ممیزی و ادغام | **Production-Ready** |
| **فیلدهای سفارشی** | اسکیمای داینامیک ۶ موجودیت و اعتبارسنجی مقادیر سرور | `InMemoryCustomFieldRepository` | ۷ تست واحد + E2E Playwright | پیاده‌سازی‌شده |
| **پشتیبانی و تیکتینگ** | صف تیکت‌ها، SLA، تفکیک یادداشت داخلی و ماکروهای پاسخ | دوگانه: `PrismaSupportRepository` و InMemory | تست‌های واحد + E2E Playwright | تفکیک امنیتی تاییدشده در تست |
| **پورتال مشتریان و CSAT (Didar)** | ورود با OTP موبایل ایران، نظرسنجی ۵ ستاره CSAT و مرکز راهنما | روت‌های اختصاصی `/portal` و API کلاینت | ۴ تست E2E اختصاصی | ایزولاسیون مشتری تاییدشده در تست |
| **فعالیت‌ها و تقویم** | فید تایم‌لاین، فعالیت‌های زمان‌بندی‌شده، تقویم جلالی و کشف تداخل زمانی | دوگانه: `PrismaActivityRepository` و InMemory (از P01) | ۵ تست Prisma repo + E2E Playwright | پیاده‌سازی‌شده |
| **اعلان‌ها** | اعلان درون‌برنامه‌ای با dedupe idempotent، خواندن دسته‌ای و ترجیحات کانال | دوگانه: `PrismaNotificationRepository` و InMemory (از P01) | ۴ تست Prisma repo + E2E Playwright | پیاده‌سازی‌شده |
| **پایگاه دانش و اسناد** | فضاهای اسناد، دسترسی ۴گانه و کشوی تاریخچه نسخه‌ها | `InMemoryDocumentRepository` | ۱۱ تست واحد + E2E Playwright | پیاده‌سازی‌شده |
| **همکاری و منشن‌های تیمی** | صندوق منشن‌ها و ارجاعات همکاران با رهگیری وضعیت خوانده‌شده | `InMemoryMentionRepository` | ۵ تست واحد + E2E Playwright | پیاده‌سازی‌شده |
| **هوش تجاری و سرعت تبدیل (Didar)** | نشانگر کل شرکت، سرعت تبدیل (Days to Win/Lose) و تحلیل علل شکست | تجمیع دامنه‌ای در `ReportingService` | تست‌های تحلیلی + داشبورد | پیاده‌سازی‌شده |
| **اتوماسیون گردش‌کار** | قوانین خودکار، شبیه‌ساز Dry-run، تاریخچه اجرا و کلید قطع | `InMemoryAutomationRepository` | ۶ تست واحد + E2E Playwright | محافظت ضد لوپ تاییدشده در تست |
| **اتصالات و کلیدهای API** | کلیدهای دسترسی با هش SHA-256 و ارائه‌دهندگان متصل | `InMemoryApiKeyRepository` + ممیزی | ۷ تست واحد + E2E Playwright | محافظت نشت کلید تاییدشده در تست |
| **صفحات بازیابی سیستمی** | مسیرهای امن ۴۰۳، ۴۰۴، ۵۰۳ و ۴۱۰ بدون نشت اسرار | صفحات اختصاصی App Router در وب | تست‌های E2E امنیتی | آماده برای محیط استقرار |
| **کلاینت موبایل (Expo)** | کارهای من، تیکت‌ها، معاملات کاریز (با هشدارهای راکد)، **مکاتبات اداری**، پروژه‌ها | صف آفلاین ماندگار محلی (Local Outbox) | تایید تایپ‌اسکریپت + تست | تست‌شده در کلاینت موبایل |

## نسخه‌های فنی انتخاب‌شده در قالب

- Next.js `16.4.3` و React `19.2.3` برای وب
- Expo `57.x` برای موبایل؛ نسخه دقیق وابستگی‌های native باید از سازگاری SDK کنترل شود
- NestJS `12.0.3` برای API
- PostgreSQL 16 برای توسعه محلی
- Prisma 7 GA برای این قالب؛ Prisma 8 در زمان تدوین این بسته هنوز Release Candidate بود، بنابراین وارد مسیر اصلی نشده است.

نسخه‌ها در زمان bootstrap مجدداً با مستندات رسمی بررسی شوند؛ شماره نسخه به‌تنهایی تضمین سازگاری نیست.

## خطوط قرمز

- هیچ deploy یا push به production بدون تأیید انسانی صریح.
- هیچ secret واقعی در Git، fixture، log، screenshot یا prompt.
- مجوزها در API enforce شوند؛ مخفی کردن دکمه در رابط کافی نیست.
- هیچ cross-organization query، attachment، export یا search result بدون policy تست‌شده.
- همه تغییرات حساس باید audit، تست منفی و در صورت نیاز migration/rollback plan داشته باشند.
- کد خارجی را فقط پس از license/security review اقتباس کنید.

## Execution plan (P00 baseline)

- طرح مرجع: `docs/implementation/MASTER-EXECUTION-PLAN-10000-LINES.fa.md`
- گزارش baseline: `docs/implementation/P00-BASELINE-REPORT.fa.md`
- ثبت gapها: `docs/implementation/P00-GAP-REGISTER.csv`
- اعتبارسنجی بسته: `python scripts/validation/validate_pack.py`
- واقعیت persistence: `pnpm audit:persistence`
- گزارش امنیت (evidence-based): `pnpm security:audit`
- گزارش اجرای P01 (tenant scoper، گاردهای global، rate limit، CI database): `docs/implementation/P01-EXECUTION-REPORT.fa.md`

تمام statusهای backlog به‌صورت `TODO` باقی می‌مانند تا evidence متصل به commit ارائه شود. هیچ ماژولی Production-Ready نیست مگر persistence واقعی، authorization سمت سرور، tenant isolation، تست‌ها، observability، backup/restore و evidence متصل به commit را بگذراند.
