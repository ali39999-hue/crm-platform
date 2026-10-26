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

- Node.js نسخه Active LTS سازمان؛ این قالب برای Node 24 LTS طراحی شده است. قبل از شروع، وضعیت LTS را در [Node.js Release Schedule](https://github.com/nodejs/Release) کنترل کنید.
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

## وضعیت ماژول‌ها و پیاده‌سازی (ممیزی ۲۶ اکتبر ۲۰۲۶)

پلتفرم پس از عبور از فازهای پیاده‌سازی اولیه، دارای وضعیت تفکیک‌شده به شرح زیر است:

| حوزه و ماژول | وضعیت پیاده‌سازی | لایه ماندگاری (Persistence) | پوشش آزمون | وضعیت انتشار (Release) |
|---|---|---|---|---|
| **احراز هویت و مجوزها** | پیاده‌سازی‌شده با `TokenService`، چرخه JWT و لیست مسدودی | حافظه + Blacklist با TTL | ۳۳ تست واحد و E2E | **Gated:** مسیرهای `x-user-id` و رمزهای دمو در Production مسدود شده‌اند |
| **ایزولاسیون چندمستأجری** | پیاده‌سازی‌شده با اکستنشن `tenant-scoper` روی Prisma | PostgreSQL (Prisma Client) | ۱۰ تست منفی ایزولاسیون | آماده اعتبارسنجی استیجینگ |
| **مدیریت وظایف (Tasks)** | بردهای کانبان، نمای جدولی، تقویم هفتگی جلالی و قفل همروندی | دوگانه: Prisma (با `USE_DATABASE=true`) و InMemory | تست‌های واحد + E2E Playwright | تاییدشده در تست |
| **پروژه‌ها و مایل‌استون‌ها** | سبد پروژه‌ها، محاسبه پیشرفت فازها و پایش سلامت | `InMemoryProjectRepository` + ممیزی امنیتی | ۶ تست واحد + E2E Playwright | پیاده‌سازی‌شده (نیازمند اتصال DB دائم) |
| **مدیریت زمان کاری** | تایمر زنده، ثبت کارکرد و تفکیک ساعات قابل فاکتور | `InMemoryTimeTrackingRepository` + Audit | ۸ تست واحد + E2E Playwright | پیاده‌سازی‌شده |
| **هسته CRM و فروش** | حساب‌ها، مخاطبان، سرنخ‌ها، تبدیل اتمیک و پایپ‌لاین فروش | `InMemoryCrmRepository` + Audit + Outbox | ۹ تست جامع + E2E Playwright | پیاده‌سازی‌شده |
| **بردهای فروش و ادغام** | کانبان مراحل فروش با Drag-and-Drop و ادغام موارد تکراری | `PipelineStageRepository` + CRM Repos | تست‌های پایپ‌لاین + E2E | پیاده‌سازی‌شده |
| **فیلدهای سفارشی** | اسکیمای داینامیک ۶ موجودیت و اعتبارسنجی مقادیر سرور | `InMemoryCustomFieldRepository` | ۷ تست واحد + E2E Playwright | پیاده‌سازی‌شده |
| **پشتیبانی و تیکتینگ** | صف تیکت‌ها، SLA، تفکیک یادداشت داخلی و ماکروهای پاسخ | `InMemorySupportRepository` + Outbox | ۸ تست واحد + E2E Playwright | تفکیک امنیتی تاییدشده در تست |
| **پورتال مشتریان** | ورود با رمز و OTP، مشاهده تیکت‌های خود، مرکز راهنما و FAQ | روت‌های اختصاصی `/portal` و API کلاینت | ۳ تست E2E اختصاصی | ایزولاسیون مشتری تاییدشده در تست |
| **پایگاه دانش و اسناد** | فضاهای اسناد، دسترسی ۴گانه و کشوی تاریخچه نسخه‌ها | `InMemoryDocumentRepository` | ۱۱ تست واحد + E2E Playwright | پیاده‌سازی‌شده |
| **همکاری و منشن‌های تیمی** | صندوق منشن‌ها و ارجاعات همکاران با رهگیری وضعیت خوانده‌شده | `InMemoryMentionRepository` | ۵ تست واحد + E2E Playwright | پیاده‌سازی‌شده |
| **هوش تجاری و گزارش‌ساز** | کارت‌های KPI، پایپ‌لاین وزنی و خروجی اکسل/CSV | تجمیع دامنه‌ای در `ReportingService` | ۷ تست واحد + E2E Playwright | پیاده‌سازی‌شده |
| **اتوماسیون گردش‌کار** | قوانین خودکار، شبیه‌ساز Dry-run، تاریخچه اجرا و کلید قطع | `InMemoryAutomationRepository` | ۶ تست واحد + E2E Playwright | محافظت ضد لوپ تاییدشده در تست |
| **اتصالات و کلیدهای API** | کلیدهای دسترسی با هش SHA-256 و ارائه‌دهندگان متصل | `InMemoryApiKeyRepository` + ممیزی | ۷ تست واحد + E2E Playwright | محافظت نشت کلید تاییدشده در تست |
| **صفحات بازیابی سیستمی** | مسیرهای امن ۴۰۳، ۴۰۴، ۵۰۳ و ۴۱۰ بدون نشت اسرار | صفحات اختصاصی App Router در وب | تست‌های E2E امنیتی | آماده برای محیط استقرار |
| **کلاینت موبایل (Expo)** | کارهای من، تیکت‌ها، پروژه‌ها، اسناد و صف آفلاین ماندگار | صف آفلاین ماندگار محلی (Local Outbox) | بررسی انواع تایپ‌اسکریپت | تست‌شده در کلاینت موبایل |

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
