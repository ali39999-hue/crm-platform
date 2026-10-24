# ممیزی مرحله بعد پروژه CRM

**مخزن:** https://github.com/ali39999-hue/crm-platform  
**شاخه بررسی‌شده:** `main`  
**تاریخ بررسی:** ۲۴ اکتبر ۲۰۲۶  
**نوع ممیزی:** بررسی ایستای فایل‌های عمومی مخزن و آخرین اجرای قابل مشاهده GitHub Actions؛ build محلی یا بررسی runtime از این محیط اجرا نشده است.

## نتیجه اجرایی

پروژه از مرحله «ایجاد ساختار و نمونه UI» عبور کرده، اما هنوز نباید به‌عنوان CRM قابل استفاده با داده واقعی تلقی شود. اقدام بعدی باید دو گام داشته باشد:

1. رفع خطای قطعی CI و ایجاد خط پایه‌ی قابل تکرار برای build، typecheck و test.
2. پیاده‌سازی یک مسیر end-to-end واقعی برای Task: دیتابیس → API → وب و موبایل → audit → تست‌های امنیتی tenant.

افزودن فیچرهای جدید به UI قبل از انجام این دو گام، ریسک ایجاد چند تجربه‌ی زیبا اما غیرمتصل به داده و منطق واقعی را دارد.

## شواهد و یافته‌ها

### P0 — اجرای CI پیش از بررسی کد شکست می‌خورد

آخرین اجرای قابل مشاهده: [GitHub Actions run #1](https://github.com/ali39999-hue/crm-platform/actions/runs/40080377817) در ۲۴ اکتبر ۲۰۲۶. اجرای حدود ۱۰ ثانیه‌ای خطای زیر را ثبت کرده است:

`Unable to locate executable file: pnpm`

در فایل [ci.yml](https://github.com/ali39999-hue/crm-platform/blob/main/.github/workflows/ci.yml)، `actions/setup-node` با `cache: pnpm` پیش از `pnpm/action-setup` اجرا می‌شود. راهنمای رسمی `setup-node` برای cache مربوط به pnpm، ابتدا راه‌اندازی pnpm و سپس setup-node را نشان می‌دهد. این ترتیب را اصلاح کنید؛ تا زمانی که CI سبز نشود، نتیجه‌ی typecheck/test/build اثبات نشده است.

### P1 — وب هنوز از داده‌های نمونه و state محلی استفاده می‌کند

در [apps/web/src/app/page.tsx](https://github.com/ali39999-hue/crm-platform/blob/main/apps/web/src/app/page.tsx)، داده‌ی `INITIAL_TASKS` تعریف شده و state با `useState(INITIAL_TASKS)` ساخته می‌شود. بررسی متنی فایل هیچ فراخوانی `fetch` برای اتصال به API پیدا نکرد. ایجاد/تغییر وضعیت فعلی در این صفحه باید نمونه UI تلقی شود، نه عملیات پایدار روی سرور.

### P1 — همگام‌سازی آفلاین موبایل نمایشی است، نه sync واقعی

در [apps/mobile/App.tsx](https://github.com/ali39999-hue/crm-platform/blob/main/apps/mobile/App.tsx):

- داده‌های `INITIAL_TASKS` به‌عنوان mock تعریف شده‌اند.
- وضعیت آفلاین با state درون حافظه‌ای نگهداری می‌شود.
- صف `pendingSyncMutations` فقط `string[]` توضیح عملیات است؛ payload کامل و شناسه idempotency ندارد.
- جست‌وجوی فایل برای `fetch` و `AsyncStorage` نتیجه‌ای نداشت.
- کنترل sync پس از روشن کردن وضعیت آنلاین، صف محلی را پاک و پیام موفقیت نمایش می‌دهد؛ تأیید واقعی از سرور در این مسیر دیده نشد.

تا پیش از ساخت sync واقعی، متن UI نباید وانمود کند تغییرات با سرور ثبت شده‌اند. قابلیت offline یا باید به‌عنوان demo صریحاً برچسب بخورد، یا تا پیاده‌سازی صف پایدار و تأیید سرور غیرفعال شود.

### P1 — Backend دارای مسیرهای دامنه است، اما repositoryهای اصلی in-memory هستند

در [apps/api/src/app.module.ts](https://github.com/ali39999-hue/crm-platform/blob/main/apps/api/src/app.module.ts)، ارائه‌دهنده‌های `InMemoryTaskRepository`، `InMemoryCrmRepository` و `InMemorySupportRepository` ثبت شده‌اند. فایل [apps/api/prisma/schema.prisma](https://github.com/ali39999-hue/crm-platform/blob/main/apps/api/prisma/schema.prisma) مدل‌های Organization و Task دارد، اما وجود schema به‌تنهایی به معنی استفاده واقعی API از دیتابیس نیست. در فهرست providers فعلی، Prisma service/provider قابل مشاهده نیست.

### P1 — تست محصول واقعی هنوز اثبات نشده

مخزن اسکریپت‌های سطح root برای `typecheck`، `test` و `build` دارد، اما اجرای CI پیش از رسیدن به آن‌ها متوقف شده است. همچنین `apps/mobile/package.json` اسکریپت typecheck دارد ولی اسکریپت test یا build مستقلی ندارد؛ بنابراین باید یک بررسی bundling موبایل و تست‌های مشخص موبایل به pipeline اضافه شود.

### P2 — فایل‌های اصلی UI بیش از حد متمرکز هستند

منطق و رابط اصلی وب در یک `page.tsx` بزرگ و اپ موبایل در یک `App.tsx` بزرگ متمرکز شده‌اند. این ساختار برای prototype قابل تحمل است اما اضافه‌کردن احراز هویت، API state، error/loading، routeها، فرم‌ها و تست‌های واحد را دشوار می‌کند. پس از سبز شدن خط پایه، UI را به routeها، featureها، componentها و data-access لایه‌بندی کنید؛ این بازآرایی را با تغییر هم‌زمان منطق بیزینس مخلوط نکنید.

## برنامه اجرای اولویت‌دار

### مرحله A — CI baseline

- [ ] جابه‌جایی `pnpm/action-setup` به قبل از `actions/setup-node`.
- [ ] ارتقای majorهای قدیمی workflow به نسخه‌های جاری و معتبر: checkout v7، setup-node v7 و pnpm/action-setup v6؛ پس از بررسی release notes و policy سازمان.
- [ ] اجرای `pnpm install --frozen-lockfile`، `pnpm typecheck`، `pnpm test` و `pnpm build` در CI.
- [ ] ثبت artifact یا logهای تشخیصی واضح برای مرحله‌ای که شکست خورده است.
- [ ] CI باید روی pull request و push به main اجرا شود؛ branch protection باید merge را برای CI قرمز مسدود کند.

### مرحله B — Task persistence vertical slice

- [ ] پیاده‌سازی Prisma client/provider سازگار با نسخه Prisma موجود در مخزن؛ schema را قبل از migration validate/generate کنید.
- [ ] تعریف repository interface و پیاده‌سازی Prisma برای Task؛ adapter in-memory فقط در تست باقی بماند.
- [ ] هر query را به `organizationId` مجاز مقید کنید؛ هرگز tenant id را صرفاً از body کاربر نپذیرید.
- [ ] پیاده‌سازی لیست، جزئیات، ایجاد، تغییر وضعیت، assignee، due date و pagination در API.
- [ ] transition وضعیت را سمت سرور از طریق domain state machine اعتبارسنجی کنید.
- [ ] از optimistic concurrency یا update شرطی بر اساس `version` استفاده کنید تا دو ویرایش هم‌زمان بی‌صدا روی هم نوشته نشوند.
- [ ] ثبت AuditEvent را در تراکنش مناسب انجام دهید و رفتار شکست/rollback را آزمایش کنید.
- [ ] تست منفی cross-organization برای GET، mutation، فایل و جست‌وجو اضافه کنید.

### مرحله C — وب متصل به API

- [ ] ایجاد لایه typed API client مبتنی بر قرارداد OpenAPI.
- [ ] حذف mockها از مسیر production؛ انتقال fixtureها به تست/story/demo.
- [ ] افزودن loading، empty، error، permission denied، retry و optimistic update با rollback.
- [ ] تست E2E: کاربر احراز هویت‌شده task می‌سازد، وضعیت را تغییر می‌دهد، reload می‌کند و داده از دیتابیس حفظ می‌شود.

### مرحله D — موبایل متصل به همان API

- [ ] حذف ادعای sync موفق تا دریافت پاسخ واقعی سرور.
- [ ] ساخت data-access/client مشترک با قراردادهای API؛ اعتبارنامه‌ها در secure storage پلتفرم ذخیره شوند.
- [ ] برای offline واقعی، صف mutation پایدار با `mutationId`، payload نسخه‌دار، زمان ایجاد، attempt count، وضعیت، خطا و سیاست retry طراحی شود.
- [ ] replay با idempotency سمت سرور، مدیریت conflict و رفتار پس از restart دستگاه تست شود.
- [ ] از Expo bundling / export و تست‌های موبایل در CI اطمینان حاصل شود.

### مرحله E — آماده‌سازی برای pilot داخلی

- [ ] تکمیل auth واقعی و session/token lifecycle؛ ردگیری و بررسی مجوزها در API.
- [ ] تست‌های نقش‌محور: employee، manager، org admin و customer portal.
- [ ] تکمیل audit، rate limit، secret hygiene، backup/restore drill و health/readiness checks.
- [ ] آماده‌سازی staging با دیتای synthetic و بدون اطلاعات مشتری واقعی.
- [ ] انتشار پایلوت فقط پس از CI سبز و تأیید دستی مالک محصول/امنیت.

## تعریف Done برای اولین مسیر واقعی

این کار زمانی تمام است که همه موارد زیر با شواهد قابل بازتولید برقرار باشند:

1. CI روی commit جدید سبز است و install از lockfile به‌صورت frozen موفق است.
2. ایجاد و تغییر Task در PostgreSQL ثبت می‌شود و پس از restart باقی می‌ماند.
3. کاربر سازمان A به taskهای سازمان B حتی با تغییر شناسه/URL دسترسی ندارد.
4. transition نامعتبر سمت server رد می‌شود و AuditEvent یا ایجاد نمی‌شود یا transaction طبق طراحی rollback می‌شود.
5. وب پاسخ API را نشان می‌دهد و پس از reload داده حفظ می‌شود.
6. موبایل عملیات آنلاین واقعی انجام می‌دهد؛ اگر offline فعال است، رفتار offline و sync با تست واقعی اثبات شده و پیام موفقیت تنها پس از پذیرش سرور نشان داده می‌شود.
7. حداقل تست‌های unit، integration، authorization و E2E برای این مسیر وجود دارند.

## پیوندهای بررسی‌شده

- [Repository](https://github.com/ali39999-hue/crm-platform)
- [Latest visible CI run](https://github.com/ali39999-hue/crm-platform/actions/runs/40080377817)
- [CI workflow](https://github.com/ali39999-hue/crm-platform/blob/main/.github/workflows/ci.yml)
- [API AppModule](https://github.com/ali39999-hue/crm-platform/blob/main/apps/api/src/app.module.ts)
- [Prisma schema](https://github.com/ali39999-hue/crm-platform/blob/main/apps/api/prisma/schema.prisma)
- [Web page](https://github.com/ali39999-hue/crm-platform/blob/main/apps/web/src/app/page.tsx)
- [Mobile app](https://github.com/ali39999-hue/crm-platform/blob/main/apps/mobile/App.tsx)
- [Official setup-node guidance](https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md)

## محدودیت ممیزی

این یک ممیزی ایستای فایل‌های عمومی و گزارش CI قابل مشاهده است. مخزن در این محیط clone نشده، تست‌ها locally اجرا نشده‌اند، و محیط staging/production یا اپ موبایل در دستگاه واقعی بررسی نشده است. بنابراین هیچ ادعایی مبنی بر «build سبز»، «sync واقعی»، یا «آمادگی production» وجود ندارد.
