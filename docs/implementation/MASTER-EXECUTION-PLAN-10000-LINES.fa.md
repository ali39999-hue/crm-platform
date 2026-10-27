# طرح مادر ۱۰٬۰۰۰ خطی اجرای CRM سازمانی در کلاس جهانی

> شناسه سند: `CRM-ENTERPRISE-EXECUTION-MASTER-10000`  
> نسخه سند: `1.0.0`  
> تاریخ تدوین: `2026-10-27`  
> مخزن هدف: https://github.com/ali39999-hue/crm-platform  
> زبان اصلی تیم: فارسی؛ شناسه‌های فنی و نام مسیرها به انگلیسی حفظ می‌شوند.  
> وضعیت: برنامه اجرایی و معیار پذیرش؛ این سند به‌معنی انجام‌شدن تسک‌ها نیست.  

## دستور حیاتی برای عامل اجرایی و تیم

این سند یک قرارداد اجرایی است؛ هر تسک فقط وقتی DONE می‌شود که کد، تست، داده، UX، امنیت و شواهد همان commit آن را تأیید کنند. افزودن نام فیچر، route placeholder، داده mock یا تستی که assertion ندارد، تکمیل محسوب نمی‌شود.

1. ابتدا repository جاری را clone و commit/branch واقعی را ثبت کنید؛ هیچ فایل یا feature را صرفاً از روی مستندات فرض نکنید.
2. قبل از شروع هر فاز، checklist ورودی، وابستگی‌ها، ریسک‌ها و معیار خروج همان فاز را بخوانید.
3. در هر PR یک vertical slice قابل اجرا بسازید؛ تغییرات UI، API، persistence، authorization و test باید یک موضوع واحد را پوشش دهند.
4. هر تسک دارای ID ثابت است؛ وضعیت و شواهد را در backlog CSV و Evidence Manifest ثبت کنید.
5. اگر کد با سند فرق دارد، ابتدا discrepancy را ثبت کنید؛ سند را برای پنهان کردن نقص کد تغییر ندهید.
6. هیچ push/deploy به production بدون approval انسانی صریح انجام نشود.
7. هر تستی که skipped، quarantined، flaky یا صرفاً mocked است باید دقیقاً برچسب بخورد و معیار Release Gate را دور نزند.
8. همه داده‌ها و fixtureها synthetic باشند؛ داده واقعی مشتری در تست، screenshot، prompt یا log استفاده نشود.
9. کد خارجی فقط پس از license/security/maintenance review اقتباس شود؛ طراحی رقبا برای مطالعه رفتار است، نه کپی ظاهر یا دارایی تجاری.
10. «کلاس جهانی» هدف کیفی است و با شعار سنجیده نمی‌شود؛ این سند آن را به رفتار قابل تست، SLO، امنیت، usability و پایداری تبدیل می‌کند.

## خلاصه وضعیت واقعی و اصل صداقت مستندات

README فعلی مخزن در ۲۷ اکتبر ۲۰۲۶، پروژه را قالب شروع کنترل‌شده معرفی می‌کند و مسیرهای اصلی را برمی‌شمارد. همان README در جدول وضعیت ماژول‌ها برای چند دامنه `InMemory...Repository` نشان می‌دهد ولی آن‌ها را Production-Ready یا تأییدشده می‌نامد. این تضاد یک مانع Release است: data in-memory بدون persistence پایدار معیار production readiness نیست.

صفحه عمومی مخزن ساختار monorepo مبتنی بر Next.js، NestJS، Expo و Prisma را معرفی می‌کند و پوشه‌های `apps`, `packages`, `docs`, `scripts` و `tests/e2e` را نمایش می‌دهد. مسیر دقیق هر فایل پیش از اجرای تسک باید از checkout واقعی تأیید شود.

آخرین وضعیت عمومی بررسی‌شده در این سند شامل commit `cc9564d` و اجرای CI شماره ۴۵ در ۲۷ اکتبر ۲۰۲۶ بود. این checkpoint یک baseline تاریخی برای این سند است، نه ادعای اینکه HEAD بعدی حتماً همان commit است؛ در شروع اجرا HEAD را مجدداً ثبت کنید.

## اهداف محصول

- یک CRM سازمانی با account/contact/lead/opportunity، timeline، task، workflow، reporting و customer portal واقعی.
- یک workspace عملیاتی با task/project/board/calendar/time tracking که جایگزین یک ابزار پراکنده مدیریت کار شود.
- یک محصول فارسی‌محور و بین‌المللی با RTL، Jalali/Gregorian، timezone، چندزبانه و تجربه موبایل مستقل.
- جداسازی چندمستأجری، authorization در server، audit قابل اتکا، backups قابل restore و امنیت مطابق risk-based standard.
- قابلیت توسعه به integration/API، custom fields، webhooks و automation بدون ایجاد coupling کنترل‌نشده.
- تجربه کاربری ساده، سریع و یکپارچه؛ کاربران باید بتوانند کارهای پرتکرار را با کمترین کلیک و بدون آموزش سنگین انجام دهند.

## چیزهایی که محصول قرار نیست با آن‌ها تکمیل‌شده تلقی شود

- screenshot زیبا بدون اتصال به API؛
- tab داخلی که به‌عنوان route مستقل شمرده شده باشد؛
- seed کاربر یا داده در حافظه به‌جای identity و persistence واقعی؛
- API endpoint بدون permission test؛
- E2E که فقط صفحه را باز کند و assertion تجاری نداشته باشد؛
- CI سبز که lint، test یا security scanner در آن هشدار را نادیده می‌گیرد؛
- KPI که فرمول، منبع داده، timezone و freshness مشخص ندارد؛
- کلمه Production-Ready در README بدون evidence manifest متصل به commit؛
- انباشت ویژگی‌ها قبل از حل consistency، security، database و operational readiness.

## تعریف نقش‌ها

- `PO`: مالک محصول؛ تأیید رفتار تجاری، scope و اولویت.
- `Design`: طراح محصول؛ UX research، interaction model، accessibility و design tokens.
- `FE`: مهندس وب/موبایل؛ route، components، forms، state، accessibility و client error handling.
- `BE`: مهندس API؛ domain service، validation، persistence، authorization و events.
- `DB`: مسئول مدل داده، migrations، index، query plan و data migration.
- `SEC`: مسئول threat model، security review، secret scanning و release risk.
- `QA`: مسئول test strategy، test data، contract/E2E، flake management و evidence.
- `SRE`: مسئول deployment، SLO، telemetry، backup/restore، incident response.
- `DOC`: مسئول docs, ADR, runbooks و evidence manifest.
- `Agent`: دستیار اجرایی محدود به branch/task و ملزم به report شواهد؛ اختیار deploy ندارد.

## قرارداد وضعیت تسک

- `TODO`: هنوز بررسی و شروع نشده است.
- `DISCOVERY`: نیازمند مشخص‌کردن رفتار یا تحقیق؛ نباید با تخمین قطعی توسعه شود.
- `READY`: scope، acceptance criteria، dependency و test plan مشخص است.
- `IN_PROGRESS`: owner و branch مشخص شده‌اند.
- `BLOCKED`: blocker دقیق، اثر و صاحب رفع ثبت شده است.
- `IN_REVIEW`: PR باز است و CI/evidence باید در دسترس باشد.
- `VERIFIED`: reviewer مستقل acceptance criteria را بررسی کرده است.
- `DONE`: تمام معیارهای DoD، gateها و evidence کامل‌اند.
- `DEFERRED`: دلیل و موعد بازبینی دارد؛ نباید به‌عنوان DONE گزارش شود.

## قواعد اولویت‌بندی

- `P0`: مانع امنیتی، integrity، data loss، cross-tenant leak یا release blocker.
- `P1`: جریان اصلی محصول، persistence، E2E، UX core یا reliability.
- `P2`: بهبود مهم برای سرعت، usability، reporting و integration.
- `P3`: nice-to-have، polish یا قابلیت‌های پس از product-market fit.
- تخمین‌ها در قالب `XS/S/M/L/XL` است؛ برای هر `XL` تسک باید به sliceهای کوچک‌تر شکسته شود.
- هیچ تسک P0 در backlog نباید به‌دلیل تعداد featureهای جدید عقب رانده شود.

## شاخص‌های موفقیت سطح محصول

- نرخ تکمیل موفق سه جریان حیاتی: lead-to-opportunity، task-to-done، ticket-to-resolution.
- نرخ خطای 5xx، latency p95/p99، نرخ شکست job، queue age و error budget.
- عدم رخداد cross-tenant؛ تمام تست‌های negative authorization باید سبز باشند.
- سهم مسیرهای حیاتی دارای E2E پایدار و contract test.
- تعداد عملیات کاربر برای ایجاد/تخصیص/پیگیری recordهای پرتکرار.
- نرخ استفاده از fallback/mock در Production باید صفر باشد.
- نرخ taskهای DONE بدون evidence باید صفر باشد.
- توانایی restore مطابق RPO/RTO تعریف‌شده و تمرین‌شده.
- میزان تکمیل WCAG 2.2 AA برای جریان‌های حیاتی، با ثبت استثناءها و برنامه رفع.

## نقشه فازها

### P00 — Discovery و baseline واقعی
- دامنه: ثبت شواهد commit جاری؛ baseline مسیرها؛ inventory repositoryها؛ تفکیک پیاده‌سازی از مستندات؛ تعیین مالک محصول و SLO.
- معیار خروج: خروجی این فاز هیچ فیچر جدیدی نیست؛ یک baseline امضاشده و قابل تکرار است.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P01 — قراردادها، build و کیفیت پایه
- دامنه: ثابت‌کردن نسخه runtime و package manager؛ typecheck؛ API contract؛ CI fail-closed؛ test database و evidence manifest.
- معیار خروج: معیار خروج: از main یک clone تازه می‌تواند نصب، migration، test و build را بدون secret واقعی اجرا کند.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P02 — امنیت، هویت و جداسازی tenant
- دامنه: هویت واقعی؛ session lifecycle؛ MFA/OTP با provider؛ RBAC؛ tenant context؛ authorization matrix؛ منفی‌تست cross-tenant.
- معیار خروج: معیار خروج: هیچ endpoint یا file/search/export بدون scope و policy قابل استفاده نیست.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P03 — Design System و route architecture
- دامنه: tokenها؛ layout؛ nav؛ responsive; route inventory؛ form/table/detail patterns؛ accessibility baseline.
- معیار خروج: معیار خروج: تمام مسیرهای P0 URL واقعی یا نوع view صریح دارند و تست deep-link می‌گذرانند.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P04 — CRM core: accounts, contacts, leads, opportunities
- دامنه: مدل canonical؛ dedup؛ timeline؛ pipeline؛ ownership؛ next action؛ search؛ import و audit.
- معیار خروج: معیار خروج: جریان lead → contact/account → opportunity از UI تا DB و گزارش کامل است.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P05 — Activity, quotes و عملیات فروش
- دامنه: فعالیت، تقویم، تماس، پیشنهاد فروش، محصول، قیمت، تخفیف، مالیات، چندارزی و conversion.
- معیار خروج: معیار خروج: محاسبات پولی با decimal و تست boundary تأیید شده‌اند.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P06 — Task, project, WBS و time tracking
- دامنه: task lifecycle؛ dependencies؛ weighted progress؛ sprint/kanban؛ timesheet؛ approvals و گزارش.
- معیار خروج: معیار خروج: تغییرات concurrent به lost update یا پیشرفت کاذب منجر نمی‌شوند.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P07 — Support و portal
- دامنه: ticket queues؛ SLA; internal notes؛ customer visibility؛ CSAT؛ help center؛ customer identity.
- معیار خروج: معیار خروج: تست دسترسی مشتری به پرونده و attachment دیگری باید fail شود.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P08 — Documents, letters, meetings و approvals
- دامنه: private file lifecycle؛ versioning؛ letter numbering؛ referral; meeting states؛ signature evidence؛ resolution-to-task.
- معیار خروج: معیار خروج: شماره یکتا، transition منطقی و audit برای تمام عملیات حساس وجود دارد.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P09 — Automation و notifications
- دامنه: workflow versioning؛ dry run؛ rate limits؛ outbox؛ retries؛ dedupe؛ kill switch؛ notification preferences.
- معیار خروج: معیار خروج: هیچ workflow معیوبی نمی‌تواند loop یا side-effect نامحدود ایجاد کند.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P10 — Search, reporting و audit
- دامنه: tenant-safe indexing؛ KPI dictionary؛ report permissions؛ immutable audit؛ retention و privacy workflow.
- معیار خروج: معیار خروج: KPI با داده مرجع تطبیق دارد و audit قابل export بدون نشت PII است.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P11 — Integrations و data operations
- دامنه: API keys؛ webhooks؛ import/export؛ SSRF protection؛ signatures؛ retry؛ job monitoring.
- معیار خروج: معیار خروج: کلید خام فقط یک بار نمایش داده می‌شود و replay/SSRF/oversized input تست شده است.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P12 — موبایل، offline، localization و accessibility
- دامنه: durable outbox؛ sync conflict resolution؛ RTL/Jalali؛ keyboard navigation؛ WCAG checks؛ responsive parity.
- معیار خروج: معیار خروج: offline فقط پس از server acknowledgement موفق اعلام می‌کند و تست‌ها روی device matrix می‌گذرند.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P13 — Observability و disaster recovery
- دامنه: structured logs؛ traces؛ metrics؛ SLOs؛ DLQ؛ backup restore drill؛ incident runbooks.
- معیار خروج: معیار خروج: خطای مهم از داشبورد کشف و داده از backup در هدف RPO/RTO بازیابی می‌شود.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P14 — Staging، hardening و controlled release
- دامنه: load test؛ threat model؛ release approval؛ migration rollback؛ canary؛ smoke tests؛ rollback drill.
- معیار خروج: معیار خروج: release artifact با SHA ثابت، evidence متصل و rollback تمرین‌شده دارد.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P15 — Pilot و پذیرش کسب‌وکار
- دامنه: پایلوت با داده ساختگی/مجاز؛ UAT؛ migration rehearsal؛ آموزش؛ support readiness؛ feedback.
- معیار خروج: معیار خروج: کاربران واقعی سناریوهای مهم را بدون workaround تکمیل می‌کنند.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P16 — Production launch
- دامنه: launch checklist؛ feature flags؛ tenant onboarding؛ alerting؛ on-call؛ rollback readiness؛ communication.
- معیار خروج: معیار خروج: تأیید انسانی، همه gateها سبز و rollback owner در دسترس است.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

### P17 — Post-launch maturity
- دامنه: داده‌های استفاده؛ support trend؛ performance budget؛ roadmap re-prioritization؛ quarterly security review.
- معیار خروج: معیار خروج: هر اصلاح بعدی بر اساس شواهد، impact و risk انجام می‌شود نه تعداد feature.
- مسئول نهایی: PO + Tech Lead؛ مسئول فنی هر زیرتسک در backlog تعیین می‌شود.
- گیت: فاز بعدی تا بسته‌شدن P0های فاز جاری آغاز نشود، مگر تصمیم مستند Risk Acceptance وجود داشته باشد.

## قاعده وابستگی و ترتیب اجرای فازها

ترتیب اجرای پیشنهادی یک DAG است، نه فهرست خطی کورکورانه. می‌توان کارهای مستقل را موازی کرد، اما امنیت، tenant context، persistence و test infrastructure پیش‌نیاز بسیاری از ماژول‌ها هستند.

- `P00` بعد از `baseline و owner assignment` آغاز می‌شود؛ خروجی قابل تحویل آن: Discovery و baseline واقعی / خروجی این فاز هیچ فیچر جدیدی نیست؛ یک baseline امضاشده و قابل تکرار است.
- `P01` بعد از `P00` آغاز می‌شود؛ خروجی قابل تحویل آن: قراردادها، build و کیفیت پایه / معیار خروج: از main یک clone تازه می‌تواند نصب، migration، test و build را بدون secret واقعی اجرا کند.
- `P02` بعد از `P00, P01` آغاز می‌شود؛ خروجی قابل تحویل آن: امنیت، هویت و جداسازی tenant / معیار خروج: هیچ endpoint یا file/search/export بدون scope و policy قابل استفاده نیست.
- `P03` بعد از `P01, P02` آغاز می‌شود؛ خروجی قابل تحویل آن: Design System و route architecture / معیار خروج: تمام مسیرهای P0 URL واقعی یا نوع view صریح دارند و تست deep-link می‌گذرانند.
- `P04` بعد از `P02, P03` آغاز می‌شود؛ خروجی قابل تحویل آن: CRM core: accounts, contacts, leads, opportunities / معیار خروج: جریان lead → contact/account → opportunity از UI تا DB و گزارش کامل است.
- `P05` بعد از `P03, P04` آغاز می‌شود؛ خروجی قابل تحویل آن: Activity, quotes و عملیات فروش / معیار خروج: محاسبات پولی با decimal و تست boundary تأیید شده‌اند.
- `P06` بعد از `P04, P05` آغاز می‌شود؛ خروجی قابل تحویل آن: Task, project, WBS و time tracking / معیار خروج: تغییرات concurrent به lost update یا پیشرفت کاذب منجر نمی‌شوند.
- `P07` بعد از `P05, P06` آغاز می‌شود؛ خروجی قابل تحویل آن: Support و portal / معیار خروج: تست دسترسی مشتری به پرونده و attachment دیگری باید fail شود.
- `P08` بعد از `P06, P07` آغاز می‌شود؛ خروجی قابل تحویل آن: Documents, letters, meetings و approvals / معیار خروج: شماره یکتا، transition منطقی و audit برای تمام عملیات حساس وجود دارد.
- `P09` بعد از `P07, P08` آغاز می‌شود؛ خروجی قابل تحویل آن: Automation و notifications / معیار خروج: هیچ workflow معیوبی نمی‌تواند loop یا side-effect نامحدود ایجاد کند.
- `P10` بعد از `P08, P09` آغاز می‌شود؛ خروجی قابل تحویل آن: Search, reporting و audit / معیار خروج: KPI با داده مرجع تطبیق دارد و audit قابل export بدون نشت PII است.
- `P11` بعد از `P09, P10` آغاز می‌شود؛ خروجی قابل تحویل آن: Integrations و data operations / معیار خروج: کلید خام فقط یک بار نمایش داده می‌شود و replay/SSRF/oversized input تست شده است.
- `P12` بعد از `P10, P11` آغاز می‌شود؛ خروجی قابل تحویل آن: موبایل، offline، localization و accessibility / معیار خروج: offline فقط پس از server acknowledgement موفق اعلام می‌کند و تست‌ها روی device matrix می‌گذرند.
- `P13` بعد از `P11, P12` آغاز می‌شود؛ خروجی قابل تحویل آن: Observability و disaster recovery / معیار خروج: خطای مهم از داشبورد کشف و داده از backup در هدف RPO/RTO بازیابی می‌شود.
- `P14` بعد از `P12, P13` آغاز می‌شود؛ خروجی قابل تحویل آن: Staging، hardening و controlled release / معیار خروج: release artifact با SHA ثابت، evidence متصل و rollback تمرین‌شده دارد.
- `P15` بعد از `P13, P14` آغاز می‌شود؛ خروجی قابل تحویل آن: Pilot و پذیرش کسب‌وکار / معیار خروج: کاربران واقعی سناریوهای مهم را بدون workaround تکمیل می‌کنند.
- `P16` بعد از `P14, P15` آغاز می‌شود؛ خروجی قابل تحویل آن: Production launch / معیار خروج: تأیید انسانی، همه gateها سبز و rollback owner در دسترس است.
- `P17` بعد از `P15, P16` آغاز می‌شود؛ خروجی قابل تحویل آن: Post-launch maturity / معیار خروج: هر اصلاح بعدی بر اساس شواهد، impact و risk انجام می‌شود نه تعداد feature.

## قرارداد استاندارد اجرای هر feature

هر feature باید به شکل vertical slice از route تا repository تحویل شود؛ هیچ لایه‌ای با TODO، fake success یا mock دائمی جایگزین نشود.
1. کشف رفتار موجود و ثبت تفاوت با سند.
2. تعریف model و invariant دامنه.
3. تعریف API schema و error contract.
4. تعریف permission matrix و threat model مختصر.
5. migration و repository پایدار.
6. service و transactional behavior.
7. UI states و interaction design.
8. unit + integration + contract + E2E tests.
9. telemetry و audit در عملیات حساس.
10. docs، rollback، evidence و review.

## کاتالوگ دامنه‌ها و مرز مسئولیت

### دامنه PLAT: هسته پلتفرم و Workspace
- هدف تجاری: ساخت مرزهای اصلی محصول و تجربه یکپارچه workspace
- موجودیت‌های اصلی: `Workspace, Organization, WorkspaceMembership`
- مسیر مرجع: `/app`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: هر درخواست باید workspace فعال را از نشست معتبر دریافت کند؛ شناسه tenant از ورودی قابل اعتماد گرفته نشود.
- ریسک غالب: نشت اطلاعات بین workspaceها و پیکربندی ناسازگار
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه AUTH: هویت، ورود و نشست
- هدف تجاری: احراز هویت واقعی با lifecycle نشست قابل ابطال
- موجودیت‌های اصلی: `User, Identity, Session, RefreshToken, MfaChallenge`
- مسیر مرجع: `/auth/login`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: روش‌های Demo، رمز ثابت و user-id تزریقی در Production ممنوع‌اند؛ token rotation و expiry باید قابل آزمون باشد.
- ریسک غالب: تصاحب حساب، نشست باقی‌مانده و افشای token
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه TEN: چندمستأجری و جداسازی سازمان
- هدف تجاری: تضمین سخت‌گیرانه جداسازی query، cache، files، events و exports
- موجودیت‌های اصلی: `Tenant, TenantMembership, TenantPolicy`
- مسیر مرجع: `/settings/organization`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: tenant context باید در مرز server تعیین و در همه repositoryها enforce شود.
- ریسک غالب: cross-tenant data access
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه RBAC: نقش‌ها، مجوزها و سیاست‌ها
- هدف تجاری: مجوزدهی server-side و قابل بازبینی بر اساس action و resource
- موجودیت‌های اصلی: `Role, Permission, RoleBinding, ResourcePolicy`
- مسیر مرجع: `/settings/roles`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: مخفی‌کردن دکمه در UI هیچ‌گاه جایگزین مجوز API نیست.
- ریسک غالب: ارتقای سطح دسترسی و IDOR
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه USER: کاربران، تیم‌ها و ساختار سازمانی
- هدف تجاری: مدیریت lifecycle کاربر، عضویت و جانشینی مسئولیت
- موجودیت‌های اصلی: `User, Team, Department, Membership, Invite`
- مسیر مرجع: `/settings/users`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: غیرفعال‌سازی کاربر نباید تاریخچه یا ownership را بی‌صدا حذف کند.
- ریسک غالب: دسترسی باقی‌مانده و از دست رفتن مالکیت
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه DS: Design System و کامپوننت‌های مشترک
- هدف تجاری: یکپارچگی واقعی همه صفحات وب و موبایل
- موجودیت‌های اصلی: `DesignToken, ComponentContract, PatternCatalog`
- مسیر مرجع: `/app`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: رنگ، spacing، typography و stateها از tokenهای مرجع استفاده کنند؛ استثناءها مستند شوند.
- ریسک غالب: تجربه ناسازگار، دسترس‌پذیری ضعیف و هزینه نگهداری
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه ROUTE: معماری Route و ناوبری
- هدف تجاری: URLهای مستقل، deep-link، refresh و history قابل اتکا
- موجودیت‌های اصلی: `RouteDefinition, NavigationItem, SavedView`
- مسیر مرجع: `/app`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: تب داخلی نباید در inventory به‌اشتباه route واقعی معرفی شود.
- ریسک غالب: لینک مستقیم خراب، back/forward ناسازگار و حالت غیرقابل اشتراک
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه ACCT: حساب‌های مشتری و سازمان‌های مشتری
- هدف تجاری: Customer 360 پایدار با مالک، ارتباطات و تاریخچه
- موجودیت‌های اصلی: `Account, AccountRelation, AccountAddress`
- مسیر مرجع: `/crm/accounts`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: ادغام مشتری duplicate باید preview و قابلیت audit/rollback داشته باشد.
- ریسک غالب: تکرار رکورد، اشتباه مالکیت و افشای پرونده
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه CONTACT: اشخاص و مخاطبان
- هدف تجاری: مدیریت شخص، سمت، کانال تماس و پیوند به حساب
- موجودیت‌های اصلی: `Contact, ContactChannel, ContactRole`
- مسیر مرجع: `/crm/contacts`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: PII باید حداقل‌سازی و دسترسی به فیلد حساس محدود شود.
- ریسک غالب: افشای اطلاعات شخصی و duplicate contact
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه LEAD: سرنخ‌ها و جذب لید
- هدف تجاری: ثبت، امتیازدهی، تخصیص و تبدیل سرنخ
- موجودیت‌های اصلی: `Lead, LeadSource, LeadScore, LeadConversion`
- مسیر مرجع: `/crm/leads`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: ثبت عمومی فرم باید rate-limit، ضداسپم و validation سمت سرور داشته باشد.
- ریسک غالب: spam، data poisoning و تخصیص اشتباه
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه DEAL: فرصت‌ها و کاریز فروش
- هدف تجاری: فروش قابل پیش‌بینی با مرحله، اقدام بعدی و دلیل باخت
- موجودیت‌های اصلی: `Opportunity, Pipeline, PipelineStage, LossReason`
- مسیر مرجع: `/crm/opportunities`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: انتقال stage باید مجاز، تاریخچه‌دار و متناسب با forecast تعریف شود.
- ریسک غالب: forecast نادرست، معامله رهاشده و تغییر وضعیت غیرمجاز
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه PRODUCT: کاتالوگ، قیمت، تخفیف و پیشنهاد فروش
- هدف تجاری: قیمت‌گذاری و proposal قابل بازبینی
- موجودیت‌های اصلی: `Product, PriceBook, Quote, QuoteLine, TaxRule`
- مسیر مرجع: `/crm/products`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: قیمت، واحد پول، tax، discount و rounding باید سروری و با decimal امن محاسبه شوند.
- ریسک غالب: مغایرت مالی، rounding و ویرایش تاریخی قیمت
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه ACT: فعالیت‌ها، تماس‌ها و تقویم
- هدف تجاری: تجمیع تماس، جلسه، یادآوری و follow-up
- موجودیت‌های اصلی: `Activity, Call, Reminder, CalendarEvent`
- مسیر مرجع: `/activities`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: timezone و تقویم شمسی/میلادی باید در مرز نمایش و ذخیره‌سازی روشن باشند.
- ریسک غالب: از دست رفتن follow-up و تفسیر اشتباه تاریخ
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه TASK: تسک‌ها، Kanban و وزن‌دهی
- هدف تجاری: مدیریت کار با وضعیت، اولویت، وزن و مسئول تأیید
- موجودیت‌های اصلی: `Task, TaskStatus, TaskDependency, TaskWatcher`
- مسیر مرجع: `/work/tasks`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: transition وضعیت و وزن مؤثر بر گزارش باید transaction-safe باشد.
- ریسک غالب: race condition، محاسبه پیشرفت نادرست و task گمشده
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه PROJ: پروژه‌ها، WBS و milestone
- هدف تجاری: برنامه‌ریزی پروژه و پیشرفت وزنی قابل اعتماد
- موجودیت‌های اصلی: `Project, ProjectPhase, Milestone, WorkPackage`
- مسیر مرجع: `/work/projects`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: درصد پیشرفت از task/phase وزن‌دار محاسبه شود، نه عدد نمایشی غیرقابل ردیابی.
- ریسک غالب: گزارش کاذب سلامت پروژه و از دست رفتن وابستگی
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه TIME: ثبت زمان و timesheet
- هدف تجاری: ردیابی زمان، تایمر و ساعات قابل فاکتور
- موجودیت‌های اصلی: `TimeEntry, TimerSession, BillingCategory, Approval`
- مسیر مرجع: `/work/time`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: هم‌پوشانی تایمر، توقف دوباره و ثبت تکراری باید idempotent و کنترل شود.
- ریسک غالب: کارکرد دوگانه، صورتحساب غلط و تقلب زمانی
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه SUP: مرکز پشتیبانی، Ticket و SLA
- هدف تجاری: مدیریت صف، SLA، macro، پیام و یادداشت داخلی
- موجودیت‌های اصلی: `Ticket, TicketMessage, SLA, Macro, Queue`
- مسیر مرجع: `/support/tickets`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: یادداشت داخلی هرگز به پورتال مشتری یا ایمیل خروجی نشت نکند.
- ریسک غالب: افشای یادداشت داخلی و SLA نقض‌شده
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه PORTAL: پورتال مشتری و CSAT
- هدف تجاری: دسترسی مشتری به پرونده خودش با تجربه self-service
- موجودیت‌های اصلی: `PortalUser, PortalSession, CustomerRequest, CSATResponse`
- مسیر مرجع: `/portal`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: شناسه مشتری از ورودی نباید اعتماد شود؛ scope بر اساس هویت و رابطه تأییدشده اعمال شود.
- ریسک غالب: IDOR، نشت tenant و دسترسی به فایل مشتری دیگر
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه CUSTOM: فیلدهای سفارشی و فرم‌ساز
- هدف تجاری: قابلیت توسعه بدون شکستن مدل دامنه
- موجودیت‌های اصلی: `CustomFieldDefinition, CustomFieldValue, FormDefinition`
- مسیر مرجع: `/settings/custom-fields`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: تعریف فیلد و مقدار آن باید versioned، validated و در permission policy لحاظ شود.
- ریسک غالب: نوع داده نامعتبر، query injection و migration دردناک
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه DOC: اسناد، فایل‌ها و نسخه‌بندی
- هدف تجاری: ذخیره و اشتراک فایل با policy و version history
- موجودیت‌های اصلی: `Document, Attachment, DocumentVersion, Folder`
- مسیر مرجع: `/documents`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: فایل‌ها private by default، اسکن‌شده و از طریق signed URL محدود دریافت شوند.
- ریسک غالب: public bucket، malware و افشای فایل
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه LETTER: نامه‌ها و مکاتبات اداری
- هدف تجاری: ثبت اندیکاتور، ارجاع، پاراف و بایگانی رسمی
- موجودیت‌های اصلی: `OfficialLetter, LetterSequence, Referral, Annotation`
- مسیر مرجع: `/office/letters`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: شماره یکتا باید transactional باشد و متن نهایی و تغییرات دارای history شوند.
- ریسک غالب: شماره تکراری، دستکاری نامه و افشای مکاتبه
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه MEET: جلسات، حاضرین و مصوبه
- هدف تجاری: مدیریت چرخه جلسه و تبدیل مصوبه به وظیفه
- موجودیت‌های اصلی: `Meeting, Attendee, Resolution, SignatureRecord`
- مسیر مرجع: `/office/meetings`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: جلسه scheduled نباید پیش از تحقق شرایط به completed/signed برود.
- ریسک غالب: امضای نامعتبر و مصوبه بدون مالک
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه AUTO: اتوماسیون و گردش‌کار
- هدف تجاری: اجرای قابل مشاهده، idempotent و قابل توقف قوانین
- موجودیت‌های اصلی: `WorkflowDefinition, WorkflowRun, WorkflowStep, RuleVersion`
- مسیر مرجع: `/automation/workflows`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: dry-run، loop protection، per-tenant quota و fail-safe kill switch اجباری است.
- ریسک غالب: loop، side-effect تکراری و اجرای cross-tenant
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه NOTIF: اعلان‌ها و ترجیحات ارتباطی
- هدف تجاری: اعلان قابل ردیابی و قابل کنترل از چند کانال
- موجودیت‌های اصلی: `Notification, NotificationPreference, DeliveryAttempt`
- مسیر مرجع: `/inbox/notifications`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: تحویل بیرونی از transactional outbox و retry policy استفاده کند.
- ریسک غالب: اعلان تکراری، PII leak و spam
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه SEARCH: جست‌وجوی سراسری و saved views
- هدف تجاری: جست‌وجوی سریع اما policy-aware روی تمام دامنه‌ها
- موجودیت‌های اصلی: `SearchDocument, SearchIndexJob, SavedView`
- مسیر مرجع: `/search`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: index query باید tenant و authorization filter را حفظ کند.
- ریسک غالب: افشای snippetهای غیرمجاز و نتایج stale
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه REPORT: گزارش‌ها، KPI و داشبورد
- هدف تجاری: شاخص قابل تعریف، قابل ردیابی و مطابق واقعیت مالی/عملیاتی
- موجودیت‌های اصلی: `ReportDefinition, ReportRun, KPIValue, DashboardWidget`
- مسیر مرجع: `/reports`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: هر KPI باید فرمول، timezone، cohort، freshness و data owner داشته باشد.
- ریسک غالب: metric drift و تصمیم‌گیری با داده نادرست
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه AUDIT: Audit log، compliance و حریم خصوصی
- هدف تجاری: ردپای تغییرات، نگهداری داده و پاسخگویی به رخداد
- موجودیت‌های اصلی: `AuditEvent, RetentionPolicy, DataSubjectRequest`
- مسیر مرجع: `/settings/audit-log`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: audit event append-only باشد و secret/PII اضافی ذخیره نکند.
- ریسک غالب: ردپای ناقص، tampering و نقض حریم خصوصی
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه INTEG: API، webhooks و integrations
- هدف تجاری: اتصال امن به سیستم‌های خارجی و retry قابل مشاهده
- موجودیت‌های اصلی: `IntegrationConnection, ApiCredential, WebhookEndpoint, Delivery`
- مسیر مرجع: `/settings/integrations`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: SSRF protection، signature verification، allowlist egress و replay protection اجباری است.
- ریسک غالب: SSRF، webhook spoofing و credential leakage
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه IMPORT: Import، export و bulk operations
- هدف تجاری: جابه‌جایی داده امن، قابل preview و برگشت‌پذیر
- موجودیت‌های اصلی: `ImportJob, ExportJob, MappingProfile, ValidationIssue`
- مسیر مرجع: `/settings/data-tools`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: export و import باید permission scope، audit، idempotency و محدودیت حجم داشته باشند.
- ریسک غالب: نشت انبوه داده و خراب‌شدن رکوردها
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه MOBILE: موبایل، آفلاین و sync
- هدف تجاری: عملیات امن موبایل در شبکه ناپایدار
- موجودیت‌های اصلی: `OfflineMutation, SyncCursor, ConflictRecord, DeviceSession`
- مسیر مرجع: `/mobile`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: موفقیت sync فقط پس از ack سرور اعلام شود؛ queue باید durable، idempotent و conflict-aware باشد.
- ریسک غالب: گم‌شدن mutation، duplicate write و token leak
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه I18N: فارسی، RTL، Jalali و localization
- هدف تجاری: تجربه بومی فارسی/RTL بدون خراب‌شدن localeهای دیگر
- موجودیت‌های اصلی: `LocaleProfile, TimeZonePreference, CalendarAdapter`
- مسیر مرجع: `/settings/preferences`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: timestamp در سرور به شکل استاندارد و timezone-aware ذخیره شود؛ تقویم فقط در presentation تبدیل شود.
- ریسک غالب: خطای تاریخ، چیدمان RTL و format اشتباه پول
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه OBS: Observability، jobs و resilience
- هدف تجاری: قابل تشخیص بودن خطا و پیشگیری از silent failure
- موجودیت‌های اصلی: `BackgroundJob, JobAttempt, DeadLetter, SLO`
- مسیر مرجع: `/admin/health`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: هر job باید correlation ID، retry limit، DLQ و owner داشته باشد.
- ریسک غالب: خطای خاموش، retry storm و نبود forensic evidence
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه BACKUP: Backup، restore و disaster recovery
- هدف تجاری: بازیابی قابل تمرین و قابل اندازه‌گیری
- موجودیت‌های اصلی: `BackupSnapshot, RestoreRun, RetentionSchedule`
- مسیر مرجع: `/admin/backups`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: وجود backup بدون restore drill و کنترل integrity معیار قبولی نیست.
- ریسک غالب: از دست رفتن داده و backup غیرقابل بازیابی
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه BILL: اشتراک و محدودیت‌های پلن سازمانی
- هدف تجاری: کنترل قابلیت‌های SaaS بدون شکستن داده موجود
- موجودیت‌های اصلی: `Plan, Subscription, Entitlement, UsageCounter`
- مسیر مرجع: `/settings/billing`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: feature entitlement فقط در server enforce شود و پایان اشتراک موجب حذف ناگهانی داده نشود.
- ریسک غالب: دسترسی فراتر از پلن و قفل‌شدن مشتری
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه API: قراردادهای API و نسخه‌بندی
- هدف تجاری: ثبات قرارداد میان Web، Mobile و API
- موجودیت‌های اصلی: `OpenApiSpec, ApiVersion, ErrorEnvelope`
- مسیر مرجع: `/api/v1`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: شکست قرارداد باید با OpenAPI/type tests تشخیص داده شود؛ breaking change نسخه‌دار باشد.
- ریسک غالب: ناسازگاری کلاینت‌ها و تغییر خاموش قرارداد
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه QA: Quality Engineering و E2E
- هدف تجاری: تبدیل ادعاهای تکمیل به شواهد بازتولیدپذیر
- موجودیت‌های اصلی: `TestRun, EvidenceManifest, ReleaseGate`
- مسیر مرجع: `/quality`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: تست flaky نباید با retry نامحدود سبز شود؛ test data از tenant مجزا استفاده کند.
- ریسک غالب: false green، regression و پوشش ناقص
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

### دامنه DEPLOY: CI/CD، staging و release governance
- هدف تجاری: انتشار immutable، قابل rollback و دارای تأیید انسانی
- موجودیت‌های اصلی: `ReleaseArtifact, Deployment, ApprovalRecord`
- مسیر مرجع: `/admin/releases`؛ فهرست کامل مسیرهای پیشنهادی در بخش Route Inventory آمده است.
- قاعده دامنه: تولید build و push/deploy production از هم جدا باشد و deploy نیازمند approval صریح باشد.
- ریسک غالب: انتشار ناخواسته و rollback ناممکن
- مالک محصول: PO دامنه؛ مالک فنی: tech lead تخصیص‌یافته در backlog.
- معیار readiness: schema + persistence + API + permission + UI + tests + audit/evidence همگی باید ثبت شده باشند.

## بک‌لاگ اصلی: تسک‌های کوچک، فازبه‌فاز

این مجموعه، ۱۲ تسک برای هر دامنه تعریف می‌کند. این تسک‌ها باید به issue/PR تبدیل شوند؛ وضعیت آن‌ها در این سند از پیش DONE نیست.
قاعده: پیش از شروع، slug دامنه و نام module در checkout واقعی تأیید شود؛ اگر مسیر فایل متفاوت است، فایل فعلی را بی‌صدا بازنویسی نکنید و mapping را ثبت کنید.

### CRM-PLAT-01 — هسته پلتفرم و Workspace: کشف invariants و رفتار موجود
- فاز: `P01`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ساخت مرزهای اصلی محصول و تجربه یکپارچه workspace؛ شیء هدف این تسک `Workspace و سازمان` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر درخواست باید workspace فعال را از نشست معتبر دریافت کند؛ شناسه tenant از ورودی قابل اعتماد گرفته نشود.
- قرارداد داده/API: موجودیت‌های `Workspace, Organization, WorkspaceMembership` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت اطلاعات بین workspaceها و پیکربندی ناسازگار` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PLAT-02 — هسته پلتفرم و Workspace: مدل دامنه و schema
- فاز: `P01`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ساخت مرزهای اصلی محصول و تجربه یکپارچه workspace؛ شیء هدف این تسک `Workspace و سازمان` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر درخواست باید workspace فعال را از نشست معتبر دریافت کند؛ شناسه tenant از ورودی قابل اعتماد گرفته نشود.
- قرارداد داده/API: موجودیت‌های `Workspace, Organization, WorkspaceMembership` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت اطلاعات بین workspaceها و پیکربندی ناسازگار` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PLAT-03 — هسته پلتفرم و Workspace: migration و rollback
- فاز: `P01`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ساخت مرزهای اصلی محصول و تجربه یکپارچه workspace؛ شیء هدف این تسک `Workspace و سازمان` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر درخواست باید workspace فعال را از نشست معتبر دریافت کند؛ شناسه tenant از ورودی قابل اعتماد گرفته نشود.
- قرارداد داده/API: موجودیت‌های `Workspace, Organization, WorkspaceMembership` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت اطلاعات بین workspaceها و پیکربندی ناسازگار` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PLAT-04 — هسته پلتفرم و Workspace: repository contract
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ساخت مرزهای اصلی محصول و تجربه یکپارچه workspace؛ شیء هدف این تسک `Workspace و سازمان` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر درخواست باید workspace فعال را از نشست معتبر دریافت کند؛ شناسه tenant از ورودی قابل اعتماد گرفته نشود.
- قرارداد داده/API: موجودیت‌های `Workspace, Organization, WorkspaceMembership` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت اطلاعات بین workspaceها و پیکربندی ناسازگار` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PLAT-05 — هسته پلتفرم و Workspace: repository پایدار
- فاز: `P01`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ساخت مرزهای اصلی محصول و تجربه یکپارچه workspace؛ شیء هدف این تسک `Workspace و سازمان` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر درخواست باید workspace فعال را از نشست معتبر دریافت کند؛ شناسه tenant از ورودی قابل اعتماد گرفته نشود.
- قرارداد داده/API: موجودیت‌های `Workspace, Organization, WorkspaceMembership` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت اطلاعات بین workspaceها و پیکربندی ناسازگار` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PLAT-06 — هسته پلتفرم و Workspace: service/use-case
- فاز: `P01`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ساخت مرزهای اصلی محصول و تجربه یکپارچه workspace؛ شیء هدف این تسک `Workspace و سازمان` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر درخواست باید workspace فعال را از نشست معتبر دریافت کند؛ شناسه tenant از ورودی قابل اعتماد گرفته نشود.
- قرارداد داده/API: موجودیت‌های `Workspace, Organization, WorkspaceMembership` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت اطلاعات بین workspaceها و پیکربندی ناسازگار` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PLAT-07 — هسته پلتفرم و Workspace: API خواندن، فهرست و فیلتر
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ساخت مرزهای اصلی محصول و تجربه یکپارچه workspace؛ شیء هدف این تسک `Workspace و سازمان` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر درخواست باید workspace فعال را از نشست معتبر دریافت کند؛ شناسه tenant از ورودی قابل اعتماد گرفته نشود.
- قرارداد داده/API: موجودیت‌های `Workspace, Organization, WorkspaceMembership` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت اطلاعات بین workspaceها و پیکربندی ناسازگار` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PLAT-08 — هسته پلتفرم و Workspace: API ایجاد، تغییر و transition
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ساخت مرزهای اصلی محصول و تجربه یکپارچه workspace؛ شیء هدف این تسک `Workspace و سازمان` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر درخواست باید workspace فعال را از نشست معتبر دریافت کند؛ شناسه tenant از ورودی قابل اعتماد گرفته نشود.
- قرارداد داده/API: موجودیت‌های `Workspace, Organization, WorkspaceMembership` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت اطلاعات بین workspaceها و پیکربندی ناسازگار` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PLAT-09 — هسته پلتفرم و Workspace: concurrency و idempotency
- فاز: `P01`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ساخت مرزهای اصلی محصول و تجربه یکپارچه workspace؛ شیء هدف این تسک `Workspace و سازمان` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر درخواست باید workspace فعال را از نشست معتبر دریافت کند؛ شناسه tenant از ورودی قابل اعتماد گرفته نشود.
- قرارداد داده/API: موجودیت‌های `Workspace, Organization, WorkspaceMembership` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت اطلاعات بین workspaceها و پیکربندی ناسازگار` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PLAT-10 — هسته پلتفرم و Workspace: authorization و tenant scope
- فاز: `P01`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ساخت مرزهای اصلی محصول و تجربه یکپارچه workspace؛ شیء هدف این تسک `Workspace و سازمان` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر درخواست باید workspace فعال را از نشست معتبر دریافت کند؛ شناسه tenant از ورودی قابل اعتماد گرفته نشود.
- قرارداد داده/API: موجودیت‌های `Workspace, Organization, WorkspaceMembership` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت اطلاعات بین workspaceها و پیکربندی ناسازگار` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PLAT-11 — هسته پلتفرم و Workspace: vertical slice رابط کاربری
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ساخت مرزهای اصلی محصول و تجربه یکپارچه workspace؛ شیء هدف این تسک `Workspace و سازمان` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر درخواست باید workspace فعال را از نشست معتبر دریافت کند؛ شناسه tenant از ورودی قابل اعتماد گرفته نشود.
- قرارداد داده/API: موجودیت‌های `Workspace, Organization, WorkspaceMembership` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت اطلاعات بین workspaceها و پیکربندی ناسازگار` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PLAT-12 — هسته پلتفرم و Workspace: تست جامع و evidence
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ساخت مرزهای اصلی محصول و تجربه یکپارچه workspace؛ شیء هدف این تسک `Workspace و سازمان` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر درخواست باید workspace فعال را از نشست معتبر دریافت کند؛ شناسه tenant از ورودی قابل اعتماد گرفته نشود.
- قرارداد داده/API: موجودیت‌های `Workspace, Organization, WorkspaceMembership` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت اطلاعات بین workspaceها و پیکربندی ناسازگار` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTH-01 — هویت، ورود و نشست: کشف invariants و رفتار موجود
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: احراز هویت واقعی با lifecycle نشست قابل ابطال؛ شیء هدف این تسک `User و Session` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: روش‌های Demo، رمز ثابت و user-id تزریقی در Production ممنوع‌اند؛ token rotation و expiry باید قابل آزمون باشد.
- قرارداد داده/API: موجودیت‌های `User, Identity, Session, RefreshToken, MfaChallenge` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/auth/login` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تصاحب حساب، نشست باقی‌مانده و افشای token` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTH-02 — هویت، ورود و نشست: مدل دامنه و schema
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: احراز هویت واقعی با lifecycle نشست قابل ابطال؛ شیء هدف این تسک `User و Session` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: روش‌های Demo، رمز ثابت و user-id تزریقی در Production ممنوع‌اند؛ token rotation و expiry باید قابل آزمون باشد.
- قرارداد داده/API: موجودیت‌های `User, Identity, Session, RefreshToken, MfaChallenge` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/auth/login` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تصاحب حساب، نشست باقی‌مانده و افشای token` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTH-03 — هویت، ورود و نشست: migration و rollback
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: احراز هویت واقعی با lifecycle نشست قابل ابطال؛ شیء هدف این تسک `User و Session` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: روش‌های Demo، رمز ثابت و user-id تزریقی در Production ممنوع‌اند؛ token rotation و expiry باید قابل آزمون باشد.
- قرارداد داده/API: موجودیت‌های `User, Identity, Session, RefreshToken, MfaChallenge` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/auth/login` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تصاحب حساب، نشست باقی‌مانده و افشای token` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTH-04 — هویت، ورود و نشست: repository contract
- فاز: `P02`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: احراز هویت واقعی با lifecycle نشست قابل ابطال؛ شیء هدف این تسک `User و Session` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: روش‌های Demo، رمز ثابت و user-id تزریقی در Production ممنوع‌اند؛ token rotation و expiry باید قابل آزمون باشد.
- قرارداد داده/API: موجودیت‌های `User, Identity, Session, RefreshToken, MfaChallenge` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/auth/login` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تصاحب حساب، نشست باقی‌مانده و افشای token` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTH-05 — هویت، ورود و نشست: repository پایدار
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: احراز هویت واقعی با lifecycle نشست قابل ابطال؛ شیء هدف این تسک `User و Session` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: روش‌های Demo، رمز ثابت و user-id تزریقی در Production ممنوع‌اند؛ token rotation و expiry باید قابل آزمون باشد.
- قرارداد داده/API: موجودیت‌های `User, Identity, Session, RefreshToken, MfaChallenge` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/auth/login` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تصاحب حساب، نشست باقی‌مانده و افشای token` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTH-06 — هویت، ورود و نشست: service/use-case
- فاز: `P02`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: احراز هویت واقعی با lifecycle نشست قابل ابطال؛ شیء هدف این تسک `User و Session` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: روش‌های Demo، رمز ثابت و user-id تزریقی در Production ممنوع‌اند؛ token rotation و expiry باید قابل آزمون باشد.
- قرارداد داده/API: موجودیت‌های `User, Identity, Session, RefreshToken, MfaChallenge` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/auth/login` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تصاحب حساب، نشست باقی‌مانده و افشای token` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTH-07 — هویت، ورود و نشست: API خواندن، فهرست و فیلتر
- فاز: `P02`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: احراز هویت واقعی با lifecycle نشست قابل ابطال؛ شیء هدف این تسک `User و Session` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: روش‌های Demo، رمز ثابت و user-id تزریقی در Production ممنوع‌اند؛ token rotation و expiry باید قابل آزمون باشد.
- قرارداد داده/API: موجودیت‌های `User, Identity, Session, RefreshToken, MfaChallenge` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/auth/login` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تصاحب حساب، نشست باقی‌مانده و افشای token` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTH-08 — هویت، ورود و نشست: API ایجاد، تغییر و transition
- فاز: `P02`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: احراز هویت واقعی با lifecycle نشست قابل ابطال؛ شیء هدف این تسک `User و Session` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: روش‌های Demo، رمز ثابت و user-id تزریقی در Production ممنوع‌اند؛ token rotation و expiry باید قابل آزمون باشد.
- قرارداد داده/API: موجودیت‌های `User, Identity, Session, RefreshToken, MfaChallenge` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/auth/login` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تصاحب حساب، نشست باقی‌مانده و افشای token` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTH-09 — هویت، ورود و نشست: concurrency و idempotency
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: احراز هویت واقعی با lifecycle نشست قابل ابطال؛ شیء هدف این تسک `User و Session` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: روش‌های Demo، رمز ثابت و user-id تزریقی در Production ممنوع‌اند؛ token rotation و expiry باید قابل آزمون باشد.
- قرارداد داده/API: موجودیت‌های `User, Identity, Session, RefreshToken, MfaChallenge` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/auth/login` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تصاحب حساب، نشست باقی‌مانده و افشای token` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTH-10 — هویت، ورود و نشست: authorization و tenant scope
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: احراز هویت واقعی با lifecycle نشست قابل ابطال؛ شیء هدف این تسک `User و Session` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: روش‌های Demo، رمز ثابت و user-id تزریقی در Production ممنوع‌اند؛ token rotation و expiry باید قابل آزمون باشد.
- قرارداد داده/API: موجودیت‌های `User, Identity, Session, RefreshToken, MfaChallenge` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/auth/login` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تصاحب حساب، نشست باقی‌مانده و افشای token` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTH-11 — هویت، ورود و نشست: vertical slice رابط کاربری
- فاز: `P02`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: احراز هویت واقعی با lifecycle نشست قابل ابطال؛ شیء هدف این تسک `User و Session` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: روش‌های Demo، رمز ثابت و user-id تزریقی در Production ممنوع‌اند؛ token rotation و expiry باید قابل آزمون باشد.
- قرارداد داده/API: موجودیت‌های `User, Identity, Session, RefreshToken, MfaChallenge` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/auth/login` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تصاحب حساب، نشست باقی‌مانده و افشای token` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTH-12 — هویت، ورود و نشست: تست جامع و evidence
- فاز: `P02`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: احراز هویت واقعی با lifecycle نشست قابل ابطال؛ شیء هدف این تسک `User و Session` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: روش‌های Demo، رمز ثابت و user-id تزریقی در Production ممنوع‌اند؛ token rotation و expiry باید قابل آزمون باشد.
- قرارداد داده/API: موجودیت‌های `User, Identity, Session, RefreshToken, MfaChallenge` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/auth/login` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تصاحب حساب، نشست باقی‌مانده و افشای token` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TEN-01 — چندمستأجری و جداسازی سازمان: کشف invariants و رفتار موجود
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تضمین سخت‌گیرانه جداسازی query، cache، files، events و exports؛ شیء هدف این تسک `Tenant boundary` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: tenant context باید در مرز server تعیین و در همه repositoryها enforce شود.
- قرارداد داده/API: موجودیت‌های `Tenant, TenantMembership, TenantPolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/organization` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `cross-tenant data access` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TEN-02 — چندمستأجری و جداسازی سازمان: مدل دامنه و schema
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تضمین سخت‌گیرانه جداسازی query، cache، files، events و exports؛ شیء هدف این تسک `Tenant boundary` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: tenant context باید در مرز server تعیین و در همه repositoryها enforce شود.
- قرارداد داده/API: موجودیت‌های `Tenant, TenantMembership, TenantPolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/organization` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `cross-tenant data access` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TEN-03 — چندمستأجری و جداسازی سازمان: migration و rollback
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تضمین سخت‌گیرانه جداسازی query، cache، files، events و exports؛ شیء هدف این تسک `Tenant boundary` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: tenant context باید در مرز server تعیین و در همه repositoryها enforce شود.
- قرارداد داده/API: موجودیت‌های `Tenant, TenantMembership, TenantPolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/organization` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `cross-tenant data access` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TEN-04 — چندمستأجری و جداسازی سازمان: repository contract
- فاز: `P02`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تضمین سخت‌گیرانه جداسازی query، cache، files، events و exports؛ شیء هدف این تسک `Tenant boundary` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: tenant context باید در مرز server تعیین و در همه repositoryها enforce شود.
- قرارداد داده/API: موجودیت‌های `Tenant, TenantMembership, TenantPolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/organization` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `cross-tenant data access` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TEN-05 — چندمستأجری و جداسازی سازمان: repository پایدار
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تضمین سخت‌گیرانه جداسازی query، cache، files، events و exports؛ شیء هدف این تسک `Tenant boundary` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: tenant context باید در مرز server تعیین و در همه repositoryها enforce شود.
- قرارداد داده/API: موجودیت‌های `Tenant, TenantMembership, TenantPolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/organization` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `cross-tenant data access` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TEN-06 — چندمستأجری و جداسازی سازمان: service/use-case
- فاز: `P02`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تضمین سخت‌گیرانه جداسازی query، cache، files، events و exports؛ شیء هدف این تسک `Tenant boundary` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: tenant context باید در مرز server تعیین و در همه repositoryها enforce شود.
- قرارداد داده/API: موجودیت‌های `Tenant, TenantMembership, TenantPolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/organization` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `cross-tenant data access` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TEN-07 — چندمستأجری و جداسازی سازمان: API خواندن، فهرست و فیلتر
- فاز: `P02`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تضمین سخت‌گیرانه جداسازی query، cache، files، events و exports؛ شیء هدف این تسک `Tenant boundary` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: tenant context باید در مرز server تعیین و در همه repositoryها enforce شود.
- قرارداد داده/API: موجودیت‌های `Tenant, TenantMembership, TenantPolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/organization` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `cross-tenant data access` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TEN-08 — چندمستأجری و جداسازی سازمان: API ایجاد، تغییر و transition
- فاز: `P02`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تضمین سخت‌گیرانه جداسازی query، cache، files، events و exports؛ شیء هدف این تسک `Tenant boundary` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: tenant context باید در مرز server تعیین و در همه repositoryها enforce شود.
- قرارداد داده/API: موجودیت‌های `Tenant, TenantMembership, TenantPolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/organization` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `cross-tenant data access` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TEN-09 — چندمستأجری و جداسازی سازمان: concurrency و idempotency
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تضمین سخت‌گیرانه جداسازی query، cache، files، events و exports؛ شیء هدف این تسک `Tenant boundary` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: tenant context باید در مرز server تعیین و در همه repositoryها enforce شود.
- قرارداد داده/API: موجودیت‌های `Tenant, TenantMembership, TenantPolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/organization` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `cross-tenant data access` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TEN-10 — چندمستأجری و جداسازی سازمان: authorization و tenant scope
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تضمین سخت‌گیرانه جداسازی query، cache، files، events و exports؛ شیء هدف این تسک `Tenant boundary` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: tenant context باید در مرز server تعیین و در همه repositoryها enforce شود.
- قرارداد داده/API: موجودیت‌های `Tenant, TenantMembership, TenantPolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/organization` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `cross-tenant data access` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TEN-11 — چندمستأجری و جداسازی سازمان: vertical slice رابط کاربری
- فاز: `P02`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تضمین سخت‌گیرانه جداسازی query، cache، files، events و exports؛ شیء هدف این تسک `Tenant boundary` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: tenant context باید در مرز server تعیین و در همه repositoryها enforce شود.
- قرارداد داده/API: موجودیت‌های `Tenant, TenantMembership, TenantPolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/organization` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `cross-tenant data access` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TEN-12 — چندمستأجری و جداسازی سازمان: تست جامع و evidence
- فاز: `P02`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تضمین سخت‌گیرانه جداسازی query، cache، files، events و exports؛ شیء هدف این تسک `Tenant boundary` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: tenant context باید در مرز server تعیین و در همه repositoryها enforce شود.
- قرارداد داده/API: موجودیت‌های `Tenant, TenantMembership, TenantPolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/organization` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `cross-tenant data access` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-RBAC-01 — نقش‌ها، مجوزها و سیاست‌ها: کشف invariants و رفتار موجود
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مجوزدهی server-side و قابل بازبینی بر اساس action و resource؛ شیء هدف این تسک `Permission policy` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: مخفی‌کردن دکمه در UI هیچ‌گاه جایگزین مجوز API نیست.
- قرارداد داده/API: موجودیت‌های `Role, Permission, RoleBinding, ResourcePolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/roles` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ارتقای سطح دسترسی و IDOR` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-RBAC-02 — نقش‌ها، مجوزها و سیاست‌ها: مدل دامنه و schema
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مجوزدهی server-side و قابل بازبینی بر اساس action و resource؛ شیء هدف این تسک `Permission policy` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: مخفی‌کردن دکمه در UI هیچ‌گاه جایگزین مجوز API نیست.
- قرارداد داده/API: موجودیت‌های `Role, Permission, RoleBinding, ResourcePolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/roles` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ارتقای سطح دسترسی و IDOR` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-RBAC-03 — نقش‌ها، مجوزها و سیاست‌ها: migration و rollback
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مجوزدهی server-side و قابل بازبینی بر اساس action و resource؛ شیء هدف این تسک `Permission policy` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: مخفی‌کردن دکمه در UI هیچ‌گاه جایگزین مجوز API نیست.
- قرارداد داده/API: موجودیت‌های `Role, Permission, RoleBinding, ResourcePolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/roles` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ارتقای سطح دسترسی و IDOR` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-RBAC-04 — نقش‌ها، مجوزها و سیاست‌ها: repository contract
- فاز: `P02`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مجوزدهی server-side و قابل بازبینی بر اساس action و resource؛ شیء هدف این تسک `Permission policy` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: مخفی‌کردن دکمه در UI هیچ‌گاه جایگزین مجوز API نیست.
- قرارداد داده/API: موجودیت‌های `Role, Permission, RoleBinding, ResourcePolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/roles` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ارتقای سطح دسترسی و IDOR` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-RBAC-05 — نقش‌ها، مجوزها و سیاست‌ها: repository پایدار
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مجوزدهی server-side و قابل بازبینی بر اساس action و resource؛ شیء هدف این تسک `Permission policy` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: مخفی‌کردن دکمه در UI هیچ‌گاه جایگزین مجوز API نیست.
- قرارداد داده/API: موجودیت‌های `Role, Permission, RoleBinding, ResourcePolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/roles` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ارتقای سطح دسترسی و IDOR` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-RBAC-06 — نقش‌ها، مجوزها و سیاست‌ها: service/use-case
- فاز: `P02`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مجوزدهی server-side و قابل بازبینی بر اساس action و resource؛ شیء هدف این تسک `Permission policy` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: مخفی‌کردن دکمه در UI هیچ‌گاه جایگزین مجوز API نیست.
- قرارداد داده/API: موجودیت‌های `Role, Permission, RoleBinding, ResourcePolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/roles` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ارتقای سطح دسترسی و IDOR` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-RBAC-07 — نقش‌ها، مجوزها و سیاست‌ها: API خواندن، فهرست و فیلتر
- فاز: `P02`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مجوزدهی server-side و قابل بازبینی بر اساس action و resource؛ شیء هدف این تسک `Permission policy` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: مخفی‌کردن دکمه در UI هیچ‌گاه جایگزین مجوز API نیست.
- قرارداد داده/API: موجودیت‌های `Role, Permission, RoleBinding, ResourcePolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/roles` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ارتقای سطح دسترسی و IDOR` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-RBAC-08 — نقش‌ها، مجوزها و سیاست‌ها: API ایجاد، تغییر و transition
- فاز: `P02`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مجوزدهی server-side و قابل بازبینی بر اساس action و resource؛ شیء هدف این تسک `Permission policy` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: مخفی‌کردن دکمه در UI هیچ‌گاه جایگزین مجوز API نیست.
- قرارداد داده/API: موجودیت‌های `Role, Permission, RoleBinding, ResourcePolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/roles` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ارتقای سطح دسترسی و IDOR` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-RBAC-09 — نقش‌ها، مجوزها و سیاست‌ها: concurrency و idempotency
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مجوزدهی server-side و قابل بازبینی بر اساس action و resource؛ شیء هدف این تسک `Permission policy` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: مخفی‌کردن دکمه در UI هیچ‌گاه جایگزین مجوز API نیست.
- قرارداد داده/API: موجودیت‌های `Role, Permission, RoleBinding, ResourcePolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/roles` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ارتقای سطح دسترسی و IDOR` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-RBAC-10 — نقش‌ها، مجوزها و سیاست‌ها: authorization و tenant scope
- فاز: `P02`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مجوزدهی server-side و قابل بازبینی بر اساس action و resource؛ شیء هدف این تسک `Permission policy` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: مخفی‌کردن دکمه در UI هیچ‌گاه جایگزین مجوز API نیست.
- قرارداد داده/API: موجودیت‌های `Role, Permission, RoleBinding, ResourcePolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/roles` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ارتقای سطح دسترسی و IDOR` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-RBAC-11 — نقش‌ها، مجوزها و سیاست‌ها: vertical slice رابط کاربری
- فاز: `P02`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مجوزدهی server-side و قابل بازبینی بر اساس action و resource؛ شیء هدف این تسک `Permission policy` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: مخفی‌کردن دکمه در UI هیچ‌گاه جایگزین مجوز API نیست.
- قرارداد داده/API: موجودیت‌های `Role, Permission, RoleBinding, ResourcePolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/roles` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ارتقای سطح دسترسی و IDOR` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-RBAC-12 — نقش‌ها، مجوزها و سیاست‌ها: تست جامع و evidence
- فاز: `P02`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مجوزدهی server-side و قابل بازبینی بر اساس action و resource؛ شیء هدف این تسک `Permission policy` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: مخفی‌کردن دکمه در UI هیچ‌گاه جایگزین مجوز API نیست.
- قرارداد داده/API: موجودیت‌های `Role, Permission, RoleBinding, ResourcePolicy` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/roles` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ارتقای سطح دسترسی و IDOR` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P02 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-USER-01 — کاربران، تیم‌ها و ساختار سازمانی: کشف invariants و رفتار موجود
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت lifecycle کاربر، عضویت و جانشینی مسئولیت؛ شیء هدف این تسک `User, Team و Department` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: غیرفعال‌سازی کاربر نباید تاریخچه یا ownership را بی‌صدا حذف کند.
- قرارداد داده/API: موجودیت‌های `User, Team, Department, Membership, Invite` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/users` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی باقی‌مانده و از دست رفتن مالکیت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-USER-02 — کاربران، تیم‌ها و ساختار سازمانی: مدل دامنه و schema
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت lifecycle کاربر، عضویت و جانشینی مسئولیت؛ شیء هدف این تسک `User, Team و Department` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: غیرفعال‌سازی کاربر نباید تاریخچه یا ownership را بی‌صدا حذف کند.
- قرارداد داده/API: موجودیت‌های `User, Team, Department, Membership, Invite` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/users` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی باقی‌مانده و از دست رفتن مالکیت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-USER-03 — کاربران، تیم‌ها و ساختار سازمانی: migration و rollback
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت lifecycle کاربر، عضویت و جانشینی مسئولیت؛ شیء هدف این تسک `User, Team و Department` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: غیرفعال‌سازی کاربر نباید تاریخچه یا ownership را بی‌صدا حذف کند.
- قرارداد داده/API: موجودیت‌های `User, Team, Department, Membership, Invite` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/users` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی باقی‌مانده و از دست رفتن مالکیت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-USER-04 — کاربران، تیم‌ها و ساختار سازمانی: repository contract
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت lifecycle کاربر، عضویت و جانشینی مسئولیت؛ شیء هدف این تسک `User, Team و Department` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: غیرفعال‌سازی کاربر نباید تاریخچه یا ownership را بی‌صدا حذف کند.
- قرارداد داده/API: موجودیت‌های `User, Team, Department, Membership, Invite` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/users` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی باقی‌مانده و از دست رفتن مالکیت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-USER-05 — کاربران، تیم‌ها و ساختار سازمانی: repository پایدار
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت lifecycle کاربر، عضویت و جانشینی مسئولیت؛ شیء هدف این تسک `User, Team و Department` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: غیرفعال‌سازی کاربر نباید تاریخچه یا ownership را بی‌صدا حذف کند.
- قرارداد داده/API: موجودیت‌های `User, Team, Department, Membership, Invite` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/users` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی باقی‌مانده و از دست رفتن مالکیت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-USER-06 — کاربران، تیم‌ها و ساختار سازمانی: service/use-case
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت lifecycle کاربر، عضویت و جانشینی مسئولیت؛ شیء هدف این تسک `User, Team و Department` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: غیرفعال‌سازی کاربر نباید تاریخچه یا ownership را بی‌صدا حذف کند.
- قرارداد داده/API: موجودیت‌های `User, Team, Department, Membership, Invite` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/users` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی باقی‌مانده و از دست رفتن مالکیت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-USER-07 — کاربران، تیم‌ها و ساختار سازمانی: API خواندن، فهرست و فیلتر
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت lifecycle کاربر، عضویت و جانشینی مسئولیت؛ شیء هدف این تسک `User, Team و Department` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: غیرفعال‌سازی کاربر نباید تاریخچه یا ownership را بی‌صدا حذف کند.
- قرارداد داده/API: موجودیت‌های `User, Team, Department, Membership, Invite` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/users` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی باقی‌مانده و از دست رفتن مالکیت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-USER-08 — کاربران، تیم‌ها و ساختار سازمانی: API ایجاد، تغییر و transition
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت lifecycle کاربر، عضویت و جانشینی مسئولیت؛ شیء هدف این تسک `User, Team و Department` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: غیرفعال‌سازی کاربر نباید تاریخچه یا ownership را بی‌صدا حذف کند.
- قرارداد داده/API: موجودیت‌های `User, Team, Department, Membership, Invite` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/users` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی باقی‌مانده و از دست رفتن مالکیت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-USER-09 — کاربران، تیم‌ها و ساختار سازمانی: concurrency و idempotency
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت lifecycle کاربر، عضویت و جانشینی مسئولیت؛ شیء هدف این تسک `User, Team و Department` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: غیرفعال‌سازی کاربر نباید تاریخچه یا ownership را بی‌صدا حذف کند.
- قرارداد داده/API: موجودیت‌های `User, Team, Department, Membership, Invite` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/users` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی باقی‌مانده و از دست رفتن مالکیت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-USER-10 — کاربران، تیم‌ها و ساختار سازمانی: authorization و tenant scope
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت lifecycle کاربر، عضویت و جانشینی مسئولیت؛ شیء هدف این تسک `User, Team و Department` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: غیرفعال‌سازی کاربر نباید تاریخچه یا ownership را بی‌صدا حذف کند.
- قرارداد داده/API: موجودیت‌های `User, Team, Department, Membership, Invite` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/users` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی باقی‌مانده و از دست رفتن مالکیت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-USER-11 — کاربران، تیم‌ها و ساختار سازمانی: vertical slice رابط کاربری
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت lifecycle کاربر، عضویت و جانشینی مسئولیت؛ شیء هدف این تسک `User, Team و Department` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: غیرفعال‌سازی کاربر نباید تاریخچه یا ownership را بی‌صدا حذف کند.
- قرارداد داده/API: موجودیت‌های `User, Team, Department, Membership, Invite` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/users` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی باقی‌مانده و از دست رفتن مالکیت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-USER-12 — کاربران، تیم‌ها و ساختار سازمانی: تست جامع و evidence
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت lifecycle کاربر، عضویت و جانشینی مسئولیت؛ شیء هدف این تسک `User, Team و Department` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: غیرفعال‌سازی کاربر نباید تاریخچه یا ownership را بی‌صدا حذف کند.
- قرارداد داده/API: موجودیت‌های `User, Team, Department, Membership, Invite` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/users` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی باقی‌مانده و از دست رفتن مالکیت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DS-01 — Design System و کامپوننت‌های مشترک: کشف invariants و رفتار موجود
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: یکپارچگی واقعی همه صفحات وب و موبایل؛ شیء هدف این تسک `Design tokens و UI primitives` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: رنگ، spacing، typography و stateها از tokenهای مرجع استفاده کنند؛ استثناءها مستند شوند.
- قرارداد داده/API: موجودیت‌های `DesignToken, ComponentContract, PatternCatalog` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تجربه ناسازگار، دسترس‌پذیری ضعیف و هزینه نگهداری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DS-02 — Design System و کامپوننت‌های مشترک: مدل دامنه و schema
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: یکپارچگی واقعی همه صفحات وب و موبایل؛ شیء هدف این تسک `Design tokens و UI primitives` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: رنگ، spacing، typography و stateها از tokenهای مرجع استفاده کنند؛ استثناءها مستند شوند.
- قرارداد داده/API: موجودیت‌های `DesignToken, ComponentContract, PatternCatalog` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تجربه ناسازگار، دسترس‌پذیری ضعیف و هزینه نگهداری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DS-03 — Design System و کامپوننت‌های مشترک: migration و rollback
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: یکپارچگی واقعی همه صفحات وب و موبایل؛ شیء هدف این تسک `Design tokens و UI primitives` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: رنگ، spacing، typography و stateها از tokenهای مرجع استفاده کنند؛ استثناءها مستند شوند.
- قرارداد داده/API: موجودیت‌های `DesignToken, ComponentContract, PatternCatalog` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تجربه ناسازگار، دسترس‌پذیری ضعیف و هزینه نگهداری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DS-04 — Design System و کامپوننت‌های مشترک: repository contract
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: یکپارچگی واقعی همه صفحات وب و موبایل؛ شیء هدف این تسک `Design tokens و UI primitives` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: رنگ، spacing، typography و stateها از tokenهای مرجع استفاده کنند؛ استثناءها مستند شوند.
- قرارداد داده/API: موجودیت‌های `DesignToken, ComponentContract, PatternCatalog` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تجربه ناسازگار، دسترس‌پذیری ضعیف و هزینه نگهداری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DS-05 — Design System و کامپوننت‌های مشترک: repository پایدار
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: یکپارچگی واقعی همه صفحات وب و موبایل؛ شیء هدف این تسک `Design tokens و UI primitives` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: رنگ، spacing، typography و stateها از tokenهای مرجع استفاده کنند؛ استثناءها مستند شوند.
- قرارداد داده/API: موجودیت‌های `DesignToken, ComponentContract, PatternCatalog` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تجربه ناسازگار، دسترس‌پذیری ضعیف و هزینه نگهداری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DS-06 — Design System و کامپوننت‌های مشترک: service/use-case
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: یکپارچگی واقعی همه صفحات وب و موبایل؛ شیء هدف این تسک `Design tokens و UI primitives` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: رنگ، spacing، typography و stateها از tokenهای مرجع استفاده کنند؛ استثناءها مستند شوند.
- قرارداد داده/API: موجودیت‌های `DesignToken, ComponentContract, PatternCatalog` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تجربه ناسازگار، دسترس‌پذیری ضعیف و هزینه نگهداری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DS-07 — Design System و کامپوننت‌های مشترک: API خواندن، فهرست و فیلتر
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: یکپارچگی واقعی همه صفحات وب و موبایل؛ شیء هدف این تسک `Design tokens و UI primitives` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: رنگ، spacing، typography و stateها از tokenهای مرجع استفاده کنند؛ استثناءها مستند شوند.
- قرارداد داده/API: موجودیت‌های `DesignToken, ComponentContract, PatternCatalog` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تجربه ناسازگار، دسترس‌پذیری ضعیف و هزینه نگهداری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DS-08 — Design System و کامپوننت‌های مشترک: API ایجاد، تغییر و transition
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: یکپارچگی واقعی همه صفحات وب و موبایل؛ شیء هدف این تسک `Design tokens و UI primitives` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: رنگ، spacing، typography و stateها از tokenهای مرجع استفاده کنند؛ استثناءها مستند شوند.
- قرارداد داده/API: موجودیت‌های `DesignToken, ComponentContract, PatternCatalog` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تجربه ناسازگار، دسترس‌پذیری ضعیف و هزینه نگهداری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DS-09 — Design System و کامپوننت‌های مشترک: concurrency و idempotency
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: یکپارچگی واقعی همه صفحات وب و موبایل؛ شیء هدف این تسک `Design tokens و UI primitives` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: رنگ، spacing، typography و stateها از tokenهای مرجع استفاده کنند؛ استثناءها مستند شوند.
- قرارداد داده/API: موجودیت‌های `DesignToken, ComponentContract, PatternCatalog` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تجربه ناسازگار، دسترس‌پذیری ضعیف و هزینه نگهداری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DS-10 — Design System و کامپوننت‌های مشترک: authorization و tenant scope
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: یکپارچگی واقعی همه صفحات وب و موبایل؛ شیء هدف این تسک `Design tokens و UI primitives` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: رنگ، spacing، typography و stateها از tokenهای مرجع استفاده کنند؛ استثناءها مستند شوند.
- قرارداد داده/API: موجودیت‌های `DesignToken, ComponentContract, PatternCatalog` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تجربه ناسازگار، دسترس‌پذیری ضعیف و هزینه نگهداری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DS-11 — Design System و کامپوننت‌های مشترک: vertical slice رابط کاربری
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: یکپارچگی واقعی همه صفحات وب و موبایل؛ شیء هدف این تسک `Design tokens و UI primitives` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: رنگ، spacing، typography و stateها از tokenهای مرجع استفاده کنند؛ استثناءها مستند شوند.
- قرارداد داده/API: موجودیت‌های `DesignToken, ComponentContract, PatternCatalog` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تجربه ناسازگار، دسترس‌پذیری ضعیف و هزینه نگهداری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DS-12 — Design System و کامپوننت‌های مشترک: تست جامع و evidence
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: یکپارچگی واقعی همه صفحات وب و موبایل؛ شیء هدف این تسک `Design tokens و UI primitives` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: رنگ، spacing، typography و stateها از tokenهای مرجع استفاده کنند؛ استثناءها مستند شوند.
- قرارداد داده/API: موجودیت‌های `DesignToken, ComponentContract, PatternCatalog` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تجربه ناسازگار، دسترس‌پذیری ضعیف و هزینه نگهداری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ROUTE-01 — معماری Route و ناوبری: کشف invariants و رفتار موجود
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: URLهای مستقل، deep-link، refresh و history قابل اتکا؛ شیء هدف این تسک `Route map و navigation state` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تب داخلی نباید در inventory به‌اشتباه route واقعی معرفی شود.
- قرارداد داده/API: موجودیت‌های `RouteDefinition, NavigationItem, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `لینک مستقیم خراب، back/forward ناسازگار و حالت غیرقابل اشتراک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ROUTE-02 — معماری Route و ناوبری: مدل دامنه و schema
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: URLهای مستقل، deep-link، refresh و history قابل اتکا؛ شیء هدف این تسک `Route map و navigation state` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تب داخلی نباید در inventory به‌اشتباه route واقعی معرفی شود.
- قرارداد داده/API: موجودیت‌های `RouteDefinition, NavigationItem, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `لینک مستقیم خراب، back/forward ناسازگار و حالت غیرقابل اشتراک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ROUTE-03 — معماری Route و ناوبری: migration و rollback
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: URLهای مستقل، deep-link، refresh و history قابل اتکا؛ شیء هدف این تسک `Route map و navigation state` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تب داخلی نباید در inventory به‌اشتباه route واقعی معرفی شود.
- قرارداد داده/API: موجودیت‌های `RouteDefinition, NavigationItem, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `لینک مستقیم خراب، back/forward ناسازگار و حالت غیرقابل اشتراک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ROUTE-04 — معماری Route و ناوبری: repository contract
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: URLهای مستقل، deep-link، refresh و history قابل اتکا؛ شیء هدف این تسک `Route map و navigation state` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تب داخلی نباید در inventory به‌اشتباه route واقعی معرفی شود.
- قرارداد داده/API: موجودیت‌های `RouteDefinition, NavigationItem, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `لینک مستقیم خراب، back/forward ناسازگار و حالت غیرقابل اشتراک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ROUTE-05 — معماری Route و ناوبری: repository پایدار
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: URLهای مستقل، deep-link، refresh و history قابل اتکا؛ شیء هدف این تسک `Route map و navigation state` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تب داخلی نباید در inventory به‌اشتباه route واقعی معرفی شود.
- قرارداد داده/API: موجودیت‌های `RouteDefinition, NavigationItem, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `لینک مستقیم خراب، back/forward ناسازگار و حالت غیرقابل اشتراک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ROUTE-06 — معماری Route و ناوبری: service/use-case
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: URLهای مستقل، deep-link، refresh و history قابل اتکا؛ شیء هدف این تسک `Route map و navigation state` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تب داخلی نباید در inventory به‌اشتباه route واقعی معرفی شود.
- قرارداد داده/API: موجودیت‌های `RouteDefinition, NavigationItem, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `لینک مستقیم خراب، back/forward ناسازگار و حالت غیرقابل اشتراک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ROUTE-07 — معماری Route و ناوبری: API خواندن، فهرست و فیلتر
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: URLهای مستقل، deep-link، refresh و history قابل اتکا؛ شیء هدف این تسک `Route map و navigation state` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تب داخلی نباید در inventory به‌اشتباه route واقعی معرفی شود.
- قرارداد داده/API: موجودیت‌های `RouteDefinition, NavigationItem, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `لینک مستقیم خراب، back/forward ناسازگار و حالت غیرقابل اشتراک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ROUTE-08 — معماری Route و ناوبری: API ایجاد، تغییر و transition
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: URLهای مستقل، deep-link، refresh و history قابل اتکا؛ شیء هدف این تسک `Route map و navigation state` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تب داخلی نباید در inventory به‌اشتباه route واقعی معرفی شود.
- قرارداد داده/API: موجودیت‌های `RouteDefinition, NavigationItem, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `لینک مستقیم خراب، back/forward ناسازگار و حالت غیرقابل اشتراک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ROUTE-09 — معماری Route و ناوبری: concurrency و idempotency
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: URLهای مستقل، deep-link، refresh و history قابل اتکا؛ شیء هدف این تسک `Route map و navigation state` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تب داخلی نباید در inventory به‌اشتباه route واقعی معرفی شود.
- قرارداد داده/API: موجودیت‌های `RouteDefinition, NavigationItem, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `لینک مستقیم خراب، back/forward ناسازگار و حالت غیرقابل اشتراک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ROUTE-10 — معماری Route و ناوبری: authorization و tenant scope
- فاز: `P03`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: URLهای مستقل، deep-link، refresh و history قابل اتکا؛ شیء هدف این تسک `Route map و navigation state` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تب داخلی نباید در inventory به‌اشتباه route واقعی معرفی شود.
- قرارداد داده/API: موجودیت‌های `RouteDefinition, NavigationItem, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `لینک مستقیم خراب، back/forward ناسازگار و حالت غیرقابل اشتراک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ROUTE-11 — معماری Route و ناوبری: vertical slice رابط کاربری
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: URLهای مستقل، deep-link، refresh و history قابل اتکا؛ شیء هدف این تسک `Route map و navigation state` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تب داخلی نباید در inventory به‌اشتباه route واقعی معرفی شود.
- قرارداد داده/API: موجودیت‌های `RouteDefinition, NavigationItem, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `لینک مستقیم خراب، back/forward ناسازگار و حالت غیرقابل اشتراک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ROUTE-12 — معماری Route و ناوبری: تست جامع و evidence
- فاز: `P03`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: URLهای مستقل، deep-link، refresh و history قابل اتکا؛ شیء هدف این تسک `Route map و navigation state` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تب داخلی نباید در inventory به‌اشتباه route واقعی معرفی شود.
- قرارداد داده/API: موجودیت‌های `RouteDefinition, NavigationItem, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/app` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `لینک مستقیم خراب، back/forward ناسازگار و حالت غیرقابل اشتراک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P03 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACCT-01 — حساب‌های مشتری و سازمان‌های مشتری: کشف invariants و رفتار موجود
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: Customer 360 پایدار با مالک، ارتباطات و تاریخچه؛ شیء هدف این تسک `Account` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ادغام مشتری duplicate باید preview و قابلیت audit/rollback داشته باشد.
- قرارداد داده/API: موجودیت‌های `Account, AccountRelation, AccountAddress` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/accounts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تکرار رکورد، اشتباه مالکیت و افشای پرونده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACCT-02 — حساب‌های مشتری و سازمان‌های مشتری: مدل دامنه و schema
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: Customer 360 پایدار با مالک، ارتباطات و تاریخچه؛ شیء هدف این تسک `Account` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ادغام مشتری duplicate باید preview و قابلیت audit/rollback داشته باشد.
- قرارداد داده/API: موجودیت‌های `Account, AccountRelation, AccountAddress` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/accounts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تکرار رکورد، اشتباه مالکیت و افشای پرونده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACCT-03 — حساب‌های مشتری و سازمان‌های مشتری: migration و rollback
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: Customer 360 پایدار با مالک، ارتباطات و تاریخچه؛ شیء هدف این تسک `Account` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ادغام مشتری duplicate باید preview و قابلیت audit/rollback داشته باشد.
- قرارداد داده/API: موجودیت‌های `Account, AccountRelation, AccountAddress` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/accounts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تکرار رکورد، اشتباه مالکیت و افشای پرونده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACCT-04 — حساب‌های مشتری و سازمان‌های مشتری: repository contract
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: Customer 360 پایدار با مالک، ارتباطات و تاریخچه؛ شیء هدف این تسک `Account` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ادغام مشتری duplicate باید preview و قابلیت audit/rollback داشته باشد.
- قرارداد داده/API: موجودیت‌های `Account, AccountRelation, AccountAddress` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/accounts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تکرار رکورد، اشتباه مالکیت و افشای پرونده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACCT-05 — حساب‌های مشتری و سازمان‌های مشتری: repository پایدار
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: Customer 360 پایدار با مالک، ارتباطات و تاریخچه؛ شیء هدف این تسک `Account` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ادغام مشتری duplicate باید preview و قابلیت audit/rollback داشته باشد.
- قرارداد داده/API: موجودیت‌های `Account, AccountRelation, AccountAddress` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/accounts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تکرار رکورد، اشتباه مالکیت و افشای پرونده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACCT-06 — حساب‌های مشتری و سازمان‌های مشتری: service/use-case
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: Customer 360 پایدار با مالک، ارتباطات و تاریخچه؛ شیء هدف این تسک `Account` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ادغام مشتری duplicate باید preview و قابلیت audit/rollback داشته باشد.
- قرارداد داده/API: موجودیت‌های `Account, AccountRelation, AccountAddress` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/accounts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تکرار رکورد، اشتباه مالکیت و افشای پرونده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACCT-07 — حساب‌های مشتری و سازمان‌های مشتری: API خواندن، فهرست و فیلتر
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: Customer 360 پایدار با مالک، ارتباطات و تاریخچه؛ شیء هدف این تسک `Account` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ادغام مشتری duplicate باید preview و قابلیت audit/rollback داشته باشد.
- قرارداد داده/API: موجودیت‌های `Account, AccountRelation, AccountAddress` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/accounts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تکرار رکورد، اشتباه مالکیت و افشای پرونده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACCT-08 — حساب‌های مشتری و سازمان‌های مشتری: API ایجاد، تغییر و transition
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: Customer 360 پایدار با مالک، ارتباطات و تاریخچه؛ شیء هدف این تسک `Account` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ادغام مشتری duplicate باید preview و قابلیت audit/rollback داشته باشد.
- قرارداد داده/API: موجودیت‌های `Account, AccountRelation, AccountAddress` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/accounts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تکرار رکورد، اشتباه مالکیت و افشای پرونده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACCT-09 — حساب‌های مشتری و سازمان‌های مشتری: concurrency و idempotency
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: Customer 360 پایدار با مالک، ارتباطات و تاریخچه؛ شیء هدف این تسک `Account` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ادغام مشتری duplicate باید preview و قابلیت audit/rollback داشته باشد.
- قرارداد داده/API: موجودیت‌های `Account, AccountRelation, AccountAddress` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/accounts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تکرار رکورد، اشتباه مالکیت و افشای پرونده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACCT-10 — حساب‌های مشتری و سازمان‌های مشتری: authorization و tenant scope
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: Customer 360 پایدار با مالک، ارتباطات و تاریخچه؛ شیء هدف این تسک `Account` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ادغام مشتری duplicate باید preview و قابلیت audit/rollback داشته باشد.
- قرارداد داده/API: موجودیت‌های `Account, AccountRelation, AccountAddress` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/accounts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تکرار رکورد، اشتباه مالکیت و افشای پرونده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACCT-11 — حساب‌های مشتری و سازمان‌های مشتری: vertical slice رابط کاربری
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: Customer 360 پایدار با مالک، ارتباطات و تاریخچه؛ شیء هدف این تسک `Account` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ادغام مشتری duplicate باید preview و قابلیت audit/rollback داشته باشد.
- قرارداد داده/API: موجودیت‌های `Account, AccountRelation, AccountAddress` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/accounts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تکرار رکورد، اشتباه مالکیت و افشای پرونده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACCT-12 — حساب‌های مشتری و سازمان‌های مشتری: تست جامع و evidence
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: Customer 360 پایدار با مالک، ارتباطات و تاریخچه؛ شیء هدف این تسک `Account` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ادغام مشتری duplicate باید preview و قابلیت audit/rollback داشته باشد.
- قرارداد داده/API: موجودیت‌های `Account, AccountRelation, AccountAddress` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/accounts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `تکرار رکورد، اشتباه مالکیت و افشای پرونده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CONTACT-01 — اشخاص و مخاطبان: کشف invariants و رفتار موجود
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت شخص، سمت، کانال تماس و پیوند به حساب؛ شیء هدف این تسک `Contact` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: PII باید حداقل‌سازی و دسترسی به فیلد حساس محدود شود.
- قرارداد داده/API: موجودیت‌های `Contact, ContactChannel, ContactRole` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/contacts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای اطلاعات شخصی و duplicate contact` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CONTACT-02 — اشخاص و مخاطبان: مدل دامنه و schema
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت شخص، سمت، کانال تماس و پیوند به حساب؛ شیء هدف این تسک `Contact` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: PII باید حداقل‌سازی و دسترسی به فیلد حساس محدود شود.
- قرارداد داده/API: موجودیت‌های `Contact, ContactChannel, ContactRole` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/contacts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای اطلاعات شخصی و duplicate contact` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CONTACT-03 — اشخاص و مخاطبان: migration و rollback
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت شخص، سمت، کانال تماس و پیوند به حساب؛ شیء هدف این تسک `Contact` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: PII باید حداقل‌سازی و دسترسی به فیلد حساس محدود شود.
- قرارداد داده/API: موجودیت‌های `Contact, ContactChannel, ContactRole` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/contacts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای اطلاعات شخصی و duplicate contact` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CONTACT-04 — اشخاص و مخاطبان: repository contract
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت شخص، سمت، کانال تماس و پیوند به حساب؛ شیء هدف این تسک `Contact` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: PII باید حداقل‌سازی و دسترسی به فیلد حساس محدود شود.
- قرارداد داده/API: موجودیت‌های `Contact, ContactChannel, ContactRole` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/contacts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای اطلاعات شخصی و duplicate contact` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CONTACT-05 — اشخاص و مخاطبان: repository پایدار
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت شخص، سمت، کانال تماس و پیوند به حساب؛ شیء هدف این تسک `Contact` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: PII باید حداقل‌سازی و دسترسی به فیلد حساس محدود شود.
- قرارداد داده/API: موجودیت‌های `Contact, ContactChannel, ContactRole` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/contacts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای اطلاعات شخصی و duplicate contact` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CONTACT-06 — اشخاص و مخاطبان: service/use-case
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت شخص، سمت، کانال تماس و پیوند به حساب؛ شیء هدف این تسک `Contact` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: PII باید حداقل‌سازی و دسترسی به فیلد حساس محدود شود.
- قرارداد داده/API: موجودیت‌های `Contact, ContactChannel, ContactRole` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/contacts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای اطلاعات شخصی و duplicate contact` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CONTACT-07 — اشخاص و مخاطبان: API خواندن، فهرست و فیلتر
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت شخص، سمت، کانال تماس و پیوند به حساب؛ شیء هدف این تسک `Contact` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: PII باید حداقل‌سازی و دسترسی به فیلد حساس محدود شود.
- قرارداد داده/API: موجودیت‌های `Contact, ContactChannel, ContactRole` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/contacts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای اطلاعات شخصی و duplicate contact` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CONTACT-08 — اشخاص و مخاطبان: API ایجاد، تغییر و transition
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت شخص، سمت، کانال تماس و پیوند به حساب؛ شیء هدف این تسک `Contact` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: PII باید حداقل‌سازی و دسترسی به فیلد حساس محدود شود.
- قرارداد داده/API: موجودیت‌های `Contact, ContactChannel, ContactRole` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/contacts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای اطلاعات شخصی و duplicate contact` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CONTACT-09 — اشخاص و مخاطبان: concurrency و idempotency
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت شخص، سمت، کانال تماس و پیوند به حساب؛ شیء هدف این تسک `Contact` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: PII باید حداقل‌سازی و دسترسی به فیلد حساس محدود شود.
- قرارداد داده/API: موجودیت‌های `Contact, ContactChannel, ContactRole` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/contacts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای اطلاعات شخصی و duplicate contact` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CONTACT-10 — اشخاص و مخاطبان: authorization و tenant scope
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت شخص، سمت، کانال تماس و پیوند به حساب؛ شیء هدف این تسک `Contact` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: PII باید حداقل‌سازی و دسترسی به فیلد حساس محدود شود.
- قرارداد داده/API: موجودیت‌های `Contact, ContactChannel, ContactRole` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/contacts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای اطلاعات شخصی و duplicate contact` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CONTACT-11 — اشخاص و مخاطبان: vertical slice رابط کاربری
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت شخص، سمت، کانال تماس و پیوند به حساب؛ شیء هدف این تسک `Contact` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: PII باید حداقل‌سازی و دسترسی به فیلد حساس محدود شود.
- قرارداد داده/API: موجودیت‌های `Contact, ContactChannel, ContactRole` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/contacts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای اطلاعات شخصی و duplicate contact` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CONTACT-12 — اشخاص و مخاطبان: تست جامع و evidence
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت شخص، سمت، کانال تماس و پیوند به حساب؛ شیء هدف این تسک `Contact` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: PII باید حداقل‌سازی و دسترسی به فیلد حساس محدود شود.
- قرارداد داده/API: موجودیت‌های `Contact, ContactChannel, ContactRole` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/contacts` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای اطلاعات شخصی و duplicate contact` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LEAD-01 — سرنخ‌ها و جذب لید: کشف invariants و رفتار موجود
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت، امتیازدهی، تخصیص و تبدیل سرنخ؛ شیء هدف این تسک `Lead` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ثبت عمومی فرم باید rate-limit، ضداسپم و validation سمت سرور داشته باشد.
- قرارداد داده/API: موجودیت‌های `Lead, LeadSource, LeadScore, LeadConversion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/leads` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `spam، data poisoning و تخصیص اشتباه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LEAD-02 — سرنخ‌ها و جذب لید: مدل دامنه و schema
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت، امتیازدهی، تخصیص و تبدیل سرنخ؛ شیء هدف این تسک `Lead` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ثبت عمومی فرم باید rate-limit، ضداسپم و validation سمت سرور داشته باشد.
- قرارداد داده/API: موجودیت‌های `Lead, LeadSource, LeadScore, LeadConversion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/leads` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `spam، data poisoning و تخصیص اشتباه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LEAD-03 — سرنخ‌ها و جذب لید: migration و rollback
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت، امتیازدهی، تخصیص و تبدیل سرنخ؛ شیء هدف این تسک `Lead` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ثبت عمومی فرم باید rate-limit، ضداسپم و validation سمت سرور داشته باشد.
- قرارداد داده/API: موجودیت‌های `Lead, LeadSource, LeadScore, LeadConversion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/leads` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `spam، data poisoning و تخصیص اشتباه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LEAD-04 — سرنخ‌ها و جذب لید: repository contract
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت، امتیازدهی، تخصیص و تبدیل سرنخ؛ شیء هدف این تسک `Lead` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ثبت عمومی فرم باید rate-limit، ضداسپم و validation سمت سرور داشته باشد.
- قرارداد داده/API: موجودیت‌های `Lead, LeadSource, LeadScore, LeadConversion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/leads` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `spam، data poisoning و تخصیص اشتباه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LEAD-05 — سرنخ‌ها و جذب لید: repository پایدار
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت، امتیازدهی، تخصیص و تبدیل سرنخ؛ شیء هدف این تسک `Lead` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ثبت عمومی فرم باید rate-limit، ضداسپم و validation سمت سرور داشته باشد.
- قرارداد داده/API: موجودیت‌های `Lead, LeadSource, LeadScore, LeadConversion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/leads` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `spam، data poisoning و تخصیص اشتباه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LEAD-06 — سرنخ‌ها و جذب لید: service/use-case
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت، امتیازدهی، تخصیص و تبدیل سرنخ؛ شیء هدف این تسک `Lead` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ثبت عمومی فرم باید rate-limit، ضداسپم و validation سمت سرور داشته باشد.
- قرارداد داده/API: موجودیت‌های `Lead, LeadSource, LeadScore, LeadConversion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/leads` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `spam، data poisoning و تخصیص اشتباه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LEAD-07 — سرنخ‌ها و جذب لید: API خواندن، فهرست و فیلتر
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت، امتیازدهی، تخصیص و تبدیل سرنخ؛ شیء هدف این تسک `Lead` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ثبت عمومی فرم باید rate-limit، ضداسپم و validation سمت سرور داشته باشد.
- قرارداد داده/API: موجودیت‌های `Lead, LeadSource, LeadScore, LeadConversion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/leads` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `spam، data poisoning و تخصیص اشتباه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LEAD-08 — سرنخ‌ها و جذب لید: API ایجاد، تغییر و transition
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت، امتیازدهی، تخصیص و تبدیل سرنخ؛ شیء هدف این تسک `Lead` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ثبت عمومی فرم باید rate-limit، ضداسپم و validation سمت سرور داشته باشد.
- قرارداد داده/API: موجودیت‌های `Lead, LeadSource, LeadScore, LeadConversion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/leads` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `spam، data poisoning و تخصیص اشتباه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LEAD-09 — سرنخ‌ها و جذب لید: concurrency و idempotency
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت، امتیازدهی، تخصیص و تبدیل سرنخ؛ شیء هدف این تسک `Lead` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ثبت عمومی فرم باید rate-limit، ضداسپم و validation سمت سرور داشته باشد.
- قرارداد داده/API: موجودیت‌های `Lead, LeadSource, LeadScore, LeadConversion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/leads` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `spam، data poisoning و تخصیص اشتباه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LEAD-10 — سرنخ‌ها و جذب لید: authorization و tenant scope
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت، امتیازدهی، تخصیص و تبدیل سرنخ؛ شیء هدف این تسک `Lead` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ثبت عمومی فرم باید rate-limit، ضداسپم و validation سمت سرور داشته باشد.
- قرارداد داده/API: موجودیت‌های `Lead, LeadSource, LeadScore, LeadConversion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/leads` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `spam، data poisoning و تخصیص اشتباه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LEAD-11 — سرنخ‌ها و جذب لید: vertical slice رابط کاربری
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت، امتیازدهی، تخصیص و تبدیل سرنخ؛ شیء هدف این تسک `Lead` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ثبت عمومی فرم باید rate-limit، ضداسپم و validation سمت سرور داشته باشد.
- قرارداد داده/API: موجودیت‌های `Lead, LeadSource, LeadScore, LeadConversion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/leads` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `spam، data poisoning و تخصیص اشتباه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LEAD-12 — سرنخ‌ها و جذب لید: تست جامع و evidence
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت، امتیازدهی، تخصیص و تبدیل سرنخ؛ شیء هدف این تسک `Lead` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: ثبت عمومی فرم باید rate-limit، ضداسپم و validation سمت سرور داشته باشد.
- قرارداد داده/API: موجودیت‌های `Lead, LeadSource, LeadScore, LeadConversion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/leads` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `spam، data poisoning و تخصیص اشتباه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEAL-01 — فرصت‌ها و کاریز فروش: کشف invariants و رفتار موجود
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: فروش قابل پیش‌بینی با مرحله، اقدام بعدی و دلیل باخت؛ شیء هدف این تسک `Opportunity` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: انتقال stage باید مجاز، تاریخچه‌دار و متناسب با forecast تعریف شود.
- قرارداد داده/API: موجودیت‌های `Opportunity, Pipeline, PipelineStage, LossReason` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/opportunities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `forecast نادرست، معامله رهاشده و تغییر وضعیت غیرمجاز` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEAL-02 — فرصت‌ها و کاریز فروش: مدل دامنه و schema
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: فروش قابل پیش‌بینی با مرحله، اقدام بعدی و دلیل باخت؛ شیء هدف این تسک `Opportunity` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: انتقال stage باید مجاز، تاریخچه‌دار و متناسب با forecast تعریف شود.
- قرارداد داده/API: موجودیت‌های `Opportunity, Pipeline, PipelineStage, LossReason` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/opportunities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `forecast نادرست، معامله رهاشده و تغییر وضعیت غیرمجاز` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEAL-03 — فرصت‌ها و کاریز فروش: migration و rollback
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: فروش قابل پیش‌بینی با مرحله، اقدام بعدی و دلیل باخت؛ شیء هدف این تسک `Opportunity` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: انتقال stage باید مجاز، تاریخچه‌دار و متناسب با forecast تعریف شود.
- قرارداد داده/API: موجودیت‌های `Opportunity, Pipeline, PipelineStage, LossReason` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/opportunities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `forecast نادرست، معامله رهاشده و تغییر وضعیت غیرمجاز` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEAL-04 — فرصت‌ها و کاریز فروش: repository contract
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: فروش قابل پیش‌بینی با مرحله، اقدام بعدی و دلیل باخت؛ شیء هدف این تسک `Opportunity` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: انتقال stage باید مجاز، تاریخچه‌دار و متناسب با forecast تعریف شود.
- قرارداد داده/API: موجودیت‌های `Opportunity, Pipeline, PipelineStage, LossReason` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/opportunities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `forecast نادرست، معامله رهاشده و تغییر وضعیت غیرمجاز` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEAL-05 — فرصت‌ها و کاریز فروش: repository پایدار
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: فروش قابل پیش‌بینی با مرحله، اقدام بعدی و دلیل باخت؛ شیء هدف این تسک `Opportunity` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: انتقال stage باید مجاز، تاریخچه‌دار و متناسب با forecast تعریف شود.
- قرارداد داده/API: موجودیت‌های `Opportunity, Pipeline, PipelineStage, LossReason` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/opportunities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `forecast نادرست، معامله رهاشده و تغییر وضعیت غیرمجاز` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEAL-06 — فرصت‌ها و کاریز فروش: service/use-case
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: فروش قابل پیش‌بینی با مرحله، اقدام بعدی و دلیل باخت؛ شیء هدف این تسک `Opportunity` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: انتقال stage باید مجاز، تاریخچه‌دار و متناسب با forecast تعریف شود.
- قرارداد داده/API: موجودیت‌های `Opportunity, Pipeline, PipelineStage, LossReason` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/opportunities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `forecast نادرست، معامله رهاشده و تغییر وضعیت غیرمجاز` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEAL-07 — فرصت‌ها و کاریز فروش: API خواندن، فهرست و فیلتر
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: فروش قابل پیش‌بینی با مرحله، اقدام بعدی و دلیل باخت؛ شیء هدف این تسک `Opportunity` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: انتقال stage باید مجاز، تاریخچه‌دار و متناسب با forecast تعریف شود.
- قرارداد داده/API: موجودیت‌های `Opportunity, Pipeline, PipelineStage, LossReason` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/opportunities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `forecast نادرست، معامله رهاشده و تغییر وضعیت غیرمجاز` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEAL-08 — فرصت‌ها و کاریز فروش: API ایجاد، تغییر و transition
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: فروش قابل پیش‌بینی با مرحله، اقدام بعدی و دلیل باخت؛ شیء هدف این تسک `Opportunity` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: انتقال stage باید مجاز، تاریخچه‌دار و متناسب با forecast تعریف شود.
- قرارداد داده/API: موجودیت‌های `Opportunity, Pipeline, PipelineStage, LossReason` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/opportunities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `forecast نادرست، معامله رهاشده و تغییر وضعیت غیرمجاز` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEAL-09 — فرصت‌ها و کاریز فروش: concurrency و idempotency
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: فروش قابل پیش‌بینی با مرحله، اقدام بعدی و دلیل باخت؛ شیء هدف این تسک `Opportunity` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: انتقال stage باید مجاز، تاریخچه‌دار و متناسب با forecast تعریف شود.
- قرارداد داده/API: موجودیت‌های `Opportunity, Pipeline, PipelineStage, LossReason` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/opportunities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `forecast نادرست، معامله رهاشده و تغییر وضعیت غیرمجاز` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEAL-10 — فرصت‌ها و کاریز فروش: authorization و tenant scope
- فاز: `P04`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: فروش قابل پیش‌بینی با مرحله، اقدام بعدی و دلیل باخت؛ شیء هدف این تسک `Opportunity` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: انتقال stage باید مجاز، تاریخچه‌دار و متناسب با forecast تعریف شود.
- قرارداد داده/API: موجودیت‌های `Opportunity, Pipeline, PipelineStage, LossReason` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/opportunities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `forecast نادرست، معامله رهاشده و تغییر وضعیت غیرمجاز` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEAL-11 — فرصت‌ها و کاریز فروش: vertical slice رابط کاربری
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: فروش قابل پیش‌بینی با مرحله، اقدام بعدی و دلیل باخت؛ شیء هدف این تسک `Opportunity` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: انتقال stage باید مجاز، تاریخچه‌دار و متناسب با forecast تعریف شود.
- قرارداد داده/API: موجودیت‌های `Opportunity, Pipeline, PipelineStage, LossReason` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/opportunities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `forecast نادرست، معامله رهاشده و تغییر وضعیت غیرمجاز` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEAL-12 — فرصت‌ها و کاریز فروش: تست جامع و evidence
- فاز: `P04`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: فروش قابل پیش‌بینی با مرحله، اقدام بعدی و دلیل باخت؛ شیء هدف این تسک `Opportunity` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: انتقال stage باید مجاز، تاریخچه‌دار و متناسب با forecast تعریف شود.
- قرارداد داده/API: موجودیت‌های `Opportunity, Pipeline, PipelineStage, LossReason` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/opportunities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `forecast نادرست، معامله رهاشده و تغییر وضعیت غیرمجاز` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P04 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PRODUCT-01 — کاتالوگ، قیمت، تخفیف و پیشنهاد فروش: کشف invariants و رفتار موجود
- فاز: `P05`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قیمت‌گذاری و proposal قابل بازبینی؛ شیء هدف این تسک `Product و Quote` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: قیمت، واحد پول، tax، discount و rounding باید سروری و با decimal امن محاسبه شوند.
- قرارداد داده/API: موجودیت‌های `Product, PriceBook, Quote, QuoteLine, TaxRule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/products` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `مغایرت مالی، rounding و ویرایش تاریخی قیمت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PRODUCT-02 — کاتالوگ، قیمت، تخفیف و پیشنهاد فروش: مدل دامنه و schema
- فاز: `P05`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قیمت‌گذاری و proposal قابل بازبینی؛ شیء هدف این تسک `Product و Quote` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: قیمت، واحد پول، tax، discount و rounding باید سروری و با decimal امن محاسبه شوند.
- قرارداد داده/API: موجودیت‌های `Product, PriceBook, Quote, QuoteLine, TaxRule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/products` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `مغایرت مالی، rounding و ویرایش تاریخی قیمت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PRODUCT-03 — کاتالوگ، قیمت، تخفیف و پیشنهاد فروش: migration و rollback
- فاز: `P05`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قیمت‌گذاری و proposal قابل بازبینی؛ شیء هدف این تسک `Product و Quote` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: قیمت، واحد پول، tax، discount و rounding باید سروری و با decimal امن محاسبه شوند.
- قرارداد داده/API: موجودیت‌های `Product, PriceBook, Quote, QuoteLine, TaxRule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/products` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `مغایرت مالی، rounding و ویرایش تاریخی قیمت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PRODUCT-04 — کاتالوگ، قیمت، تخفیف و پیشنهاد فروش: repository contract
- فاز: `P05`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قیمت‌گذاری و proposal قابل بازبینی؛ شیء هدف این تسک `Product و Quote` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: قیمت، واحد پول، tax، discount و rounding باید سروری و با decimal امن محاسبه شوند.
- قرارداد داده/API: موجودیت‌های `Product, PriceBook, Quote, QuoteLine, TaxRule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/products` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `مغایرت مالی، rounding و ویرایش تاریخی قیمت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PRODUCT-05 — کاتالوگ، قیمت، تخفیف و پیشنهاد فروش: repository پایدار
- فاز: `P05`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قیمت‌گذاری و proposal قابل بازبینی؛ شیء هدف این تسک `Product و Quote` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: قیمت، واحد پول، tax، discount و rounding باید سروری و با decimal امن محاسبه شوند.
- قرارداد داده/API: موجودیت‌های `Product, PriceBook, Quote, QuoteLine, TaxRule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/products` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `مغایرت مالی، rounding و ویرایش تاریخی قیمت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PRODUCT-06 — کاتالوگ، قیمت، تخفیف و پیشنهاد فروش: service/use-case
- فاز: `P05`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قیمت‌گذاری و proposal قابل بازبینی؛ شیء هدف این تسک `Product و Quote` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: قیمت، واحد پول، tax، discount و rounding باید سروری و با decimal امن محاسبه شوند.
- قرارداد داده/API: موجودیت‌های `Product, PriceBook, Quote, QuoteLine, TaxRule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/products` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `مغایرت مالی، rounding و ویرایش تاریخی قیمت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PRODUCT-07 — کاتالوگ، قیمت، تخفیف و پیشنهاد فروش: API خواندن، فهرست و فیلتر
- فاز: `P05`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قیمت‌گذاری و proposal قابل بازبینی؛ شیء هدف این تسک `Product و Quote` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: قیمت، واحد پول، tax، discount و rounding باید سروری و با decimal امن محاسبه شوند.
- قرارداد داده/API: موجودیت‌های `Product, PriceBook, Quote, QuoteLine, TaxRule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/products` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `مغایرت مالی، rounding و ویرایش تاریخی قیمت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PRODUCT-08 — کاتالوگ، قیمت، تخفیف و پیشنهاد فروش: API ایجاد، تغییر و transition
- فاز: `P05`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قیمت‌گذاری و proposal قابل بازبینی؛ شیء هدف این تسک `Product و Quote` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: قیمت، واحد پول، tax، discount و rounding باید سروری و با decimal امن محاسبه شوند.
- قرارداد داده/API: موجودیت‌های `Product, PriceBook, Quote, QuoteLine, TaxRule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/products` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `مغایرت مالی، rounding و ویرایش تاریخی قیمت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PRODUCT-09 — کاتالوگ، قیمت، تخفیف و پیشنهاد فروش: concurrency و idempotency
- فاز: `P05`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قیمت‌گذاری و proposal قابل بازبینی؛ شیء هدف این تسک `Product و Quote` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: قیمت، واحد پول، tax، discount و rounding باید سروری و با decimal امن محاسبه شوند.
- قرارداد داده/API: موجودیت‌های `Product, PriceBook, Quote, QuoteLine, TaxRule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/products` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `مغایرت مالی، rounding و ویرایش تاریخی قیمت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PRODUCT-10 — کاتالوگ، قیمت، تخفیف و پیشنهاد فروش: authorization و tenant scope
- فاز: `P05`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قیمت‌گذاری و proposal قابل بازبینی؛ شیء هدف این تسک `Product و Quote` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: قیمت، واحد پول، tax، discount و rounding باید سروری و با decimal امن محاسبه شوند.
- قرارداد داده/API: موجودیت‌های `Product, PriceBook, Quote, QuoteLine, TaxRule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/products` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `مغایرت مالی، rounding و ویرایش تاریخی قیمت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PRODUCT-11 — کاتالوگ، قیمت، تخفیف و پیشنهاد فروش: vertical slice رابط کاربری
- فاز: `P05`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قیمت‌گذاری و proposal قابل بازبینی؛ شیء هدف این تسک `Product و Quote` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: قیمت، واحد پول، tax، discount و rounding باید سروری و با decimal امن محاسبه شوند.
- قرارداد داده/API: موجودیت‌های `Product, PriceBook, Quote, QuoteLine, TaxRule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/products` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `مغایرت مالی، rounding و ویرایش تاریخی قیمت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PRODUCT-12 — کاتالوگ، قیمت، تخفیف و پیشنهاد فروش: تست جامع و evidence
- فاز: `P05`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قیمت‌گذاری و proposal قابل بازبینی؛ شیء هدف این تسک `Product و Quote` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: قیمت، واحد پول، tax، discount و rounding باید سروری و با decimal امن محاسبه شوند.
- قرارداد داده/API: موجودیت‌های `Product, PriceBook, Quote, QuoteLine, TaxRule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/crm/products` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `مغایرت مالی، rounding و ویرایش تاریخی قیمت` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACT-01 — فعالیت‌ها، تماس‌ها و تقویم: کشف invariants و رفتار موجود
- فاز: `P05`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجمیع تماس، جلسه، یادآوری و follow-up؛ شیء هدف این تسک `Activity` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timezone و تقویم شمسی/میلادی باید در مرز نمایش و ذخیره‌سازی روشن باشند.
- قرارداد داده/API: موجودیت‌های `Activity, Call, Reminder, CalendarEvent` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/activities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن follow-up و تفسیر اشتباه تاریخ` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACT-02 — فعالیت‌ها، تماس‌ها و تقویم: مدل دامنه و schema
- فاز: `P05`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجمیع تماس، جلسه، یادآوری و follow-up؛ شیء هدف این تسک `Activity` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timezone و تقویم شمسی/میلادی باید در مرز نمایش و ذخیره‌سازی روشن باشند.
- قرارداد داده/API: موجودیت‌های `Activity, Call, Reminder, CalendarEvent` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/activities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن follow-up و تفسیر اشتباه تاریخ` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACT-03 — فعالیت‌ها، تماس‌ها و تقویم: migration و rollback
- فاز: `P05`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجمیع تماس، جلسه، یادآوری و follow-up؛ شیء هدف این تسک `Activity` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timezone و تقویم شمسی/میلادی باید در مرز نمایش و ذخیره‌سازی روشن باشند.
- قرارداد داده/API: موجودیت‌های `Activity, Call, Reminder, CalendarEvent` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/activities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن follow-up و تفسیر اشتباه تاریخ` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACT-04 — فعالیت‌ها، تماس‌ها و تقویم: repository contract
- فاز: `P05`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجمیع تماس، جلسه، یادآوری و follow-up؛ شیء هدف این تسک `Activity` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timezone و تقویم شمسی/میلادی باید در مرز نمایش و ذخیره‌سازی روشن باشند.
- قرارداد داده/API: موجودیت‌های `Activity, Call, Reminder, CalendarEvent` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/activities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن follow-up و تفسیر اشتباه تاریخ` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACT-05 — فعالیت‌ها، تماس‌ها و تقویم: repository پایدار
- فاز: `P05`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجمیع تماس، جلسه، یادآوری و follow-up؛ شیء هدف این تسک `Activity` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timezone و تقویم شمسی/میلادی باید در مرز نمایش و ذخیره‌سازی روشن باشند.
- قرارداد داده/API: موجودیت‌های `Activity, Call, Reminder, CalendarEvent` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/activities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن follow-up و تفسیر اشتباه تاریخ` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACT-06 — فعالیت‌ها، تماس‌ها و تقویم: service/use-case
- فاز: `P05`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجمیع تماس، جلسه، یادآوری و follow-up؛ شیء هدف این تسک `Activity` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timezone و تقویم شمسی/میلادی باید در مرز نمایش و ذخیره‌سازی روشن باشند.
- قرارداد داده/API: موجودیت‌های `Activity, Call, Reminder, CalendarEvent` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/activities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن follow-up و تفسیر اشتباه تاریخ` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACT-07 — فعالیت‌ها، تماس‌ها و تقویم: API خواندن، فهرست و فیلتر
- فاز: `P05`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجمیع تماس، جلسه، یادآوری و follow-up؛ شیء هدف این تسک `Activity` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timezone و تقویم شمسی/میلادی باید در مرز نمایش و ذخیره‌سازی روشن باشند.
- قرارداد داده/API: موجودیت‌های `Activity, Call, Reminder, CalendarEvent` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/activities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن follow-up و تفسیر اشتباه تاریخ` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACT-08 — فعالیت‌ها، تماس‌ها و تقویم: API ایجاد، تغییر و transition
- فاز: `P05`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجمیع تماس، جلسه، یادآوری و follow-up؛ شیء هدف این تسک `Activity` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timezone و تقویم شمسی/میلادی باید در مرز نمایش و ذخیره‌سازی روشن باشند.
- قرارداد داده/API: موجودیت‌های `Activity, Call, Reminder, CalendarEvent` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/activities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن follow-up و تفسیر اشتباه تاریخ` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACT-09 — فعالیت‌ها، تماس‌ها و تقویم: concurrency و idempotency
- فاز: `P05`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجمیع تماس، جلسه، یادآوری و follow-up؛ شیء هدف این تسک `Activity` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timezone و تقویم شمسی/میلادی باید در مرز نمایش و ذخیره‌سازی روشن باشند.
- قرارداد داده/API: موجودیت‌های `Activity, Call, Reminder, CalendarEvent` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/activities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن follow-up و تفسیر اشتباه تاریخ` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACT-10 — فعالیت‌ها، تماس‌ها و تقویم: authorization و tenant scope
- فاز: `P05`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجمیع تماس، جلسه، یادآوری و follow-up؛ شیء هدف این تسک `Activity` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timezone و تقویم شمسی/میلادی باید در مرز نمایش و ذخیره‌سازی روشن باشند.
- قرارداد داده/API: موجودیت‌های `Activity, Call, Reminder, CalendarEvent` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/activities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن follow-up و تفسیر اشتباه تاریخ` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACT-11 — فعالیت‌ها، تماس‌ها و تقویم: vertical slice رابط کاربری
- فاز: `P05`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجمیع تماس، جلسه، یادآوری و follow-up؛ شیء هدف این تسک `Activity` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timezone و تقویم شمسی/میلادی باید در مرز نمایش و ذخیره‌سازی روشن باشند.
- قرارداد داده/API: موجودیت‌های `Activity, Call, Reminder, CalendarEvent` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/activities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن follow-up و تفسیر اشتباه تاریخ` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-ACT-12 — فعالیت‌ها، تماس‌ها و تقویم: تست جامع و evidence
- فاز: `P05`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجمیع تماس، جلسه، یادآوری و follow-up؛ شیء هدف این تسک `Activity` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timezone و تقویم شمسی/میلادی باید در مرز نمایش و ذخیره‌سازی روشن باشند.
- قرارداد داده/API: موجودیت‌های `Activity, Call, Reminder, CalendarEvent` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/activities` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن follow-up و تفسیر اشتباه تاریخ` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P05 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TASK-01 — تسک‌ها، Kanban و وزن‌دهی: کشف invariants و رفتار موجود
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت کار با وضعیت، اولویت، وزن و مسئول تأیید؛ شیء هدف این تسک `Task` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: transition وضعیت و وزن مؤثر بر گزارش باید transaction-safe باشد.
- قرارداد داده/API: موجودیت‌های `Task, TaskStatus, TaskDependency, TaskWatcher` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/tasks` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `race condition، محاسبه پیشرفت نادرست و task گمشده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TASK-02 — تسک‌ها، Kanban و وزن‌دهی: مدل دامنه و schema
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت کار با وضعیت، اولویت، وزن و مسئول تأیید؛ شیء هدف این تسک `Task` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: transition وضعیت و وزن مؤثر بر گزارش باید transaction-safe باشد.
- قرارداد داده/API: موجودیت‌های `Task, TaskStatus, TaskDependency, TaskWatcher` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/tasks` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `race condition، محاسبه پیشرفت نادرست و task گمشده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TASK-03 — تسک‌ها، Kanban و وزن‌دهی: migration و rollback
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت کار با وضعیت، اولویت، وزن و مسئول تأیید؛ شیء هدف این تسک `Task` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: transition وضعیت و وزن مؤثر بر گزارش باید transaction-safe باشد.
- قرارداد داده/API: موجودیت‌های `Task, TaskStatus, TaskDependency, TaskWatcher` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/tasks` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `race condition، محاسبه پیشرفت نادرست و task گمشده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TASK-04 — تسک‌ها، Kanban و وزن‌دهی: repository contract
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت کار با وضعیت، اولویت، وزن و مسئول تأیید؛ شیء هدف این تسک `Task` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: transition وضعیت و وزن مؤثر بر گزارش باید transaction-safe باشد.
- قرارداد داده/API: موجودیت‌های `Task, TaskStatus, TaskDependency, TaskWatcher` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/tasks` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `race condition، محاسبه پیشرفت نادرست و task گمشده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TASK-05 — تسک‌ها، Kanban و وزن‌دهی: repository پایدار
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت کار با وضعیت، اولویت، وزن و مسئول تأیید؛ شیء هدف این تسک `Task` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: transition وضعیت و وزن مؤثر بر گزارش باید transaction-safe باشد.
- قرارداد داده/API: موجودیت‌های `Task, TaskStatus, TaskDependency, TaskWatcher` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/tasks` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `race condition، محاسبه پیشرفت نادرست و task گمشده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TASK-06 — تسک‌ها، Kanban و وزن‌دهی: service/use-case
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت کار با وضعیت، اولویت، وزن و مسئول تأیید؛ شیء هدف این تسک `Task` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: transition وضعیت و وزن مؤثر بر گزارش باید transaction-safe باشد.
- قرارداد داده/API: موجودیت‌های `Task, TaskStatus, TaskDependency, TaskWatcher` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/tasks` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `race condition، محاسبه پیشرفت نادرست و task گمشده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TASK-07 — تسک‌ها، Kanban و وزن‌دهی: API خواندن، فهرست و فیلتر
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت کار با وضعیت، اولویت، وزن و مسئول تأیید؛ شیء هدف این تسک `Task` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: transition وضعیت و وزن مؤثر بر گزارش باید transaction-safe باشد.
- قرارداد داده/API: موجودیت‌های `Task, TaskStatus, TaskDependency, TaskWatcher` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/tasks` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `race condition، محاسبه پیشرفت نادرست و task گمشده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TASK-08 — تسک‌ها، Kanban و وزن‌دهی: API ایجاد، تغییر و transition
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت کار با وضعیت، اولویت، وزن و مسئول تأیید؛ شیء هدف این تسک `Task` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: transition وضعیت و وزن مؤثر بر گزارش باید transaction-safe باشد.
- قرارداد داده/API: موجودیت‌های `Task, TaskStatus, TaskDependency, TaskWatcher` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/tasks` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `race condition، محاسبه پیشرفت نادرست و task گمشده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TASK-09 — تسک‌ها، Kanban و وزن‌دهی: concurrency و idempotency
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت کار با وضعیت، اولویت، وزن و مسئول تأیید؛ شیء هدف این تسک `Task` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: transition وضعیت و وزن مؤثر بر گزارش باید transaction-safe باشد.
- قرارداد داده/API: موجودیت‌های `Task, TaskStatus, TaskDependency, TaskWatcher` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/tasks` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `race condition، محاسبه پیشرفت نادرست و task گمشده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TASK-10 — تسک‌ها، Kanban و وزن‌دهی: authorization و tenant scope
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت کار با وضعیت، اولویت، وزن و مسئول تأیید؛ شیء هدف این تسک `Task` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: transition وضعیت و وزن مؤثر بر گزارش باید transaction-safe باشد.
- قرارداد داده/API: موجودیت‌های `Task, TaskStatus, TaskDependency, TaskWatcher` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/tasks` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `race condition، محاسبه پیشرفت نادرست و task گمشده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TASK-11 — تسک‌ها، Kanban و وزن‌دهی: vertical slice رابط کاربری
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت کار با وضعیت، اولویت، وزن و مسئول تأیید؛ شیء هدف این تسک `Task` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: transition وضعیت و وزن مؤثر بر گزارش باید transaction-safe باشد.
- قرارداد داده/API: موجودیت‌های `Task, TaskStatus, TaskDependency, TaskWatcher` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/tasks` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `race condition، محاسبه پیشرفت نادرست و task گمشده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TASK-12 — تسک‌ها، Kanban و وزن‌دهی: تست جامع و evidence
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت کار با وضعیت، اولویت، وزن و مسئول تأیید؛ شیء هدف این تسک `Task` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: transition وضعیت و وزن مؤثر بر گزارش باید transaction-safe باشد.
- قرارداد داده/API: موجودیت‌های `Task, TaskStatus, TaskDependency, TaskWatcher` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/tasks` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `race condition، محاسبه پیشرفت نادرست و task گمشده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PROJ-01 — پروژه‌ها، WBS و milestone: کشف invariants و رفتار موجود
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: برنامه‌ریزی پروژه و پیشرفت وزنی قابل اعتماد؛ شیء هدف این تسک `Project و WorkPackage` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: درصد پیشرفت از task/phase وزن‌دار محاسبه شود، نه عدد نمایشی غیرقابل ردیابی.
- قرارداد داده/API: موجودیت‌های `Project, ProjectPhase, Milestone, WorkPackage` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/projects` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گزارش کاذب سلامت پروژه و از دست رفتن وابستگی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PROJ-02 — پروژه‌ها، WBS و milestone: مدل دامنه و schema
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: برنامه‌ریزی پروژه و پیشرفت وزنی قابل اعتماد؛ شیء هدف این تسک `Project و WorkPackage` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: درصد پیشرفت از task/phase وزن‌دار محاسبه شود، نه عدد نمایشی غیرقابل ردیابی.
- قرارداد داده/API: موجودیت‌های `Project, ProjectPhase, Milestone, WorkPackage` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/projects` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گزارش کاذب سلامت پروژه و از دست رفتن وابستگی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PROJ-03 — پروژه‌ها، WBS و milestone: migration و rollback
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: برنامه‌ریزی پروژه و پیشرفت وزنی قابل اعتماد؛ شیء هدف این تسک `Project و WorkPackage` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: درصد پیشرفت از task/phase وزن‌دار محاسبه شود، نه عدد نمایشی غیرقابل ردیابی.
- قرارداد داده/API: موجودیت‌های `Project, ProjectPhase, Milestone, WorkPackage` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/projects` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گزارش کاذب سلامت پروژه و از دست رفتن وابستگی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PROJ-04 — پروژه‌ها، WBS و milestone: repository contract
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: برنامه‌ریزی پروژه و پیشرفت وزنی قابل اعتماد؛ شیء هدف این تسک `Project و WorkPackage` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: درصد پیشرفت از task/phase وزن‌دار محاسبه شود، نه عدد نمایشی غیرقابل ردیابی.
- قرارداد داده/API: موجودیت‌های `Project, ProjectPhase, Milestone, WorkPackage` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/projects` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گزارش کاذب سلامت پروژه و از دست رفتن وابستگی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PROJ-05 — پروژه‌ها، WBS و milestone: repository پایدار
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: برنامه‌ریزی پروژه و پیشرفت وزنی قابل اعتماد؛ شیء هدف این تسک `Project و WorkPackage` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: درصد پیشرفت از task/phase وزن‌دار محاسبه شود، نه عدد نمایشی غیرقابل ردیابی.
- قرارداد داده/API: موجودیت‌های `Project, ProjectPhase, Milestone, WorkPackage` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/projects` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گزارش کاذب سلامت پروژه و از دست رفتن وابستگی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PROJ-06 — پروژه‌ها، WBS و milestone: service/use-case
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: برنامه‌ریزی پروژه و پیشرفت وزنی قابل اعتماد؛ شیء هدف این تسک `Project و WorkPackage` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: درصد پیشرفت از task/phase وزن‌دار محاسبه شود، نه عدد نمایشی غیرقابل ردیابی.
- قرارداد داده/API: موجودیت‌های `Project, ProjectPhase, Milestone, WorkPackage` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/projects` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گزارش کاذب سلامت پروژه و از دست رفتن وابستگی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PROJ-07 — پروژه‌ها، WBS و milestone: API خواندن، فهرست و فیلتر
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: برنامه‌ریزی پروژه و پیشرفت وزنی قابل اعتماد؛ شیء هدف این تسک `Project و WorkPackage` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: درصد پیشرفت از task/phase وزن‌دار محاسبه شود، نه عدد نمایشی غیرقابل ردیابی.
- قرارداد داده/API: موجودیت‌های `Project, ProjectPhase, Milestone, WorkPackage` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/projects` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گزارش کاذب سلامت پروژه و از دست رفتن وابستگی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PROJ-08 — پروژه‌ها، WBS و milestone: API ایجاد، تغییر و transition
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: برنامه‌ریزی پروژه و پیشرفت وزنی قابل اعتماد؛ شیء هدف این تسک `Project و WorkPackage` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: درصد پیشرفت از task/phase وزن‌دار محاسبه شود، نه عدد نمایشی غیرقابل ردیابی.
- قرارداد داده/API: موجودیت‌های `Project, ProjectPhase, Milestone, WorkPackage` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/projects` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گزارش کاذب سلامت پروژه و از دست رفتن وابستگی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PROJ-09 — پروژه‌ها، WBS و milestone: concurrency و idempotency
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: برنامه‌ریزی پروژه و پیشرفت وزنی قابل اعتماد؛ شیء هدف این تسک `Project و WorkPackage` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: درصد پیشرفت از task/phase وزن‌دار محاسبه شود، نه عدد نمایشی غیرقابل ردیابی.
- قرارداد داده/API: موجودیت‌های `Project, ProjectPhase, Milestone, WorkPackage` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/projects` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گزارش کاذب سلامت پروژه و از دست رفتن وابستگی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PROJ-10 — پروژه‌ها، WBS و milestone: authorization و tenant scope
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: برنامه‌ریزی پروژه و پیشرفت وزنی قابل اعتماد؛ شیء هدف این تسک `Project و WorkPackage` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: درصد پیشرفت از task/phase وزن‌دار محاسبه شود، نه عدد نمایشی غیرقابل ردیابی.
- قرارداد داده/API: موجودیت‌های `Project, ProjectPhase, Milestone, WorkPackage` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/projects` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گزارش کاذب سلامت پروژه و از دست رفتن وابستگی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PROJ-11 — پروژه‌ها، WBS و milestone: vertical slice رابط کاربری
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: برنامه‌ریزی پروژه و پیشرفت وزنی قابل اعتماد؛ شیء هدف این تسک `Project و WorkPackage` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: درصد پیشرفت از task/phase وزن‌دار محاسبه شود، نه عدد نمایشی غیرقابل ردیابی.
- قرارداد داده/API: موجودیت‌های `Project, ProjectPhase, Milestone, WorkPackage` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/projects` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گزارش کاذب سلامت پروژه و از دست رفتن وابستگی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PROJ-12 — پروژه‌ها، WBS و milestone: تست جامع و evidence
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: برنامه‌ریزی پروژه و پیشرفت وزنی قابل اعتماد؛ شیء هدف این تسک `Project و WorkPackage` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: درصد پیشرفت از task/phase وزن‌دار محاسبه شود، نه عدد نمایشی غیرقابل ردیابی.
- قرارداد داده/API: موجودیت‌های `Project, ProjectPhase, Milestone, WorkPackage` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/projects` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گزارش کاذب سلامت پروژه و از دست رفتن وابستگی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TIME-01 — ثبت زمان و timesheet: کشف invariants و رفتار موجود
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردیابی زمان، تایمر و ساعات قابل فاکتور؛ شیء هدف این تسک `TimeEntry` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هم‌پوشانی تایمر، توقف دوباره و ثبت تکراری باید idempotent و کنترل شود.
- قرارداد داده/API: موجودیت‌های `TimeEntry, TimerSession, BillingCategory, Approval` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/time` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `کارکرد دوگانه، صورتحساب غلط و تقلب زمانی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TIME-02 — ثبت زمان و timesheet: مدل دامنه و schema
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردیابی زمان، تایمر و ساعات قابل فاکتور؛ شیء هدف این تسک `TimeEntry` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هم‌پوشانی تایمر، توقف دوباره و ثبت تکراری باید idempotent و کنترل شود.
- قرارداد داده/API: موجودیت‌های `TimeEntry, TimerSession, BillingCategory, Approval` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/time` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `کارکرد دوگانه، صورتحساب غلط و تقلب زمانی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TIME-03 — ثبت زمان و timesheet: migration و rollback
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردیابی زمان، تایمر و ساعات قابل فاکتور؛ شیء هدف این تسک `TimeEntry` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هم‌پوشانی تایمر، توقف دوباره و ثبت تکراری باید idempotent و کنترل شود.
- قرارداد داده/API: موجودیت‌های `TimeEntry, TimerSession, BillingCategory, Approval` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/time` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `کارکرد دوگانه، صورتحساب غلط و تقلب زمانی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TIME-04 — ثبت زمان و timesheet: repository contract
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردیابی زمان، تایمر و ساعات قابل فاکتور؛ شیء هدف این تسک `TimeEntry` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هم‌پوشانی تایمر، توقف دوباره و ثبت تکراری باید idempotent و کنترل شود.
- قرارداد داده/API: موجودیت‌های `TimeEntry, TimerSession, BillingCategory, Approval` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/time` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `کارکرد دوگانه، صورتحساب غلط و تقلب زمانی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TIME-05 — ثبت زمان و timesheet: repository پایدار
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردیابی زمان، تایمر و ساعات قابل فاکتور؛ شیء هدف این تسک `TimeEntry` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هم‌پوشانی تایمر، توقف دوباره و ثبت تکراری باید idempotent و کنترل شود.
- قرارداد داده/API: موجودیت‌های `TimeEntry, TimerSession, BillingCategory, Approval` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/time` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `کارکرد دوگانه، صورتحساب غلط و تقلب زمانی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TIME-06 — ثبت زمان و timesheet: service/use-case
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردیابی زمان، تایمر و ساعات قابل فاکتور؛ شیء هدف این تسک `TimeEntry` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هم‌پوشانی تایمر، توقف دوباره و ثبت تکراری باید idempotent و کنترل شود.
- قرارداد داده/API: موجودیت‌های `TimeEntry, TimerSession, BillingCategory, Approval` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/time` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `کارکرد دوگانه، صورتحساب غلط و تقلب زمانی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TIME-07 — ثبت زمان و timesheet: API خواندن، فهرست و فیلتر
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردیابی زمان، تایمر و ساعات قابل فاکتور؛ شیء هدف این تسک `TimeEntry` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هم‌پوشانی تایمر، توقف دوباره و ثبت تکراری باید idempotent و کنترل شود.
- قرارداد داده/API: موجودیت‌های `TimeEntry, TimerSession, BillingCategory, Approval` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/time` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `کارکرد دوگانه، صورتحساب غلط و تقلب زمانی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TIME-08 — ثبت زمان و timesheet: API ایجاد، تغییر و transition
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردیابی زمان، تایمر و ساعات قابل فاکتور؛ شیء هدف این تسک `TimeEntry` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هم‌پوشانی تایمر، توقف دوباره و ثبت تکراری باید idempotent و کنترل شود.
- قرارداد داده/API: موجودیت‌های `TimeEntry, TimerSession, BillingCategory, Approval` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/time` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `کارکرد دوگانه، صورتحساب غلط و تقلب زمانی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TIME-09 — ثبت زمان و timesheet: concurrency و idempotency
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردیابی زمان، تایمر و ساعات قابل فاکتور؛ شیء هدف این تسک `TimeEntry` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هم‌پوشانی تایمر، توقف دوباره و ثبت تکراری باید idempotent و کنترل شود.
- قرارداد داده/API: موجودیت‌های `TimeEntry, TimerSession, BillingCategory, Approval` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/time` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `کارکرد دوگانه، صورتحساب غلط و تقلب زمانی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TIME-10 — ثبت زمان و timesheet: authorization و tenant scope
- فاز: `P06`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردیابی زمان، تایمر و ساعات قابل فاکتور؛ شیء هدف این تسک `TimeEntry` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هم‌پوشانی تایمر، توقف دوباره و ثبت تکراری باید idempotent و کنترل شود.
- قرارداد داده/API: موجودیت‌های `TimeEntry, TimerSession, BillingCategory, Approval` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/time` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `کارکرد دوگانه، صورتحساب غلط و تقلب زمانی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TIME-11 — ثبت زمان و timesheet: vertical slice رابط کاربری
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردیابی زمان، تایمر و ساعات قابل فاکتور؛ شیء هدف این تسک `TimeEntry` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هم‌پوشانی تایمر، توقف دوباره و ثبت تکراری باید idempotent و کنترل شود.
- قرارداد داده/API: موجودیت‌های `TimeEntry, TimerSession, BillingCategory, Approval` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/time` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `کارکرد دوگانه، صورتحساب غلط و تقلب زمانی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-TIME-12 — ثبت زمان و timesheet: تست جامع و evidence
- فاز: `P06`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردیابی زمان، تایمر و ساعات قابل فاکتور؛ شیء هدف این تسک `TimeEntry` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هم‌پوشانی تایمر، توقف دوباره و ثبت تکراری باید idempotent و کنترل شود.
- قرارداد داده/API: موجودیت‌های `TimeEntry, TimerSession, BillingCategory, Approval` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/work/time` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `کارکرد دوگانه، صورتحساب غلط و تقلب زمانی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P06 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SUP-01 — مرکز پشتیبانی، Ticket و SLA: کشف invariants و رفتار موجود
- فاز: `P07`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت صف، SLA، macro، پیام و یادداشت داخلی؛ شیء هدف این تسک `Ticket` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: یادداشت داخلی هرگز به پورتال مشتری یا ایمیل خروجی نشت نکند.
- قرارداد داده/API: موجودیت‌های `Ticket, TicketMessage, SLA, Macro, Queue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/support/tickets` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای یادداشت داخلی و SLA نقض‌شده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SUP-02 — مرکز پشتیبانی، Ticket و SLA: مدل دامنه و schema
- فاز: `P07`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت صف، SLA، macro، پیام و یادداشت داخلی؛ شیء هدف این تسک `Ticket` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: یادداشت داخلی هرگز به پورتال مشتری یا ایمیل خروجی نشت نکند.
- قرارداد داده/API: موجودیت‌های `Ticket, TicketMessage, SLA, Macro, Queue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/support/tickets` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای یادداشت داخلی و SLA نقض‌شده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SUP-03 — مرکز پشتیبانی، Ticket و SLA: migration و rollback
- فاز: `P07`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت صف، SLA، macro، پیام و یادداشت داخلی؛ شیء هدف این تسک `Ticket` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: یادداشت داخلی هرگز به پورتال مشتری یا ایمیل خروجی نشت نکند.
- قرارداد داده/API: موجودیت‌های `Ticket, TicketMessage, SLA, Macro, Queue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/support/tickets` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای یادداشت داخلی و SLA نقض‌شده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SUP-04 — مرکز پشتیبانی، Ticket و SLA: repository contract
- فاز: `P07`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت صف، SLA، macro، پیام و یادداشت داخلی؛ شیء هدف این تسک `Ticket` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: یادداشت داخلی هرگز به پورتال مشتری یا ایمیل خروجی نشت نکند.
- قرارداد داده/API: موجودیت‌های `Ticket, TicketMessage, SLA, Macro, Queue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/support/tickets` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای یادداشت داخلی و SLA نقض‌شده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SUP-05 — مرکز پشتیبانی، Ticket و SLA: repository پایدار
- فاز: `P07`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت صف، SLA، macro، پیام و یادداشت داخلی؛ شیء هدف این تسک `Ticket` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: یادداشت داخلی هرگز به پورتال مشتری یا ایمیل خروجی نشت نکند.
- قرارداد داده/API: موجودیت‌های `Ticket, TicketMessage, SLA, Macro, Queue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/support/tickets` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای یادداشت داخلی و SLA نقض‌شده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SUP-06 — مرکز پشتیبانی، Ticket و SLA: service/use-case
- فاز: `P07`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت صف، SLA، macro، پیام و یادداشت داخلی؛ شیء هدف این تسک `Ticket` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: یادداشت داخلی هرگز به پورتال مشتری یا ایمیل خروجی نشت نکند.
- قرارداد داده/API: موجودیت‌های `Ticket, TicketMessage, SLA, Macro, Queue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/support/tickets` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای یادداشت داخلی و SLA نقض‌شده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SUP-07 — مرکز پشتیبانی، Ticket و SLA: API خواندن، فهرست و فیلتر
- فاز: `P07`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت صف، SLA، macro، پیام و یادداشت داخلی؛ شیء هدف این تسک `Ticket` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: یادداشت داخلی هرگز به پورتال مشتری یا ایمیل خروجی نشت نکند.
- قرارداد داده/API: موجودیت‌های `Ticket, TicketMessage, SLA, Macro, Queue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/support/tickets` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای یادداشت داخلی و SLA نقض‌شده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SUP-08 — مرکز پشتیبانی، Ticket و SLA: API ایجاد، تغییر و transition
- فاز: `P07`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت صف، SLA، macro، پیام و یادداشت داخلی؛ شیء هدف این تسک `Ticket` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: یادداشت داخلی هرگز به پورتال مشتری یا ایمیل خروجی نشت نکند.
- قرارداد داده/API: موجودیت‌های `Ticket, TicketMessage, SLA, Macro, Queue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/support/tickets` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای یادداشت داخلی و SLA نقض‌شده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SUP-09 — مرکز پشتیبانی، Ticket و SLA: concurrency و idempotency
- فاز: `P07`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت صف، SLA، macro، پیام و یادداشت داخلی؛ شیء هدف این تسک `Ticket` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: یادداشت داخلی هرگز به پورتال مشتری یا ایمیل خروجی نشت نکند.
- قرارداد داده/API: موجودیت‌های `Ticket, TicketMessage, SLA, Macro, Queue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/support/tickets` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای یادداشت داخلی و SLA نقض‌شده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SUP-10 — مرکز پشتیبانی، Ticket و SLA: authorization و tenant scope
- فاز: `P07`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت صف، SLA، macro، پیام و یادداشت داخلی؛ شیء هدف این تسک `Ticket` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: یادداشت داخلی هرگز به پورتال مشتری یا ایمیل خروجی نشت نکند.
- قرارداد داده/API: موجودیت‌های `Ticket, TicketMessage, SLA, Macro, Queue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/support/tickets` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای یادداشت داخلی و SLA نقض‌شده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SUP-11 — مرکز پشتیبانی، Ticket و SLA: vertical slice رابط کاربری
- فاز: `P07`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت صف، SLA، macro، پیام و یادداشت داخلی؛ شیء هدف این تسک `Ticket` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: یادداشت داخلی هرگز به پورتال مشتری یا ایمیل خروجی نشت نکند.
- قرارداد داده/API: موجودیت‌های `Ticket, TicketMessage, SLA, Macro, Queue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/support/tickets` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای یادداشت داخلی و SLA نقض‌شده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SUP-12 — مرکز پشتیبانی، Ticket و SLA: تست جامع و evidence
- فاز: `P07`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت صف، SLA، macro، پیام و یادداشت داخلی؛ شیء هدف این تسک `Ticket` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: یادداشت داخلی هرگز به پورتال مشتری یا ایمیل خروجی نشت نکند.
- قرارداد داده/API: موجودیت‌های `Ticket, TicketMessage, SLA, Macro, Queue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/support/tickets` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای یادداشت داخلی و SLA نقض‌شده` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PORTAL-01 — پورتال مشتری و CSAT: کشف invariants و رفتار موجود
- فاز: `P07`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: دسترسی مشتری به پرونده خودش با تجربه self-service؛ شیء هدف این تسک `PortalSession و CustomerRequest` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شناسه مشتری از ورودی نباید اعتماد شود؛ scope بر اساس هویت و رابطه تأییدشده اعمال شود.
- قرارداد داده/API: موجودیت‌های `PortalUser, PortalSession, CustomerRequest, CSATResponse` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/portal` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `IDOR، نشت tenant و دسترسی به فایل مشتری دیگر` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PORTAL-02 — پورتال مشتری و CSAT: مدل دامنه و schema
- فاز: `P07`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: دسترسی مشتری به پرونده خودش با تجربه self-service؛ شیء هدف این تسک `PortalSession و CustomerRequest` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شناسه مشتری از ورودی نباید اعتماد شود؛ scope بر اساس هویت و رابطه تأییدشده اعمال شود.
- قرارداد داده/API: موجودیت‌های `PortalUser, PortalSession, CustomerRequest, CSATResponse` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/portal` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `IDOR، نشت tenant و دسترسی به فایل مشتری دیگر` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PORTAL-03 — پورتال مشتری و CSAT: migration و rollback
- فاز: `P07`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: دسترسی مشتری به پرونده خودش با تجربه self-service؛ شیء هدف این تسک `PortalSession و CustomerRequest` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شناسه مشتری از ورودی نباید اعتماد شود؛ scope بر اساس هویت و رابطه تأییدشده اعمال شود.
- قرارداد داده/API: موجودیت‌های `PortalUser, PortalSession, CustomerRequest, CSATResponse` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/portal` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `IDOR، نشت tenant و دسترسی به فایل مشتری دیگر` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PORTAL-04 — پورتال مشتری و CSAT: repository contract
- فاز: `P07`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: دسترسی مشتری به پرونده خودش با تجربه self-service؛ شیء هدف این تسک `PortalSession و CustomerRequest` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شناسه مشتری از ورودی نباید اعتماد شود؛ scope بر اساس هویت و رابطه تأییدشده اعمال شود.
- قرارداد داده/API: موجودیت‌های `PortalUser, PortalSession, CustomerRequest, CSATResponse` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/portal` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `IDOR، نشت tenant و دسترسی به فایل مشتری دیگر` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PORTAL-05 — پورتال مشتری و CSAT: repository پایدار
- فاز: `P07`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: دسترسی مشتری به پرونده خودش با تجربه self-service؛ شیء هدف این تسک `PortalSession و CustomerRequest` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شناسه مشتری از ورودی نباید اعتماد شود؛ scope بر اساس هویت و رابطه تأییدشده اعمال شود.
- قرارداد داده/API: موجودیت‌های `PortalUser, PortalSession, CustomerRequest, CSATResponse` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/portal` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `IDOR، نشت tenant و دسترسی به فایل مشتری دیگر` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PORTAL-06 — پورتال مشتری و CSAT: service/use-case
- فاز: `P07`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: دسترسی مشتری به پرونده خودش با تجربه self-service؛ شیء هدف این تسک `PortalSession و CustomerRequest` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شناسه مشتری از ورودی نباید اعتماد شود؛ scope بر اساس هویت و رابطه تأییدشده اعمال شود.
- قرارداد داده/API: موجودیت‌های `PortalUser, PortalSession, CustomerRequest, CSATResponse` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/portal` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `IDOR، نشت tenant و دسترسی به فایل مشتری دیگر` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PORTAL-07 — پورتال مشتری و CSAT: API خواندن، فهرست و فیلتر
- فاز: `P07`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: دسترسی مشتری به پرونده خودش با تجربه self-service؛ شیء هدف این تسک `PortalSession و CustomerRequest` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شناسه مشتری از ورودی نباید اعتماد شود؛ scope بر اساس هویت و رابطه تأییدشده اعمال شود.
- قرارداد داده/API: موجودیت‌های `PortalUser, PortalSession, CustomerRequest, CSATResponse` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/portal` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `IDOR، نشت tenant و دسترسی به فایل مشتری دیگر` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PORTAL-08 — پورتال مشتری و CSAT: API ایجاد، تغییر و transition
- فاز: `P07`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: دسترسی مشتری به پرونده خودش با تجربه self-service؛ شیء هدف این تسک `PortalSession و CustomerRequest` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شناسه مشتری از ورودی نباید اعتماد شود؛ scope بر اساس هویت و رابطه تأییدشده اعمال شود.
- قرارداد داده/API: موجودیت‌های `PortalUser, PortalSession, CustomerRequest, CSATResponse` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/portal` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `IDOR، نشت tenant و دسترسی به فایل مشتری دیگر` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PORTAL-09 — پورتال مشتری و CSAT: concurrency و idempotency
- فاز: `P07`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: دسترسی مشتری به پرونده خودش با تجربه self-service؛ شیء هدف این تسک `PortalSession و CustomerRequest` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شناسه مشتری از ورودی نباید اعتماد شود؛ scope بر اساس هویت و رابطه تأییدشده اعمال شود.
- قرارداد داده/API: موجودیت‌های `PortalUser, PortalSession, CustomerRequest, CSATResponse` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/portal` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `IDOR، نشت tenant و دسترسی به فایل مشتری دیگر` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PORTAL-10 — پورتال مشتری و CSAT: authorization و tenant scope
- فاز: `P07`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: دسترسی مشتری به پرونده خودش با تجربه self-service؛ شیء هدف این تسک `PortalSession و CustomerRequest` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شناسه مشتری از ورودی نباید اعتماد شود؛ scope بر اساس هویت و رابطه تأییدشده اعمال شود.
- قرارداد داده/API: موجودیت‌های `PortalUser, PortalSession, CustomerRequest, CSATResponse` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/portal` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `IDOR، نشت tenant و دسترسی به فایل مشتری دیگر` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PORTAL-11 — پورتال مشتری و CSAT: vertical slice رابط کاربری
- فاز: `P07`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: دسترسی مشتری به پرونده خودش با تجربه self-service؛ شیء هدف این تسک `PortalSession و CustomerRequest` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شناسه مشتری از ورودی نباید اعتماد شود؛ scope بر اساس هویت و رابطه تأییدشده اعمال شود.
- قرارداد داده/API: موجودیت‌های `PortalUser, PortalSession, CustomerRequest, CSATResponse` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/portal` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `IDOR، نشت tenant و دسترسی به فایل مشتری دیگر` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-PORTAL-12 — پورتال مشتری و CSAT: تست جامع و evidence
- فاز: `P07`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: دسترسی مشتری به پرونده خودش با تجربه self-service؛ شیء هدف این تسک `PortalSession و CustomerRequest` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شناسه مشتری از ورودی نباید اعتماد شود؛ scope بر اساس هویت و رابطه تأییدشده اعمال شود.
- قرارداد داده/API: موجودیت‌های `PortalUser, PortalSession, CustomerRequest, CSATResponse` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/portal` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `IDOR، نشت tenant و دسترسی به فایل مشتری دیگر` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P07 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CUSTOM-01 — فیلدهای سفارشی و فرم‌ساز: کشف invariants و رفتار موجود
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابلیت توسعه بدون شکستن مدل دامنه؛ شیء هدف این تسک `CustomFieldDefinition` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تعریف فیلد و مقدار آن باید versioned، validated و در permission policy لحاظ شود.
- قرارداد داده/API: موجودیت‌های `CustomFieldDefinition, CustomFieldValue, FormDefinition` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/custom-fields` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نوع داده نامعتبر، query injection و migration دردناک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CUSTOM-02 — فیلدهای سفارشی و فرم‌ساز: مدل دامنه و schema
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابلیت توسعه بدون شکستن مدل دامنه؛ شیء هدف این تسک `CustomFieldDefinition` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تعریف فیلد و مقدار آن باید versioned، validated و در permission policy لحاظ شود.
- قرارداد داده/API: موجودیت‌های `CustomFieldDefinition, CustomFieldValue, FormDefinition` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/custom-fields` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نوع داده نامعتبر، query injection و migration دردناک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CUSTOM-03 — فیلدهای سفارشی و فرم‌ساز: migration و rollback
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابلیت توسعه بدون شکستن مدل دامنه؛ شیء هدف این تسک `CustomFieldDefinition` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تعریف فیلد و مقدار آن باید versioned، validated و در permission policy لحاظ شود.
- قرارداد داده/API: موجودیت‌های `CustomFieldDefinition, CustomFieldValue, FormDefinition` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/custom-fields` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نوع داده نامعتبر، query injection و migration دردناک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CUSTOM-04 — فیلدهای سفارشی و فرم‌ساز: repository contract
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابلیت توسعه بدون شکستن مدل دامنه؛ شیء هدف این تسک `CustomFieldDefinition` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تعریف فیلد و مقدار آن باید versioned، validated و در permission policy لحاظ شود.
- قرارداد داده/API: موجودیت‌های `CustomFieldDefinition, CustomFieldValue, FormDefinition` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/custom-fields` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نوع داده نامعتبر، query injection و migration دردناک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CUSTOM-05 — فیلدهای سفارشی و فرم‌ساز: repository پایدار
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابلیت توسعه بدون شکستن مدل دامنه؛ شیء هدف این تسک `CustomFieldDefinition` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تعریف فیلد و مقدار آن باید versioned، validated و در permission policy لحاظ شود.
- قرارداد داده/API: موجودیت‌های `CustomFieldDefinition, CustomFieldValue, FormDefinition` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/custom-fields` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نوع داده نامعتبر، query injection و migration دردناک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CUSTOM-06 — فیلدهای سفارشی و فرم‌ساز: service/use-case
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابلیت توسعه بدون شکستن مدل دامنه؛ شیء هدف این تسک `CustomFieldDefinition` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تعریف فیلد و مقدار آن باید versioned، validated و در permission policy لحاظ شود.
- قرارداد داده/API: موجودیت‌های `CustomFieldDefinition, CustomFieldValue, FormDefinition` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/custom-fields` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نوع داده نامعتبر، query injection و migration دردناک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CUSTOM-07 — فیلدهای سفارشی و فرم‌ساز: API خواندن، فهرست و فیلتر
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابلیت توسعه بدون شکستن مدل دامنه؛ شیء هدف این تسک `CustomFieldDefinition` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تعریف فیلد و مقدار آن باید versioned، validated و در permission policy لحاظ شود.
- قرارداد داده/API: موجودیت‌های `CustomFieldDefinition, CustomFieldValue, FormDefinition` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/custom-fields` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نوع داده نامعتبر، query injection و migration دردناک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CUSTOM-08 — فیلدهای سفارشی و فرم‌ساز: API ایجاد، تغییر و transition
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابلیت توسعه بدون شکستن مدل دامنه؛ شیء هدف این تسک `CustomFieldDefinition` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تعریف فیلد و مقدار آن باید versioned، validated و در permission policy لحاظ شود.
- قرارداد داده/API: موجودیت‌های `CustomFieldDefinition, CustomFieldValue, FormDefinition` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/custom-fields` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نوع داده نامعتبر، query injection و migration دردناک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CUSTOM-09 — فیلدهای سفارشی و فرم‌ساز: concurrency و idempotency
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابلیت توسعه بدون شکستن مدل دامنه؛ شیء هدف این تسک `CustomFieldDefinition` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تعریف فیلد و مقدار آن باید versioned، validated و در permission policy لحاظ شود.
- قرارداد داده/API: موجودیت‌های `CustomFieldDefinition, CustomFieldValue, FormDefinition` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/custom-fields` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نوع داده نامعتبر، query injection و migration دردناک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CUSTOM-10 — فیلدهای سفارشی و فرم‌ساز: authorization و tenant scope
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابلیت توسعه بدون شکستن مدل دامنه؛ شیء هدف این تسک `CustomFieldDefinition` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تعریف فیلد و مقدار آن باید versioned، validated و در permission policy لحاظ شود.
- قرارداد داده/API: موجودیت‌های `CustomFieldDefinition, CustomFieldValue, FormDefinition` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/custom-fields` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نوع داده نامعتبر، query injection و migration دردناک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CUSTOM-11 — فیلدهای سفارشی و فرم‌ساز: vertical slice رابط کاربری
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابلیت توسعه بدون شکستن مدل دامنه؛ شیء هدف این تسک `CustomFieldDefinition` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تعریف فیلد و مقدار آن باید versioned، validated و در permission policy لحاظ شود.
- قرارداد داده/API: موجودیت‌های `CustomFieldDefinition, CustomFieldValue, FormDefinition` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/custom-fields` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نوع داده نامعتبر، query injection و migration دردناک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-CUSTOM-12 — فیلدهای سفارشی و فرم‌ساز: تست جامع و evidence
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابلیت توسعه بدون شکستن مدل دامنه؛ شیء هدف این تسک `CustomFieldDefinition` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تعریف فیلد و مقدار آن باید versioned، validated و در permission policy لحاظ شود.
- قرارداد داده/API: موجودیت‌های `CustomFieldDefinition, CustomFieldValue, FormDefinition` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/custom-fields` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نوع داده نامعتبر، query injection و migration دردناک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DOC-01 — اسناد، فایل‌ها و نسخه‌بندی: کشف invariants و رفتار موجود
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ذخیره و اشتراک فایل با policy و version history؛ شیء هدف این تسک `Document و Attachment` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: فایل‌ها private by default، اسکن‌شده و از طریق signed URL محدود دریافت شوند.
- قرارداد داده/API: موجودیت‌های `Document, Attachment, DocumentVersion, Folder` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/documents` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `public bucket، malware و افشای فایل` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DOC-02 — اسناد، فایل‌ها و نسخه‌بندی: مدل دامنه و schema
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ذخیره و اشتراک فایل با policy و version history؛ شیء هدف این تسک `Document و Attachment` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: فایل‌ها private by default، اسکن‌شده و از طریق signed URL محدود دریافت شوند.
- قرارداد داده/API: موجودیت‌های `Document, Attachment, DocumentVersion, Folder` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/documents` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `public bucket، malware و افشای فایل` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DOC-03 — اسناد، فایل‌ها و نسخه‌بندی: migration و rollback
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ذخیره و اشتراک فایل با policy و version history؛ شیء هدف این تسک `Document و Attachment` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: فایل‌ها private by default، اسکن‌شده و از طریق signed URL محدود دریافت شوند.
- قرارداد داده/API: موجودیت‌های `Document, Attachment, DocumentVersion, Folder` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/documents` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `public bucket، malware و افشای فایل` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DOC-04 — اسناد، فایل‌ها و نسخه‌بندی: repository contract
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ذخیره و اشتراک فایل با policy و version history؛ شیء هدف این تسک `Document و Attachment` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: فایل‌ها private by default، اسکن‌شده و از طریق signed URL محدود دریافت شوند.
- قرارداد داده/API: موجودیت‌های `Document, Attachment, DocumentVersion, Folder` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/documents` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `public bucket، malware و افشای فایل` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DOC-05 — اسناد، فایل‌ها و نسخه‌بندی: repository پایدار
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ذخیره و اشتراک فایل با policy و version history؛ شیء هدف این تسک `Document و Attachment` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: فایل‌ها private by default، اسکن‌شده و از طریق signed URL محدود دریافت شوند.
- قرارداد داده/API: موجودیت‌های `Document, Attachment, DocumentVersion, Folder` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/documents` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `public bucket، malware و افشای فایل` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DOC-06 — اسناد، فایل‌ها و نسخه‌بندی: service/use-case
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ذخیره و اشتراک فایل با policy و version history؛ شیء هدف این تسک `Document و Attachment` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: فایل‌ها private by default، اسکن‌شده و از طریق signed URL محدود دریافت شوند.
- قرارداد داده/API: موجودیت‌های `Document, Attachment, DocumentVersion, Folder` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/documents` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `public bucket، malware و افشای فایل` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DOC-07 — اسناد، فایل‌ها و نسخه‌بندی: API خواندن، فهرست و فیلتر
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ذخیره و اشتراک فایل با policy و version history؛ شیء هدف این تسک `Document و Attachment` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: فایل‌ها private by default، اسکن‌شده و از طریق signed URL محدود دریافت شوند.
- قرارداد داده/API: موجودیت‌های `Document, Attachment, DocumentVersion, Folder` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/documents` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `public bucket، malware و افشای فایل` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DOC-08 — اسناد، فایل‌ها و نسخه‌بندی: API ایجاد، تغییر و transition
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ذخیره و اشتراک فایل با policy و version history؛ شیء هدف این تسک `Document و Attachment` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: فایل‌ها private by default، اسکن‌شده و از طریق signed URL محدود دریافت شوند.
- قرارداد داده/API: موجودیت‌های `Document, Attachment, DocumentVersion, Folder` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/documents` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `public bucket، malware و افشای فایل` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DOC-09 — اسناد، فایل‌ها و نسخه‌بندی: concurrency و idempotency
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ذخیره و اشتراک فایل با policy و version history؛ شیء هدف این تسک `Document و Attachment` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: فایل‌ها private by default، اسکن‌شده و از طریق signed URL محدود دریافت شوند.
- قرارداد داده/API: موجودیت‌های `Document, Attachment, DocumentVersion, Folder` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/documents` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `public bucket، malware و افشای فایل` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DOC-10 — اسناد، فایل‌ها و نسخه‌بندی: authorization و tenant scope
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ذخیره و اشتراک فایل با policy و version history؛ شیء هدف این تسک `Document و Attachment` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: فایل‌ها private by default، اسکن‌شده و از طریق signed URL محدود دریافت شوند.
- قرارداد داده/API: موجودیت‌های `Document, Attachment, DocumentVersion, Folder` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/documents` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `public bucket، malware و افشای فایل` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DOC-11 — اسناد، فایل‌ها و نسخه‌بندی: vertical slice رابط کاربری
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ذخیره و اشتراک فایل با policy و version history؛ شیء هدف این تسک `Document و Attachment` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: فایل‌ها private by default، اسکن‌شده و از طریق signed URL محدود دریافت شوند.
- قرارداد داده/API: موجودیت‌های `Document, Attachment, DocumentVersion, Folder` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/documents` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `public bucket، malware و افشای فایل` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DOC-12 — اسناد، فایل‌ها و نسخه‌بندی: تست جامع و evidence
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ذخیره و اشتراک فایل با policy و version history؛ شیء هدف این تسک `Document و Attachment` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: فایل‌ها private by default، اسکن‌شده و از طریق signed URL محدود دریافت شوند.
- قرارداد داده/API: موجودیت‌های `Document, Attachment, DocumentVersion, Folder` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/documents` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `public bucket، malware و افشای فایل` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LETTER-01 — نامه‌ها و مکاتبات اداری: کشف invariants و رفتار موجود
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت اندیکاتور، ارجاع، پاراف و بایگانی رسمی؛ شیء هدف این تسک `OfficialLetter` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شماره یکتا باید transactional باشد و متن نهایی و تغییرات دارای history شوند.
- قرارداد داده/API: موجودیت‌های `OfficialLetter, LetterSequence, Referral, Annotation` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/letters` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `شماره تکراری، دستکاری نامه و افشای مکاتبه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LETTER-02 — نامه‌ها و مکاتبات اداری: مدل دامنه و schema
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت اندیکاتور، ارجاع، پاراف و بایگانی رسمی؛ شیء هدف این تسک `OfficialLetter` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شماره یکتا باید transactional باشد و متن نهایی و تغییرات دارای history شوند.
- قرارداد داده/API: موجودیت‌های `OfficialLetter, LetterSequence, Referral, Annotation` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/letters` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `شماره تکراری، دستکاری نامه و افشای مکاتبه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LETTER-03 — نامه‌ها و مکاتبات اداری: migration و rollback
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت اندیکاتور، ارجاع، پاراف و بایگانی رسمی؛ شیء هدف این تسک `OfficialLetter` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شماره یکتا باید transactional باشد و متن نهایی و تغییرات دارای history شوند.
- قرارداد داده/API: موجودیت‌های `OfficialLetter, LetterSequence, Referral, Annotation` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/letters` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `شماره تکراری، دستکاری نامه و افشای مکاتبه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LETTER-04 — نامه‌ها و مکاتبات اداری: repository contract
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت اندیکاتور، ارجاع، پاراف و بایگانی رسمی؛ شیء هدف این تسک `OfficialLetter` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شماره یکتا باید transactional باشد و متن نهایی و تغییرات دارای history شوند.
- قرارداد داده/API: موجودیت‌های `OfficialLetter, LetterSequence, Referral, Annotation` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/letters` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `شماره تکراری، دستکاری نامه و افشای مکاتبه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LETTER-05 — نامه‌ها و مکاتبات اداری: repository پایدار
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت اندیکاتور، ارجاع، پاراف و بایگانی رسمی؛ شیء هدف این تسک `OfficialLetter` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شماره یکتا باید transactional باشد و متن نهایی و تغییرات دارای history شوند.
- قرارداد داده/API: موجودیت‌های `OfficialLetter, LetterSequence, Referral, Annotation` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/letters` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `شماره تکراری، دستکاری نامه و افشای مکاتبه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LETTER-06 — نامه‌ها و مکاتبات اداری: service/use-case
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت اندیکاتور، ارجاع، پاراف و بایگانی رسمی؛ شیء هدف این تسک `OfficialLetter` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شماره یکتا باید transactional باشد و متن نهایی و تغییرات دارای history شوند.
- قرارداد داده/API: موجودیت‌های `OfficialLetter, LetterSequence, Referral, Annotation` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/letters` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `شماره تکراری، دستکاری نامه و افشای مکاتبه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LETTER-07 — نامه‌ها و مکاتبات اداری: API خواندن، فهرست و فیلتر
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت اندیکاتور، ارجاع، پاراف و بایگانی رسمی؛ شیء هدف این تسک `OfficialLetter` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شماره یکتا باید transactional باشد و متن نهایی و تغییرات دارای history شوند.
- قرارداد داده/API: موجودیت‌های `OfficialLetter, LetterSequence, Referral, Annotation` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/letters` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `شماره تکراری، دستکاری نامه و افشای مکاتبه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LETTER-08 — نامه‌ها و مکاتبات اداری: API ایجاد، تغییر و transition
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت اندیکاتور، ارجاع، پاراف و بایگانی رسمی؛ شیء هدف این تسک `OfficialLetter` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شماره یکتا باید transactional باشد و متن نهایی و تغییرات دارای history شوند.
- قرارداد داده/API: موجودیت‌های `OfficialLetter, LetterSequence, Referral, Annotation` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/letters` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `شماره تکراری، دستکاری نامه و افشای مکاتبه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LETTER-09 — نامه‌ها و مکاتبات اداری: concurrency و idempotency
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت اندیکاتور، ارجاع، پاراف و بایگانی رسمی؛ شیء هدف این تسک `OfficialLetter` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شماره یکتا باید transactional باشد و متن نهایی و تغییرات دارای history شوند.
- قرارداد داده/API: موجودیت‌های `OfficialLetter, LetterSequence, Referral, Annotation` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/letters` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `شماره تکراری، دستکاری نامه و افشای مکاتبه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LETTER-10 — نامه‌ها و مکاتبات اداری: authorization و tenant scope
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت اندیکاتور، ارجاع، پاراف و بایگانی رسمی؛ شیء هدف این تسک `OfficialLetter` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شماره یکتا باید transactional باشد و متن نهایی و تغییرات دارای history شوند.
- قرارداد داده/API: موجودیت‌های `OfficialLetter, LetterSequence, Referral, Annotation` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/letters` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `شماره تکراری، دستکاری نامه و افشای مکاتبه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LETTER-11 — نامه‌ها و مکاتبات اداری: vertical slice رابط کاربری
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت اندیکاتور، ارجاع، پاراف و بایگانی رسمی؛ شیء هدف این تسک `OfficialLetter` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شماره یکتا باید transactional باشد و متن نهایی و تغییرات دارای history شوند.
- قرارداد داده/API: موجودیت‌های `OfficialLetter, LetterSequence, Referral, Annotation` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/letters` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `شماره تکراری، دستکاری نامه و افشای مکاتبه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-LETTER-12 — نامه‌ها و مکاتبات اداری: تست جامع و evidence
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبت اندیکاتور، ارجاع، پاراف و بایگانی رسمی؛ شیء هدف این تسک `OfficialLetter` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شماره یکتا باید transactional باشد و متن نهایی و تغییرات دارای history شوند.
- قرارداد داده/API: موجودیت‌های `OfficialLetter, LetterSequence, Referral, Annotation` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/letters` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `شماره تکراری، دستکاری نامه و افشای مکاتبه` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MEET-01 — جلسات، حاضرین و مصوبه: کشف invariants و رفتار موجود
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت چرخه جلسه و تبدیل مصوبه به وظیفه؛ شیء هدف این تسک `Meeting و Resolution` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: جلسه scheduled نباید پیش از تحقق شرایط به completed/signed برود.
- قرارداد داده/API: موجودیت‌های `Meeting, Attendee, Resolution, SignatureRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/meetings` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `امضای نامعتبر و مصوبه بدون مالک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MEET-02 — جلسات، حاضرین و مصوبه: مدل دامنه و schema
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت چرخه جلسه و تبدیل مصوبه به وظیفه؛ شیء هدف این تسک `Meeting و Resolution` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: جلسه scheduled نباید پیش از تحقق شرایط به completed/signed برود.
- قرارداد داده/API: موجودیت‌های `Meeting, Attendee, Resolution, SignatureRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/meetings` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `امضای نامعتبر و مصوبه بدون مالک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MEET-03 — جلسات، حاضرین و مصوبه: migration و rollback
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت چرخه جلسه و تبدیل مصوبه به وظیفه؛ شیء هدف این تسک `Meeting و Resolution` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: جلسه scheduled نباید پیش از تحقق شرایط به completed/signed برود.
- قرارداد داده/API: موجودیت‌های `Meeting, Attendee, Resolution, SignatureRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/meetings` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `امضای نامعتبر و مصوبه بدون مالک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MEET-04 — جلسات، حاضرین و مصوبه: repository contract
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت چرخه جلسه و تبدیل مصوبه به وظیفه؛ شیء هدف این تسک `Meeting و Resolution` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: جلسه scheduled نباید پیش از تحقق شرایط به completed/signed برود.
- قرارداد داده/API: موجودیت‌های `Meeting, Attendee, Resolution, SignatureRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/meetings` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `امضای نامعتبر و مصوبه بدون مالک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MEET-05 — جلسات، حاضرین و مصوبه: repository پایدار
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت چرخه جلسه و تبدیل مصوبه به وظیفه؛ شیء هدف این تسک `Meeting و Resolution` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: جلسه scheduled نباید پیش از تحقق شرایط به completed/signed برود.
- قرارداد داده/API: موجودیت‌های `Meeting, Attendee, Resolution, SignatureRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/meetings` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `امضای نامعتبر و مصوبه بدون مالک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MEET-06 — جلسات، حاضرین و مصوبه: service/use-case
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت چرخه جلسه و تبدیل مصوبه به وظیفه؛ شیء هدف این تسک `Meeting و Resolution` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: جلسه scheduled نباید پیش از تحقق شرایط به completed/signed برود.
- قرارداد داده/API: موجودیت‌های `Meeting, Attendee, Resolution, SignatureRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/meetings` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `امضای نامعتبر و مصوبه بدون مالک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MEET-07 — جلسات، حاضرین و مصوبه: API خواندن، فهرست و فیلتر
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت چرخه جلسه و تبدیل مصوبه به وظیفه؛ شیء هدف این تسک `Meeting و Resolution` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: جلسه scheduled نباید پیش از تحقق شرایط به completed/signed برود.
- قرارداد داده/API: موجودیت‌های `Meeting, Attendee, Resolution, SignatureRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/meetings` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `امضای نامعتبر و مصوبه بدون مالک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MEET-08 — جلسات، حاضرین و مصوبه: API ایجاد، تغییر و transition
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت چرخه جلسه و تبدیل مصوبه به وظیفه؛ شیء هدف این تسک `Meeting و Resolution` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: جلسه scheduled نباید پیش از تحقق شرایط به completed/signed برود.
- قرارداد داده/API: موجودیت‌های `Meeting, Attendee, Resolution, SignatureRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/meetings` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `امضای نامعتبر و مصوبه بدون مالک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MEET-09 — جلسات، حاضرین و مصوبه: concurrency و idempotency
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت چرخه جلسه و تبدیل مصوبه به وظیفه؛ شیء هدف این تسک `Meeting و Resolution` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: جلسه scheduled نباید پیش از تحقق شرایط به completed/signed برود.
- قرارداد داده/API: موجودیت‌های `Meeting, Attendee, Resolution, SignatureRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/meetings` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `امضای نامعتبر و مصوبه بدون مالک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MEET-10 — جلسات، حاضرین و مصوبه: authorization و tenant scope
- فاز: `P08`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت چرخه جلسه و تبدیل مصوبه به وظیفه؛ شیء هدف این تسک `Meeting و Resolution` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: جلسه scheduled نباید پیش از تحقق شرایط به completed/signed برود.
- قرارداد داده/API: موجودیت‌های `Meeting, Attendee, Resolution, SignatureRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/meetings` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `امضای نامعتبر و مصوبه بدون مالک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MEET-11 — جلسات، حاضرین و مصوبه: vertical slice رابط کاربری
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت چرخه جلسه و تبدیل مصوبه به وظیفه؛ شیء هدف این تسک `Meeting و Resolution` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: جلسه scheduled نباید پیش از تحقق شرایط به completed/signed برود.
- قرارداد داده/API: موجودیت‌های `Meeting, Attendee, Resolution, SignatureRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/meetings` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `امضای نامعتبر و مصوبه بدون مالک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MEET-12 — جلسات، حاضرین و مصوبه: تست جامع و evidence
- فاز: `P08`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: مدیریت چرخه جلسه و تبدیل مصوبه به وظیفه؛ شیء هدف این تسک `Meeting و Resolution` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: جلسه scheduled نباید پیش از تحقق شرایط به completed/signed برود.
- قرارداد داده/API: موجودیت‌های `Meeting, Attendee, Resolution, SignatureRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/office/meetings` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `امضای نامعتبر و مصوبه بدون مالک` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P08 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTO-01 — اتوماسیون و گردش‌کار: کشف invariants و رفتار موجود
- فاز: `P09`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اجرای قابل مشاهده، idempotent و قابل توقف قوانین؛ شیء هدف این تسک `WorkflowDefinition و WorkflowRun` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: dry-run، loop protection، per-tenant quota و fail-safe kill switch اجباری است.
- قرارداد داده/API: موجودیت‌های `WorkflowDefinition, WorkflowRun, WorkflowStep, RuleVersion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/automation/workflows` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `loop، side-effect تکراری و اجرای cross-tenant` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTO-02 — اتوماسیون و گردش‌کار: مدل دامنه و schema
- فاز: `P09`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اجرای قابل مشاهده، idempotent و قابل توقف قوانین؛ شیء هدف این تسک `WorkflowDefinition و WorkflowRun` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: dry-run، loop protection، per-tenant quota و fail-safe kill switch اجباری است.
- قرارداد داده/API: موجودیت‌های `WorkflowDefinition, WorkflowRun, WorkflowStep, RuleVersion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/automation/workflows` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `loop، side-effect تکراری و اجرای cross-tenant` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTO-03 — اتوماسیون و گردش‌کار: migration و rollback
- فاز: `P09`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اجرای قابل مشاهده، idempotent و قابل توقف قوانین؛ شیء هدف این تسک `WorkflowDefinition و WorkflowRun` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: dry-run، loop protection، per-tenant quota و fail-safe kill switch اجباری است.
- قرارداد داده/API: موجودیت‌های `WorkflowDefinition, WorkflowRun, WorkflowStep, RuleVersion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/automation/workflows` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `loop، side-effect تکراری و اجرای cross-tenant` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTO-04 — اتوماسیون و گردش‌کار: repository contract
- فاز: `P09`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اجرای قابل مشاهده، idempotent و قابل توقف قوانین؛ شیء هدف این تسک `WorkflowDefinition و WorkflowRun` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: dry-run، loop protection، per-tenant quota و fail-safe kill switch اجباری است.
- قرارداد داده/API: موجودیت‌های `WorkflowDefinition, WorkflowRun, WorkflowStep, RuleVersion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/automation/workflows` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `loop، side-effect تکراری و اجرای cross-tenant` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTO-05 — اتوماسیون و گردش‌کار: repository پایدار
- فاز: `P09`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اجرای قابل مشاهده، idempotent و قابل توقف قوانین؛ شیء هدف این تسک `WorkflowDefinition و WorkflowRun` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: dry-run، loop protection، per-tenant quota و fail-safe kill switch اجباری است.
- قرارداد داده/API: موجودیت‌های `WorkflowDefinition, WorkflowRun, WorkflowStep, RuleVersion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/automation/workflows` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `loop، side-effect تکراری و اجرای cross-tenant` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTO-06 — اتوماسیون و گردش‌کار: service/use-case
- فاز: `P09`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اجرای قابل مشاهده، idempotent و قابل توقف قوانین؛ شیء هدف این تسک `WorkflowDefinition و WorkflowRun` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: dry-run، loop protection، per-tenant quota و fail-safe kill switch اجباری است.
- قرارداد داده/API: موجودیت‌های `WorkflowDefinition, WorkflowRun, WorkflowStep, RuleVersion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/automation/workflows` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `loop، side-effect تکراری و اجرای cross-tenant` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTO-07 — اتوماسیون و گردش‌کار: API خواندن، فهرست و فیلتر
- فاز: `P09`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اجرای قابل مشاهده، idempotent و قابل توقف قوانین؛ شیء هدف این تسک `WorkflowDefinition و WorkflowRun` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: dry-run، loop protection، per-tenant quota و fail-safe kill switch اجباری است.
- قرارداد داده/API: موجودیت‌های `WorkflowDefinition, WorkflowRun, WorkflowStep, RuleVersion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/automation/workflows` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `loop، side-effect تکراری و اجرای cross-tenant` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTO-08 — اتوماسیون و گردش‌کار: API ایجاد، تغییر و transition
- فاز: `P09`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اجرای قابل مشاهده، idempotent و قابل توقف قوانین؛ شیء هدف این تسک `WorkflowDefinition و WorkflowRun` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: dry-run، loop protection، per-tenant quota و fail-safe kill switch اجباری است.
- قرارداد داده/API: موجودیت‌های `WorkflowDefinition, WorkflowRun, WorkflowStep, RuleVersion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/automation/workflows` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `loop، side-effect تکراری و اجرای cross-tenant` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTO-09 — اتوماسیون و گردش‌کار: concurrency و idempotency
- فاز: `P09`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اجرای قابل مشاهده، idempotent و قابل توقف قوانین؛ شیء هدف این تسک `WorkflowDefinition و WorkflowRun` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: dry-run، loop protection، per-tenant quota و fail-safe kill switch اجباری است.
- قرارداد داده/API: موجودیت‌های `WorkflowDefinition, WorkflowRun, WorkflowStep, RuleVersion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/automation/workflows` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `loop، side-effect تکراری و اجرای cross-tenant` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTO-10 — اتوماسیون و گردش‌کار: authorization و tenant scope
- فاز: `P09`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اجرای قابل مشاهده، idempotent و قابل توقف قوانین؛ شیء هدف این تسک `WorkflowDefinition و WorkflowRun` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: dry-run، loop protection، per-tenant quota و fail-safe kill switch اجباری است.
- قرارداد داده/API: موجودیت‌های `WorkflowDefinition, WorkflowRun, WorkflowStep, RuleVersion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/automation/workflows` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `loop، side-effect تکراری و اجرای cross-tenant` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTO-11 — اتوماسیون و گردش‌کار: vertical slice رابط کاربری
- فاز: `P09`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اجرای قابل مشاهده، idempotent و قابل توقف قوانین؛ شیء هدف این تسک `WorkflowDefinition و WorkflowRun` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: dry-run، loop protection، per-tenant quota و fail-safe kill switch اجباری است.
- قرارداد داده/API: موجودیت‌های `WorkflowDefinition, WorkflowRun, WorkflowStep, RuleVersion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/automation/workflows` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `loop، side-effect تکراری و اجرای cross-tenant` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUTO-12 — اتوماسیون و گردش‌کار: تست جامع و evidence
- فاز: `P09`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اجرای قابل مشاهده، idempotent و قابل توقف قوانین؛ شیء هدف این تسک `WorkflowDefinition و WorkflowRun` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: dry-run، loop protection، per-tenant quota و fail-safe kill switch اجباری است.
- قرارداد داده/API: موجودیت‌های `WorkflowDefinition, WorkflowRun, WorkflowStep, RuleVersion` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/automation/workflows` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `loop، side-effect تکراری و اجرای cross-tenant` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-NOTIF-01 — اعلان‌ها و ترجیحات ارتباطی: کشف invariants و رفتار موجود
- فاز: `P09`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اعلان قابل ردیابی و قابل کنترل از چند کانال؛ شیء هدف این تسک `Notification` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تحویل بیرونی از transactional outbox و retry policy استفاده کند.
- قرارداد داده/API: موجودیت‌های `Notification, NotificationPreference, DeliveryAttempt` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/inbox/notifications` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `اعلان تکراری، PII leak و spam` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-NOTIF-02 — اعلان‌ها و ترجیحات ارتباطی: مدل دامنه و schema
- فاز: `P09`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اعلان قابل ردیابی و قابل کنترل از چند کانال؛ شیء هدف این تسک `Notification` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تحویل بیرونی از transactional outbox و retry policy استفاده کند.
- قرارداد داده/API: موجودیت‌های `Notification, NotificationPreference, DeliveryAttempt` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/inbox/notifications` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `اعلان تکراری، PII leak و spam` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-NOTIF-03 — اعلان‌ها و ترجیحات ارتباطی: migration و rollback
- فاز: `P09`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اعلان قابل ردیابی و قابل کنترل از چند کانال؛ شیء هدف این تسک `Notification` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تحویل بیرونی از transactional outbox و retry policy استفاده کند.
- قرارداد داده/API: موجودیت‌های `Notification, NotificationPreference, DeliveryAttempt` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/inbox/notifications` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `اعلان تکراری، PII leak و spam` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-NOTIF-04 — اعلان‌ها و ترجیحات ارتباطی: repository contract
- فاز: `P09`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اعلان قابل ردیابی و قابل کنترل از چند کانال؛ شیء هدف این تسک `Notification` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تحویل بیرونی از transactional outbox و retry policy استفاده کند.
- قرارداد داده/API: موجودیت‌های `Notification, NotificationPreference, DeliveryAttempt` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/inbox/notifications` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `اعلان تکراری، PII leak و spam` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-NOTIF-05 — اعلان‌ها و ترجیحات ارتباطی: repository پایدار
- فاز: `P09`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اعلان قابل ردیابی و قابل کنترل از چند کانال؛ شیء هدف این تسک `Notification` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تحویل بیرونی از transactional outbox و retry policy استفاده کند.
- قرارداد داده/API: موجودیت‌های `Notification, NotificationPreference, DeliveryAttempt` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/inbox/notifications` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `اعلان تکراری، PII leak و spam` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-NOTIF-06 — اعلان‌ها و ترجیحات ارتباطی: service/use-case
- فاز: `P09`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اعلان قابل ردیابی و قابل کنترل از چند کانال؛ شیء هدف این تسک `Notification` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تحویل بیرونی از transactional outbox و retry policy استفاده کند.
- قرارداد داده/API: موجودیت‌های `Notification, NotificationPreference, DeliveryAttempt` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/inbox/notifications` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `اعلان تکراری، PII leak و spam` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-NOTIF-07 — اعلان‌ها و ترجیحات ارتباطی: API خواندن، فهرست و فیلتر
- فاز: `P09`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اعلان قابل ردیابی و قابل کنترل از چند کانال؛ شیء هدف این تسک `Notification` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تحویل بیرونی از transactional outbox و retry policy استفاده کند.
- قرارداد داده/API: موجودیت‌های `Notification, NotificationPreference, DeliveryAttempt` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/inbox/notifications` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `اعلان تکراری، PII leak و spam` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-NOTIF-08 — اعلان‌ها و ترجیحات ارتباطی: API ایجاد، تغییر و transition
- فاز: `P09`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اعلان قابل ردیابی و قابل کنترل از چند کانال؛ شیء هدف این تسک `Notification` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تحویل بیرونی از transactional outbox و retry policy استفاده کند.
- قرارداد داده/API: موجودیت‌های `Notification, NotificationPreference, DeliveryAttempt` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/inbox/notifications` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `اعلان تکراری، PII leak و spam` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-NOTIF-09 — اعلان‌ها و ترجیحات ارتباطی: concurrency و idempotency
- فاز: `P09`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اعلان قابل ردیابی و قابل کنترل از چند کانال؛ شیء هدف این تسک `Notification` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تحویل بیرونی از transactional outbox و retry policy استفاده کند.
- قرارداد داده/API: موجودیت‌های `Notification, NotificationPreference, DeliveryAttempt` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/inbox/notifications` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `اعلان تکراری، PII leak و spam` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-NOTIF-10 — اعلان‌ها و ترجیحات ارتباطی: authorization و tenant scope
- فاز: `P09`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اعلان قابل ردیابی و قابل کنترل از چند کانال؛ شیء هدف این تسک `Notification` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تحویل بیرونی از transactional outbox و retry policy استفاده کند.
- قرارداد داده/API: موجودیت‌های `Notification, NotificationPreference, DeliveryAttempt` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/inbox/notifications` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `اعلان تکراری، PII leak و spam` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-NOTIF-11 — اعلان‌ها و ترجیحات ارتباطی: vertical slice رابط کاربری
- فاز: `P09`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اعلان قابل ردیابی و قابل کنترل از چند کانال؛ شیء هدف این تسک `Notification` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تحویل بیرونی از transactional outbox و retry policy استفاده کند.
- قرارداد داده/API: موجودیت‌های `Notification, NotificationPreference, DeliveryAttempt` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/inbox/notifications` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `اعلان تکراری، PII leak و spam` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-NOTIF-12 — اعلان‌ها و ترجیحات ارتباطی: تست جامع و evidence
- فاز: `P09`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اعلان قابل ردیابی و قابل کنترل از چند کانال؛ شیء هدف این تسک `Notification` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تحویل بیرونی از transactional outbox و retry policy استفاده کند.
- قرارداد داده/API: موجودیت‌های `Notification, NotificationPreference, DeliveryAttempt` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/inbox/notifications` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `اعلان تکراری، PII leak و spam` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P09 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SEARCH-01 — جست‌وجوی سراسری و saved views: کشف invariants و رفتار موجود
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جست‌وجوی سریع اما policy-aware روی تمام دامنه‌ها؛ شیء هدف این تسک `SearchDocument و SavedView` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: index query باید tenant و authorization filter را حفظ کند.
- قرارداد داده/API: موجودیت‌های `SearchDocument, SearchIndexJob, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/search` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای snippetهای غیرمجاز و نتایج stale` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SEARCH-02 — جست‌وجوی سراسری و saved views: مدل دامنه و schema
- فاز: `P10`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جست‌وجوی سریع اما policy-aware روی تمام دامنه‌ها؛ شیء هدف این تسک `SearchDocument و SavedView` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: index query باید tenant و authorization filter را حفظ کند.
- قرارداد داده/API: موجودیت‌های `SearchDocument, SearchIndexJob, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/search` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای snippetهای غیرمجاز و نتایج stale` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SEARCH-03 — جست‌وجوی سراسری و saved views: migration و rollback
- فاز: `P10`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جست‌وجوی سریع اما policy-aware روی تمام دامنه‌ها؛ شیء هدف این تسک `SearchDocument و SavedView` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: index query باید tenant و authorization filter را حفظ کند.
- قرارداد داده/API: موجودیت‌های `SearchDocument, SearchIndexJob, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/search` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای snippetهای غیرمجاز و نتایج stale` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SEARCH-04 — جست‌وجوی سراسری و saved views: repository contract
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جست‌وجوی سریع اما policy-aware روی تمام دامنه‌ها؛ شیء هدف این تسک `SearchDocument و SavedView` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: index query باید tenant و authorization filter را حفظ کند.
- قرارداد داده/API: موجودیت‌های `SearchDocument, SearchIndexJob, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/search` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای snippetهای غیرمجاز و نتایج stale` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SEARCH-05 — جست‌وجوی سراسری و saved views: repository پایدار
- فاز: `P10`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جست‌وجوی سریع اما policy-aware روی تمام دامنه‌ها؛ شیء هدف این تسک `SearchDocument و SavedView` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: index query باید tenant و authorization filter را حفظ کند.
- قرارداد داده/API: موجودیت‌های `SearchDocument, SearchIndexJob, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/search` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای snippetهای غیرمجاز و نتایج stale` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SEARCH-06 — جست‌وجوی سراسری و saved views: service/use-case
- فاز: `P10`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جست‌وجوی سریع اما policy-aware روی تمام دامنه‌ها؛ شیء هدف این تسک `SearchDocument و SavedView` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: index query باید tenant و authorization filter را حفظ کند.
- قرارداد داده/API: موجودیت‌های `SearchDocument, SearchIndexJob, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/search` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای snippetهای غیرمجاز و نتایج stale` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SEARCH-07 — جست‌وجوی سراسری و saved views: API خواندن، فهرست و فیلتر
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جست‌وجوی سریع اما policy-aware روی تمام دامنه‌ها؛ شیء هدف این تسک `SearchDocument و SavedView` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: index query باید tenant و authorization filter را حفظ کند.
- قرارداد داده/API: موجودیت‌های `SearchDocument, SearchIndexJob, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/search` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای snippetهای غیرمجاز و نتایج stale` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SEARCH-08 — جست‌وجوی سراسری و saved views: API ایجاد، تغییر و transition
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جست‌وجوی سریع اما policy-aware روی تمام دامنه‌ها؛ شیء هدف این تسک `SearchDocument و SavedView` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: index query باید tenant و authorization filter را حفظ کند.
- قرارداد داده/API: موجودیت‌های `SearchDocument, SearchIndexJob, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/search` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای snippetهای غیرمجاز و نتایج stale` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SEARCH-09 — جست‌وجوی سراسری و saved views: concurrency و idempotency
- فاز: `P10`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جست‌وجوی سریع اما policy-aware روی تمام دامنه‌ها؛ شیء هدف این تسک `SearchDocument و SavedView` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: index query باید tenant و authorization filter را حفظ کند.
- قرارداد داده/API: موجودیت‌های `SearchDocument, SearchIndexJob, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/search` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای snippetهای غیرمجاز و نتایج stale` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SEARCH-10 — جست‌وجوی سراسری و saved views: authorization و tenant scope
- فاز: `P10`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جست‌وجوی سریع اما policy-aware روی تمام دامنه‌ها؛ شیء هدف این تسک `SearchDocument و SavedView` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: index query باید tenant و authorization filter را حفظ کند.
- قرارداد داده/API: موجودیت‌های `SearchDocument, SearchIndexJob, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/search` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای snippetهای غیرمجاز و نتایج stale` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SEARCH-11 — جست‌وجوی سراسری و saved views: vertical slice رابط کاربری
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جست‌وجوی سریع اما policy-aware روی تمام دامنه‌ها؛ شیء هدف این تسک `SearchDocument و SavedView` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: index query باید tenant و authorization filter را حفظ کند.
- قرارداد داده/API: موجودیت‌های `SearchDocument, SearchIndexJob, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/search` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای snippetهای غیرمجاز و نتایج stale` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-SEARCH-12 — جست‌وجوی سراسری و saved views: تست جامع و evidence
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جست‌وجوی سریع اما policy-aware روی تمام دامنه‌ها؛ شیء هدف این تسک `SearchDocument و SavedView` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: index query باید tenant و authorization filter را حفظ کند.
- قرارداد داده/API: موجودیت‌های `SearchDocument, SearchIndexJob, SavedView` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/search` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `افشای snippetهای غیرمجاز و نتایج stale` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-REPORT-01 — گزارش‌ها، KPI و داشبورد: کشف invariants و رفتار موجود
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: شاخص قابل تعریف، قابل ردیابی و مطابق واقعیت مالی/عملیاتی؛ شیء هدف این تسک `ReportDefinition و KPI` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر KPI باید فرمول، timezone، cohort، freshness و data owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `ReportDefinition, ReportRun, KPIValue, DashboardWidget` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/reports` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `metric drift و تصمیم‌گیری با داده نادرست` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-REPORT-02 — گزارش‌ها، KPI و داشبورد: مدل دامنه و schema
- فاز: `P10`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: شاخص قابل تعریف، قابل ردیابی و مطابق واقعیت مالی/عملیاتی؛ شیء هدف این تسک `ReportDefinition و KPI` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر KPI باید فرمول، timezone، cohort، freshness و data owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `ReportDefinition, ReportRun, KPIValue, DashboardWidget` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/reports` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `metric drift و تصمیم‌گیری با داده نادرست` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-REPORT-03 — گزارش‌ها، KPI و داشبورد: migration و rollback
- فاز: `P10`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: شاخص قابل تعریف، قابل ردیابی و مطابق واقعیت مالی/عملیاتی؛ شیء هدف این تسک `ReportDefinition و KPI` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر KPI باید فرمول، timezone، cohort، freshness و data owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `ReportDefinition, ReportRun, KPIValue, DashboardWidget` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/reports` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `metric drift و تصمیم‌گیری با داده نادرست` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-REPORT-04 — گزارش‌ها، KPI و داشبورد: repository contract
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: شاخص قابل تعریف، قابل ردیابی و مطابق واقعیت مالی/عملیاتی؛ شیء هدف این تسک `ReportDefinition و KPI` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر KPI باید فرمول، timezone، cohort، freshness و data owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `ReportDefinition, ReportRun, KPIValue, DashboardWidget` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/reports` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `metric drift و تصمیم‌گیری با داده نادرست` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-REPORT-05 — گزارش‌ها، KPI و داشبورد: repository پایدار
- فاز: `P10`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: شاخص قابل تعریف، قابل ردیابی و مطابق واقعیت مالی/عملیاتی؛ شیء هدف این تسک `ReportDefinition و KPI` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر KPI باید فرمول، timezone، cohort، freshness و data owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `ReportDefinition, ReportRun, KPIValue, DashboardWidget` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/reports` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `metric drift و تصمیم‌گیری با داده نادرست` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-REPORT-06 — گزارش‌ها، KPI و داشبورد: service/use-case
- فاز: `P10`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: شاخص قابل تعریف، قابل ردیابی و مطابق واقعیت مالی/عملیاتی؛ شیء هدف این تسک `ReportDefinition و KPI` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر KPI باید فرمول، timezone، cohort، freshness و data owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `ReportDefinition, ReportRun, KPIValue, DashboardWidget` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/reports` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `metric drift و تصمیم‌گیری با داده نادرست` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-REPORT-07 — گزارش‌ها، KPI و داشبورد: API خواندن، فهرست و فیلتر
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: شاخص قابل تعریف، قابل ردیابی و مطابق واقعیت مالی/عملیاتی؛ شیء هدف این تسک `ReportDefinition و KPI` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر KPI باید فرمول، timezone، cohort، freshness و data owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `ReportDefinition, ReportRun, KPIValue, DashboardWidget` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/reports` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `metric drift و تصمیم‌گیری با داده نادرست` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-REPORT-08 — گزارش‌ها، KPI و داشبورد: API ایجاد، تغییر و transition
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: شاخص قابل تعریف، قابل ردیابی و مطابق واقعیت مالی/عملیاتی؛ شیء هدف این تسک `ReportDefinition و KPI` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر KPI باید فرمول، timezone، cohort، freshness و data owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `ReportDefinition, ReportRun, KPIValue, DashboardWidget` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/reports` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `metric drift و تصمیم‌گیری با داده نادرست` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-REPORT-09 — گزارش‌ها، KPI و داشبورد: concurrency و idempotency
- فاز: `P10`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: شاخص قابل تعریف، قابل ردیابی و مطابق واقعیت مالی/عملیاتی؛ شیء هدف این تسک `ReportDefinition و KPI` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر KPI باید فرمول، timezone، cohort، freshness و data owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `ReportDefinition, ReportRun, KPIValue, DashboardWidget` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/reports` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `metric drift و تصمیم‌گیری با داده نادرست` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-REPORT-10 — گزارش‌ها، KPI و داشبورد: authorization و tenant scope
- فاز: `P10`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: شاخص قابل تعریف، قابل ردیابی و مطابق واقعیت مالی/عملیاتی؛ شیء هدف این تسک `ReportDefinition و KPI` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر KPI باید فرمول، timezone، cohort، freshness و data owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `ReportDefinition, ReportRun, KPIValue, DashboardWidget` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/reports` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `metric drift و تصمیم‌گیری با داده نادرست` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-REPORT-11 — گزارش‌ها، KPI و داشبورد: vertical slice رابط کاربری
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: شاخص قابل تعریف، قابل ردیابی و مطابق واقعیت مالی/عملیاتی؛ شیء هدف این تسک `ReportDefinition و KPI` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر KPI باید فرمول، timezone، cohort، freshness و data owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `ReportDefinition, ReportRun, KPIValue, DashboardWidget` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/reports` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `metric drift و تصمیم‌گیری با داده نادرست` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-REPORT-12 — گزارش‌ها، KPI و داشبورد: تست جامع و evidence
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: شاخص قابل تعریف، قابل ردیابی و مطابق واقعیت مالی/عملیاتی؛ شیء هدف این تسک `ReportDefinition و KPI` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر KPI باید فرمول، timezone، cohort، freshness و data owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `ReportDefinition, ReportRun, KPIValue, DashboardWidget` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/reports` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `metric drift و تصمیم‌گیری با داده نادرست` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUDIT-01 — Audit log، compliance و حریم خصوصی: کشف invariants و رفتار موجود
- فاز: `P10`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردپای تغییرات، نگهداری داده و پاسخگویی به رخداد؛ شیء هدف این تسک `AuditEvent و DataSubjectRequest` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: audit event append-only باشد و secret/PII اضافی ذخیره نکند.
- قرارداد داده/API: موجودیت‌های `AuditEvent, RetentionPolicy, DataSubjectRequest` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/audit-log` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ردپای ناقص، tampering و نقض حریم خصوصی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUDIT-02 — Audit log، compliance و حریم خصوصی: مدل دامنه و schema
- فاز: `P10`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردپای تغییرات، نگهداری داده و پاسخگویی به رخداد؛ شیء هدف این تسک `AuditEvent و DataSubjectRequest` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: audit event append-only باشد و secret/PII اضافی ذخیره نکند.
- قرارداد داده/API: موجودیت‌های `AuditEvent, RetentionPolicy, DataSubjectRequest` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/audit-log` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ردپای ناقص، tampering و نقض حریم خصوصی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUDIT-03 — Audit log، compliance و حریم خصوصی: migration و rollback
- فاز: `P10`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردپای تغییرات، نگهداری داده و پاسخگویی به رخداد؛ شیء هدف این تسک `AuditEvent و DataSubjectRequest` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: audit event append-only باشد و secret/PII اضافی ذخیره نکند.
- قرارداد داده/API: موجودیت‌های `AuditEvent, RetentionPolicy, DataSubjectRequest` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/audit-log` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ردپای ناقص، tampering و نقض حریم خصوصی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUDIT-04 — Audit log، compliance و حریم خصوصی: repository contract
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردپای تغییرات، نگهداری داده و پاسخگویی به رخداد؛ شیء هدف این تسک `AuditEvent و DataSubjectRequest` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: audit event append-only باشد و secret/PII اضافی ذخیره نکند.
- قرارداد داده/API: موجودیت‌های `AuditEvent, RetentionPolicy, DataSubjectRequest` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/audit-log` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ردپای ناقص، tampering و نقض حریم خصوصی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUDIT-05 — Audit log، compliance و حریم خصوصی: repository پایدار
- فاز: `P10`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردپای تغییرات، نگهداری داده و پاسخگویی به رخداد؛ شیء هدف این تسک `AuditEvent و DataSubjectRequest` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: audit event append-only باشد و secret/PII اضافی ذخیره نکند.
- قرارداد داده/API: موجودیت‌های `AuditEvent, RetentionPolicy, DataSubjectRequest` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/audit-log` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ردپای ناقص، tampering و نقض حریم خصوصی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUDIT-06 — Audit log، compliance و حریم خصوصی: service/use-case
- فاز: `P10`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردپای تغییرات، نگهداری داده و پاسخگویی به رخداد؛ شیء هدف این تسک `AuditEvent و DataSubjectRequest` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: audit event append-only باشد و secret/PII اضافی ذخیره نکند.
- قرارداد داده/API: موجودیت‌های `AuditEvent, RetentionPolicy, DataSubjectRequest` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/audit-log` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ردپای ناقص، tampering و نقض حریم خصوصی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUDIT-07 — Audit log، compliance و حریم خصوصی: API خواندن، فهرست و فیلتر
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردپای تغییرات، نگهداری داده و پاسخگویی به رخداد؛ شیء هدف این تسک `AuditEvent و DataSubjectRequest` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: audit event append-only باشد و secret/PII اضافی ذخیره نکند.
- قرارداد داده/API: موجودیت‌های `AuditEvent, RetentionPolicy, DataSubjectRequest` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/audit-log` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ردپای ناقص، tampering و نقض حریم خصوصی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUDIT-08 — Audit log، compliance و حریم خصوصی: API ایجاد، تغییر و transition
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردپای تغییرات، نگهداری داده و پاسخگویی به رخداد؛ شیء هدف این تسک `AuditEvent و DataSubjectRequest` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: audit event append-only باشد و secret/PII اضافی ذخیره نکند.
- قرارداد داده/API: موجودیت‌های `AuditEvent, RetentionPolicy, DataSubjectRequest` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/audit-log` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ردپای ناقص، tampering و نقض حریم خصوصی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUDIT-09 — Audit log، compliance و حریم خصوصی: concurrency و idempotency
- فاز: `P10`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردپای تغییرات، نگهداری داده و پاسخگویی به رخداد؛ شیء هدف این تسک `AuditEvent و DataSubjectRequest` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: audit event append-only باشد و secret/PII اضافی ذخیره نکند.
- قرارداد داده/API: موجودیت‌های `AuditEvent, RetentionPolicy, DataSubjectRequest` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/audit-log` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ردپای ناقص، tampering و نقض حریم خصوصی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUDIT-10 — Audit log، compliance و حریم خصوصی: authorization و tenant scope
- فاز: `P10`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردپای تغییرات، نگهداری داده و پاسخگویی به رخداد؛ شیء هدف این تسک `AuditEvent و DataSubjectRequest` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: audit event append-only باشد و secret/PII اضافی ذخیره نکند.
- قرارداد داده/API: موجودیت‌های `AuditEvent, RetentionPolicy, DataSubjectRequest` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/audit-log` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ردپای ناقص، tampering و نقض حریم خصوصی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUDIT-11 — Audit log، compliance و حریم خصوصی: vertical slice رابط کاربری
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردپای تغییرات، نگهداری داده و پاسخگویی به رخداد؛ شیء هدف این تسک `AuditEvent و DataSubjectRequest` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: audit event append-only باشد و secret/PII اضافی ذخیره نکند.
- قرارداد داده/API: موجودیت‌های `AuditEvent, RetentionPolicy, DataSubjectRequest` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/audit-log` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ردپای ناقص، tampering و نقض حریم خصوصی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-AUDIT-12 — Audit log، compliance و حریم خصوصی: تست جامع و evidence
- فاز: `P10`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ردپای تغییرات، نگهداری داده و پاسخگویی به رخداد؛ شیء هدف این تسک `AuditEvent و DataSubjectRequest` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: audit event append-only باشد و secret/PII اضافی ذخیره نکند.
- قرارداد داده/API: موجودیت‌های `AuditEvent, RetentionPolicy, DataSubjectRequest` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/audit-log` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ردپای ناقص، tampering و نقض حریم خصوصی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P10 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-INTEG-01 — API، webhooks و integrations: کشف invariants و رفتار موجود
- فاز: `P11`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اتصال امن به سیستم‌های خارجی و retry قابل مشاهده؛ شیء هدف این تسک `IntegrationConnection و WebhookDelivery` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: SSRF protection، signature verification، allowlist egress و replay protection اجباری است.
- قرارداد داده/API: موجودیت‌های `IntegrationConnection, ApiCredential, WebhookEndpoint, Delivery` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/integrations` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `SSRF، webhook spoofing و credential leakage` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-INTEG-02 — API، webhooks و integrations: مدل دامنه و schema
- فاز: `P11`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اتصال امن به سیستم‌های خارجی و retry قابل مشاهده؛ شیء هدف این تسک `IntegrationConnection و WebhookDelivery` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: SSRF protection، signature verification، allowlist egress و replay protection اجباری است.
- قرارداد داده/API: موجودیت‌های `IntegrationConnection, ApiCredential, WebhookEndpoint, Delivery` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/integrations` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `SSRF، webhook spoofing و credential leakage` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-INTEG-03 — API، webhooks و integrations: migration و rollback
- فاز: `P11`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اتصال امن به سیستم‌های خارجی و retry قابل مشاهده؛ شیء هدف این تسک `IntegrationConnection و WebhookDelivery` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: SSRF protection، signature verification، allowlist egress و replay protection اجباری است.
- قرارداد داده/API: موجودیت‌های `IntegrationConnection, ApiCredential, WebhookEndpoint, Delivery` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/integrations` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `SSRF، webhook spoofing و credential leakage` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-INTEG-04 — API، webhooks و integrations: repository contract
- فاز: `P11`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اتصال امن به سیستم‌های خارجی و retry قابل مشاهده؛ شیء هدف این تسک `IntegrationConnection و WebhookDelivery` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: SSRF protection، signature verification، allowlist egress و replay protection اجباری است.
- قرارداد داده/API: موجودیت‌های `IntegrationConnection, ApiCredential, WebhookEndpoint, Delivery` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/integrations` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `SSRF، webhook spoofing و credential leakage` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-INTEG-05 — API، webhooks و integrations: repository پایدار
- فاز: `P11`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اتصال امن به سیستم‌های خارجی و retry قابل مشاهده؛ شیء هدف این تسک `IntegrationConnection و WebhookDelivery` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: SSRF protection، signature verification، allowlist egress و replay protection اجباری است.
- قرارداد داده/API: موجودیت‌های `IntegrationConnection, ApiCredential, WebhookEndpoint, Delivery` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/integrations` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `SSRF، webhook spoofing و credential leakage` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-INTEG-06 — API، webhooks و integrations: service/use-case
- فاز: `P11`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اتصال امن به سیستم‌های خارجی و retry قابل مشاهده؛ شیء هدف این تسک `IntegrationConnection و WebhookDelivery` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: SSRF protection، signature verification، allowlist egress و replay protection اجباری است.
- قرارداد داده/API: موجودیت‌های `IntegrationConnection, ApiCredential, WebhookEndpoint, Delivery` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/integrations` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `SSRF، webhook spoofing و credential leakage` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-INTEG-07 — API، webhooks و integrations: API خواندن، فهرست و فیلتر
- فاز: `P11`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اتصال امن به سیستم‌های خارجی و retry قابل مشاهده؛ شیء هدف این تسک `IntegrationConnection و WebhookDelivery` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: SSRF protection، signature verification، allowlist egress و replay protection اجباری است.
- قرارداد داده/API: موجودیت‌های `IntegrationConnection, ApiCredential, WebhookEndpoint, Delivery` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/integrations` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `SSRF، webhook spoofing و credential leakage` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-INTEG-08 — API، webhooks و integrations: API ایجاد، تغییر و transition
- فاز: `P11`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اتصال امن به سیستم‌های خارجی و retry قابل مشاهده؛ شیء هدف این تسک `IntegrationConnection و WebhookDelivery` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: SSRF protection، signature verification، allowlist egress و replay protection اجباری است.
- قرارداد داده/API: موجودیت‌های `IntegrationConnection, ApiCredential, WebhookEndpoint, Delivery` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/integrations` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `SSRF، webhook spoofing و credential leakage` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-INTEG-09 — API، webhooks و integrations: concurrency و idempotency
- فاز: `P11`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اتصال امن به سیستم‌های خارجی و retry قابل مشاهده؛ شیء هدف این تسک `IntegrationConnection و WebhookDelivery` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: SSRF protection، signature verification، allowlist egress و replay protection اجباری است.
- قرارداد داده/API: موجودیت‌های `IntegrationConnection, ApiCredential, WebhookEndpoint, Delivery` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/integrations` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `SSRF، webhook spoofing و credential leakage` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-INTEG-10 — API، webhooks و integrations: authorization و tenant scope
- فاز: `P11`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اتصال امن به سیستم‌های خارجی و retry قابل مشاهده؛ شیء هدف این تسک `IntegrationConnection و WebhookDelivery` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: SSRF protection، signature verification، allowlist egress و replay protection اجباری است.
- قرارداد داده/API: موجودیت‌های `IntegrationConnection, ApiCredential, WebhookEndpoint, Delivery` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/integrations` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `SSRF، webhook spoofing و credential leakage` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-INTEG-11 — API، webhooks و integrations: vertical slice رابط کاربری
- فاز: `P11`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اتصال امن به سیستم‌های خارجی و retry قابل مشاهده؛ شیء هدف این تسک `IntegrationConnection و WebhookDelivery` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: SSRF protection، signature verification، allowlist egress و replay protection اجباری است.
- قرارداد داده/API: موجودیت‌های `IntegrationConnection, ApiCredential, WebhookEndpoint, Delivery` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/integrations` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `SSRF، webhook spoofing و credential leakage` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-INTEG-12 — API، webhooks و integrations: تست جامع و evidence
- فاز: `P11`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: اتصال امن به سیستم‌های خارجی و retry قابل مشاهده؛ شیء هدف این تسک `IntegrationConnection و WebhookDelivery` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: SSRF protection، signature verification، allowlist egress و replay protection اجباری است.
- قرارداد داده/API: موجودیت‌های `IntegrationConnection, ApiCredential, WebhookEndpoint, Delivery` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/integrations` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `SSRF، webhook spoofing و credential leakage` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-IMPORT-01 — Import، export و bulk operations: کشف invariants و رفتار موجود
- فاز: `P11`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جابه‌جایی داده امن، قابل preview و برگشت‌پذیر؛ شیء هدف این تسک `ImportJob و ExportJob` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: export و import باید permission scope، audit، idempotency و محدودیت حجم داشته باشند.
- قرارداد داده/API: موجودیت‌های `ImportJob, ExportJob, MappingProfile, ValidationIssue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/data-tools` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت انبوه داده و خراب‌شدن رکوردها` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-IMPORT-02 — Import، export و bulk operations: مدل دامنه و schema
- فاز: `P11`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جابه‌جایی داده امن، قابل preview و برگشت‌پذیر؛ شیء هدف این تسک `ImportJob و ExportJob` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: export و import باید permission scope، audit، idempotency و محدودیت حجم داشته باشند.
- قرارداد داده/API: موجودیت‌های `ImportJob, ExportJob, MappingProfile, ValidationIssue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/data-tools` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت انبوه داده و خراب‌شدن رکوردها` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-IMPORT-03 — Import، export و bulk operations: migration و rollback
- فاز: `P11`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جابه‌جایی داده امن، قابل preview و برگشت‌پذیر؛ شیء هدف این تسک `ImportJob و ExportJob` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: export و import باید permission scope، audit، idempotency و محدودیت حجم داشته باشند.
- قرارداد داده/API: موجودیت‌های `ImportJob, ExportJob, MappingProfile, ValidationIssue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/data-tools` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت انبوه داده و خراب‌شدن رکوردها` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-IMPORT-04 — Import، export و bulk operations: repository contract
- فاز: `P11`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جابه‌جایی داده امن، قابل preview و برگشت‌پذیر؛ شیء هدف این تسک `ImportJob و ExportJob` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: export و import باید permission scope، audit، idempotency و محدودیت حجم داشته باشند.
- قرارداد داده/API: موجودیت‌های `ImportJob, ExportJob, MappingProfile, ValidationIssue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/data-tools` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت انبوه داده و خراب‌شدن رکوردها` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-IMPORT-05 — Import، export و bulk operations: repository پایدار
- فاز: `P11`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جابه‌جایی داده امن، قابل preview و برگشت‌پذیر؛ شیء هدف این تسک `ImportJob و ExportJob` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: export و import باید permission scope، audit، idempotency و محدودیت حجم داشته باشند.
- قرارداد داده/API: موجودیت‌های `ImportJob, ExportJob, MappingProfile, ValidationIssue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/data-tools` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت انبوه داده و خراب‌شدن رکوردها` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-IMPORT-06 — Import، export و bulk operations: service/use-case
- فاز: `P11`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جابه‌جایی داده امن، قابل preview و برگشت‌پذیر؛ شیء هدف این تسک `ImportJob و ExportJob` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: export و import باید permission scope، audit، idempotency و محدودیت حجم داشته باشند.
- قرارداد داده/API: موجودیت‌های `ImportJob, ExportJob, MappingProfile, ValidationIssue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/data-tools` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت انبوه داده و خراب‌شدن رکوردها` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-IMPORT-07 — Import، export و bulk operations: API خواندن، فهرست و فیلتر
- فاز: `P11`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جابه‌جایی داده امن، قابل preview و برگشت‌پذیر؛ شیء هدف این تسک `ImportJob و ExportJob` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: export و import باید permission scope، audit، idempotency و محدودیت حجم داشته باشند.
- قرارداد داده/API: موجودیت‌های `ImportJob, ExportJob, MappingProfile, ValidationIssue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/data-tools` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت انبوه داده و خراب‌شدن رکوردها` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-IMPORT-08 — Import، export و bulk operations: API ایجاد، تغییر و transition
- فاز: `P11`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جابه‌جایی داده امن، قابل preview و برگشت‌پذیر؛ شیء هدف این تسک `ImportJob و ExportJob` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: export و import باید permission scope، audit، idempotency و محدودیت حجم داشته باشند.
- قرارداد داده/API: موجودیت‌های `ImportJob, ExportJob, MappingProfile, ValidationIssue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/data-tools` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت انبوه داده و خراب‌شدن رکوردها` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-IMPORT-09 — Import، export و bulk operations: concurrency و idempotency
- فاز: `P11`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جابه‌جایی داده امن، قابل preview و برگشت‌پذیر؛ شیء هدف این تسک `ImportJob و ExportJob` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: export و import باید permission scope، audit، idempotency و محدودیت حجم داشته باشند.
- قرارداد داده/API: موجودیت‌های `ImportJob, ExportJob, MappingProfile, ValidationIssue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/data-tools` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت انبوه داده و خراب‌شدن رکوردها` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-IMPORT-10 — Import، export و bulk operations: authorization و tenant scope
- فاز: `P11`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جابه‌جایی داده امن، قابل preview و برگشت‌پذیر؛ شیء هدف این تسک `ImportJob و ExportJob` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: export و import باید permission scope، audit، idempotency و محدودیت حجم داشته باشند.
- قرارداد داده/API: موجودیت‌های `ImportJob, ExportJob, MappingProfile, ValidationIssue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/data-tools` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت انبوه داده و خراب‌شدن رکوردها` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-IMPORT-11 — Import، export و bulk operations: vertical slice رابط کاربری
- فاز: `P11`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جابه‌جایی داده امن، قابل preview و برگشت‌پذیر؛ شیء هدف این تسک `ImportJob و ExportJob` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: export و import باید permission scope، audit، idempotency و محدودیت حجم داشته باشند.
- قرارداد داده/API: موجودیت‌های `ImportJob, ExportJob, MappingProfile, ValidationIssue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/data-tools` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت انبوه داده و خراب‌شدن رکوردها` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-IMPORT-12 — Import، export و bulk operations: تست جامع و evidence
- فاز: `P11`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: جابه‌جایی داده امن، قابل preview و برگشت‌پذیر؛ شیء هدف این تسک `ImportJob و ExportJob` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: export و import باید permission scope، audit، idempotency و محدودیت حجم داشته باشند.
- قرارداد داده/API: موجودیت‌های `ImportJob, ExportJob, MappingProfile, ValidationIssue` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/data-tools` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `نشت انبوه داده و خراب‌شدن رکوردها` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P11 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MOBILE-01 — موبایل، آفلاین و sync: کشف invariants و رفتار موجود
- فاز: `P12`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: عملیات امن موبایل در شبکه ناپایدار؛ شیء هدف این تسک `OfflineMutation و SyncCursor` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: موفقیت sync فقط پس از ack سرور اعلام شود؛ queue باید durable، idempotent و conflict-aware باشد.
- قرارداد داده/API: موجودیت‌های `OfflineMutation, SyncCursor, ConflictRecord, DeviceSession` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/mobile` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گم‌شدن mutation، duplicate write و token leak` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MOBILE-02 — موبایل، آفلاین و sync: مدل دامنه و schema
- فاز: `P12`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: عملیات امن موبایل در شبکه ناپایدار؛ شیء هدف این تسک `OfflineMutation و SyncCursor` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: موفقیت sync فقط پس از ack سرور اعلام شود؛ queue باید durable، idempotent و conflict-aware باشد.
- قرارداد داده/API: موجودیت‌های `OfflineMutation, SyncCursor, ConflictRecord, DeviceSession` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/mobile` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گم‌شدن mutation، duplicate write و token leak` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MOBILE-03 — موبایل، آفلاین و sync: migration و rollback
- فاز: `P12`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: عملیات امن موبایل در شبکه ناپایدار؛ شیء هدف این تسک `OfflineMutation و SyncCursor` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: موفقیت sync فقط پس از ack سرور اعلام شود؛ queue باید durable، idempotent و conflict-aware باشد.
- قرارداد داده/API: موجودیت‌های `OfflineMutation, SyncCursor, ConflictRecord, DeviceSession` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/mobile` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گم‌شدن mutation، duplicate write و token leak` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MOBILE-04 — موبایل، آفلاین و sync: repository contract
- فاز: `P12`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: عملیات امن موبایل در شبکه ناپایدار؛ شیء هدف این تسک `OfflineMutation و SyncCursor` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: موفقیت sync فقط پس از ack سرور اعلام شود؛ queue باید durable، idempotent و conflict-aware باشد.
- قرارداد داده/API: موجودیت‌های `OfflineMutation, SyncCursor, ConflictRecord, DeviceSession` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/mobile` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گم‌شدن mutation، duplicate write و token leak` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MOBILE-05 — موبایل، آفلاین و sync: repository پایدار
- فاز: `P12`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: عملیات امن موبایل در شبکه ناپایدار؛ شیء هدف این تسک `OfflineMutation و SyncCursor` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: موفقیت sync فقط پس از ack سرور اعلام شود؛ queue باید durable، idempotent و conflict-aware باشد.
- قرارداد داده/API: موجودیت‌های `OfflineMutation, SyncCursor, ConflictRecord, DeviceSession` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/mobile` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گم‌شدن mutation، duplicate write و token leak` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MOBILE-06 — موبایل، آفلاین و sync: service/use-case
- فاز: `P12`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: عملیات امن موبایل در شبکه ناپایدار؛ شیء هدف این تسک `OfflineMutation و SyncCursor` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: موفقیت sync فقط پس از ack سرور اعلام شود؛ queue باید durable، idempotent و conflict-aware باشد.
- قرارداد داده/API: موجودیت‌های `OfflineMutation, SyncCursor, ConflictRecord, DeviceSession` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/mobile` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گم‌شدن mutation، duplicate write و token leak` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MOBILE-07 — موبایل، آفلاین و sync: API خواندن، فهرست و فیلتر
- فاز: `P12`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: عملیات امن موبایل در شبکه ناپایدار؛ شیء هدف این تسک `OfflineMutation و SyncCursor` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: موفقیت sync فقط پس از ack سرور اعلام شود؛ queue باید durable، idempotent و conflict-aware باشد.
- قرارداد داده/API: موجودیت‌های `OfflineMutation, SyncCursor, ConflictRecord, DeviceSession` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/mobile` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گم‌شدن mutation، duplicate write و token leak` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MOBILE-08 — موبایل، آفلاین و sync: API ایجاد، تغییر و transition
- فاز: `P12`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: عملیات امن موبایل در شبکه ناپایدار؛ شیء هدف این تسک `OfflineMutation و SyncCursor` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: موفقیت sync فقط پس از ack سرور اعلام شود؛ queue باید durable، idempotent و conflict-aware باشد.
- قرارداد داده/API: موجودیت‌های `OfflineMutation, SyncCursor, ConflictRecord, DeviceSession` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/mobile` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گم‌شدن mutation، duplicate write و token leak` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MOBILE-09 — موبایل، آفلاین و sync: concurrency و idempotency
- فاز: `P12`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: عملیات امن موبایل در شبکه ناپایدار؛ شیء هدف این تسک `OfflineMutation و SyncCursor` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: موفقیت sync فقط پس از ack سرور اعلام شود؛ queue باید durable، idempotent و conflict-aware باشد.
- قرارداد داده/API: موجودیت‌های `OfflineMutation, SyncCursor, ConflictRecord, DeviceSession` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/mobile` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گم‌شدن mutation، duplicate write و token leak` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MOBILE-10 — موبایل، آفلاین و sync: authorization و tenant scope
- فاز: `P12`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: عملیات امن موبایل در شبکه ناپایدار؛ شیء هدف این تسک `OfflineMutation و SyncCursor` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: موفقیت sync فقط پس از ack سرور اعلام شود؛ queue باید durable، idempotent و conflict-aware باشد.
- قرارداد داده/API: موجودیت‌های `OfflineMutation, SyncCursor, ConflictRecord, DeviceSession` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/mobile` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گم‌شدن mutation، duplicate write و token leak` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MOBILE-11 — موبایل، آفلاین و sync: vertical slice رابط کاربری
- فاز: `P12`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: عملیات امن موبایل در شبکه ناپایدار؛ شیء هدف این تسک `OfflineMutation و SyncCursor` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: موفقیت sync فقط پس از ack سرور اعلام شود؛ queue باید durable، idempotent و conflict-aware باشد.
- قرارداد داده/API: موجودیت‌های `OfflineMutation, SyncCursor, ConflictRecord, DeviceSession` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/mobile` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گم‌شدن mutation، duplicate write و token leak` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-MOBILE-12 — موبایل، آفلاین و sync: تست جامع و evidence
- فاز: `P12`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: عملیات امن موبایل در شبکه ناپایدار؛ شیء هدف این تسک `OfflineMutation و SyncCursor` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: موفقیت sync فقط پس از ack سرور اعلام شود؛ queue باید durable، idempotent و conflict-aware باشد.
- قرارداد داده/API: موجودیت‌های `OfflineMutation, SyncCursor, ConflictRecord, DeviceSession` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/mobile` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `گم‌شدن mutation، duplicate write و token leak` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-I18N-01 — فارسی، RTL، Jalali و localization: کشف invariants و رفتار موجود
- فاز: `P12`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجربه بومی فارسی/RTL بدون خراب‌شدن localeهای دیگر؛ شیء هدف این تسک `LocaleProfile و CalendarAdapter` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timestamp در سرور به شکل استاندارد و timezone-aware ذخیره شود؛ تقویم فقط در presentation تبدیل شود.
- قرارداد داده/API: موجودیت‌های `LocaleProfile, TimeZonePreference, CalendarAdapter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/preferences` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای تاریخ، چیدمان RTL و format اشتباه پول` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-I18N-02 — فارسی، RTL، Jalali و localization: مدل دامنه و schema
- فاز: `P12`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجربه بومی فارسی/RTL بدون خراب‌شدن localeهای دیگر؛ شیء هدف این تسک `LocaleProfile و CalendarAdapter` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timestamp در سرور به شکل استاندارد و timezone-aware ذخیره شود؛ تقویم فقط در presentation تبدیل شود.
- قرارداد داده/API: موجودیت‌های `LocaleProfile, TimeZonePreference, CalendarAdapter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/preferences` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای تاریخ، چیدمان RTL و format اشتباه پول` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-I18N-03 — فارسی، RTL، Jalali و localization: migration و rollback
- فاز: `P12`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجربه بومی فارسی/RTL بدون خراب‌شدن localeهای دیگر؛ شیء هدف این تسک `LocaleProfile و CalendarAdapter` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timestamp در سرور به شکل استاندارد و timezone-aware ذخیره شود؛ تقویم فقط در presentation تبدیل شود.
- قرارداد داده/API: موجودیت‌های `LocaleProfile, TimeZonePreference, CalendarAdapter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/preferences` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای تاریخ، چیدمان RTL و format اشتباه پول` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-I18N-04 — فارسی، RTL، Jalali و localization: repository contract
- فاز: `P12`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجربه بومی فارسی/RTL بدون خراب‌شدن localeهای دیگر؛ شیء هدف این تسک `LocaleProfile و CalendarAdapter` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timestamp در سرور به شکل استاندارد و timezone-aware ذخیره شود؛ تقویم فقط در presentation تبدیل شود.
- قرارداد داده/API: موجودیت‌های `LocaleProfile, TimeZonePreference, CalendarAdapter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/preferences` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای تاریخ، چیدمان RTL و format اشتباه پول` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-I18N-05 — فارسی، RTL، Jalali و localization: repository پایدار
- فاز: `P12`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجربه بومی فارسی/RTL بدون خراب‌شدن localeهای دیگر؛ شیء هدف این تسک `LocaleProfile و CalendarAdapter` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timestamp در سرور به شکل استاندارد و timezone-aware ذخیره شود؛ تقویم فقط در presentation تبدیل شود.
- قرارداد داده/API: موجودیت‌های `LocaleProfile, TimeZonePreference, CalendarAdapter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/preferences` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای تاریخ، چیدمان RTL و format اشتباه پول` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-I18N-06 — فارسی، RTL، Jalali و localization: service/use-case
- فاز: `P12`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجربه بومی فارسی/RTL بدون خراب‌شدن localeهای دیگر؛ شیء هدف این تسک `LocaleProfile و CalendarAdapter` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timestamp در سرور به شکل استاندارد و timezone-aware ذخیره شود؛ تقویم فقط در presentation تبدیل شود.
- قرارداد داده/API: موجودیت‌های `LocaleProfile, TimeZonePreference, CalendarAdapter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/preferences` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای تاریخ، چیدمان RTL و format اشتباه پول` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-I18N-07 — فارسی، RTL، Jalali و localization: API خواندن، فهرست و فیلتر
- فاز: `P12`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجربه بومی فارسی/RTL بدون خراب‌شدن localeهای دیگر؛ شیء هدف این تسک `LocaleProfile و CalendarAdapter` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timestamp در سرور به شکل استاندارد و timezone-aware ذخیره شود؛ تقویم فقط در presentation تبدیل شود.
- قرارداد داده/API: موجودیت‌های `LocaleProfile, TimeZonePreference, CalendarAdapter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/preferences` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای تاریخ، چیدمان RTL و format اشتباه پول` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-I18N-08 — فارسی، RTL، Jalali و localization: API ایجاد، تغییر و transition
- فاز: `P12`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجربه بومی فارسی/RTL بدون خراب‌شدن localeهای دیگر؛ شیء هدف این تسک `LocaleProfile و CalendarAdapter` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timestamp در سرور به شکل استاندارد و timezone-aware ذخیره شود؛ تقویم فقط در presentation تبدیل شود.
- قرارداد داده/API: موجودیت‌های `LocaleProfile, TimeZonePreference, CalendarAdapter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/preferences` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای تاریخ، چیدمان RTL و format اشتباه پول` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-I18N-09 — فارسی، RTL، Jalali و localization: concurrency و idempotency
- فاز: `P12`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجربه بومی فارسی/RTL بدون خراب‌شدن localeهای دیگر؛ شیء هدف این تسک `LocaleProfile و CalendarAdapter` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timestamp در سرور به شکل استاندارد و timezone-aware ذخیره شود؛ تقویم فقط در presentation تبدیل شود.
- قرارداد داده/API: موجودیت‌های `LocaleProfile, TimeZonePreference, CalendarAdapter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/preferences` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای تاریخ، چیدمان RTL و format اشتباه پول` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-I18N-10 — فارسی، RTL، Jalali و localization: authorization و tenant scope
- فاز: `P12`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجربه بومی فارسی/RTL بدون خراب‌شدن localeهای دیگر؛ شیء هدف این تسک `LocaleProfile و CalendarAdapter` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timestamp در سرور به شکل استاندارد و timezone-aware ذخیره شود؛ تقویم فقط در presentation تبدیل شود.
- قرارداد داده/API: موجودیت‌های `LocaleProfile, TimeZonePreference, CalendarAdapter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/preferences` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای تاریخ، چیدمان RTL و format اشتباه پول` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-I18N-11 — فارسی، RTL، Jalali و localization: vertical slice رابط کاربری
- فاز: `P12`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجربه بومی فارسی/RTL بدون خراب‌شدن localeهای دیگر؛ شیء هدف این تسک `LocaleProfile و CalendarAdapter` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timestamp در سرور به شکل استاندارد و timezone-aware ذخیره شود؛ تقویم فقط در presentation تبدیل شود.
- قرارداد داده/API: موجودیت‌های `LocaleProfile, TimeZonePreference, CalendarAdapter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/preferences` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای تاریخ، چیدمان RTL و format اشتباه پول` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-I18N-12 — فارسی، RTL، Jalali و localization: تست جامع و evidence
- فاز: `P12`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تجربه بومی فارسی/RTL بدون خراب‌شدن localeهای دیگر؛ شیء هدف این تسک `LocaleProfile و CalendarAdapter` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: timestamp در سرور به شکل استاندارد و timezone-aware ذخیره شود؛ تقویم فقط در presentation تبدیل شود.
- قرارداد داده/API: موجودیت‌های `LocaleProfile, TimeZonePreference, CalendarAdapter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/preferences` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای تاریخ، چیدمان RTL و format اشتباه پول` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P12 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-OBS-01 — Observability، jobs و resilience: کشف invariants و رفتار موجود
- فاز: `P13`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابل تشخیص بودن خطا و پیشگیری از silent failure؛ شیء هدف این تسک `Telemetry و BackgroundJob` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر job باید correlation ID، retry limit، DLQ و owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `BackgroundJob, JobAttempt, DeadLetter, SLO` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/health` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای خاموش، retry storm و نبود forensic evidence` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-OBS-02 — Observability، jobs و resilience: مدل دامنه و schema
- فاز: `P13`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابل تشخیص بودن خطا و پیشگیری از silent failure؛ شیء هدف این تسک `Telemetry و BackgroundJob` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر job باید correlation ID، retry limit، DLQ و owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `BackgroundJob, JobAttempt, DeadLetter, SLO` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/health` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای خاموش، retry storm و نبود forensic evidence` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-OBS-03 — Observability، jobs و resilience: migration و rollback
- فاز: `P13`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابل تشخیص بودن خطا و پیشگیری از silent failure؛ شیء هدف این تسک `Telemetry و BackgroundJob` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر job باید correlation ID، retry limit، DLQ و owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `BackgroundJob, JobAttempt, DeadLetter, SLO` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/health` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای خاموش، retry storm و نبود forensic evidence` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-OBS-04 — Observability، jobs و resilience: repository contract
- فاز: `P13`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابل تشخیص بودن خطا و پیشگیری از silent failure؛ شیء هدف این تسک `Telemetry و BackgroundJob` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر job باید correlation ID، retry limit، DLQ و owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `BackgroundJob, JobAttempt, DeadLetter, SLO` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/health` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای خاموش، retry storm و نبود forensic evidence` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-OBS-05 — Observability، jobs و resilience: repository پایدار
- فاز: `P13`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابل تشخیص بودن خطا و پیشگیری از silent failure؛ شیء هدف این تسک `Telemetry و BackgroundJob` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر job باید correlation ID، retry limit، DLQ و owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `BackgroundJob, JobAttempt, DeadLetter, SLO` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/health` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای خاموش، retry storm و نبود forensic evidence` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-OBS-06 — Observability، jobs و resilience: service/use-case
- فاز: `P13`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابل تشخیص بودن خطا و پیشگیری از silent failure؛ شیء هدف این تسک `Telemetry و BackgroundJob` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر job باید correlation ID، retry limit، DLQ و owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `BackgroundJob, JobAttempt, DeadLetter, SLO` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/health` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای خاموش، retry storm و نبود forensic evidence` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-OBS-07 — Observability، jobs و resilience: API خواندن، فهرست و فیلتر
- فاز: `P13`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابل تشخیص بودن خطا و پیشگیری از silent failure؛ شیء هدف این تسک `Telemetry و BackgroundJob` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر job باید correlation ID، retry limit، DLQ و owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `BackgroundJob, JobAttempt, DeadLetter, SLO` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/health` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای خاموش، retry storm و نبود forensic evidence` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-OBS-08 — Observability، jobs و resilience: API ایجاد، تغییر و transition
- فاز: `P13`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابل تشخیص بودن خطا و پیشگیری از silent failure؛ شیء هدف این تسک `Telemetry و BackgroundJob` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر job باید correlation ID، retry limit، DLQ و owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `BackgroundJob, JobAttempt, DeadLetter, SLO` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/health` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای خاموش، retry storm و نبود forensic evidence` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-OBS-09 — Observability، jobs و resilience: concurrency و idempotency
- فاز: `P13`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابل تشخیص بودن خطا و پیشگیری از silent failure؛ شیء هدف این تسک `Telemetry و BackgroundJob` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر job باید correlation ID، retry limit، DLQ و owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `BackgroundJob, JobAttempt, DeadLetter, SLO` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/health` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای خاموش، retry storm و نبود forensic evidence` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-OBS-10 — Observability، jobs و resilience: authorization و tenant scope
- فاز: `P13`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابل تشخیص بودن خطا و پیشگیری از silent failure؛ شیء هدف این تسک `Telemetry و BackgroundJob` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر job باید correlation ID، retry limit، DLQ و owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `BackgroundJob, JobAttempt, DeadLetter, SLO` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/health` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای خاموش، retry storm و نبود forensic evidence` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-OBS-11 — Observability، jobs و resilience: vertical slice رابط کاربری
- فاز: `P13`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابل تشخیص بودن خطا و پیشگیری از silent failure؛ شیء هدف این تسک `Telemetry و BackgroundJob` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر job باید correlation ID، retry limit، DLQ و owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `BackgroundJob, JobAttempt, DeadLetter, SLO` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/health` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای خاموش، retry storm و نبود forensic evidence` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-OBS-12 — Observability، jobs و resilience: تست جامع و evidence
- فاز: `P13`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: قابل تشخیص بودن خطا و پیشگیری از silent failure؛ شیء هدف این تسک `Telemetry و BackgroundJob` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: هر job باید correlation ID، retry limit، DLQ و owner داشته باشد.
- قرارداد داده/API: موجودیت‌های `BackgroundJob, JobAttempt, DeadLetter, SLO` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/health` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `خطای خاموش، retry storm و نبود forensic evidence` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BACKUP-01 — Backup، restore و disaster recovery: کشف invariants و رفتار موجود
- فاز: `P13`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: بازیابی قابل تمرین و قابل اندازه‌گیری؛ شیء هدف این تسک `BackupSnapshot و RestoreRun` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: وجود backup بدون restore drill و کنترل integrity معیار قبولی نیست.
- قرارداد داده/API: موجودیت‌های `BackupSnapshot, RestoreRun, RetentionSchedule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/backups` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن داده و backup غیرقابل بازیابی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BACKUP-02 — Backup، restore و disaster recovery: مدل دامنه و schema
- فاز: `P13`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: بازیابی قابل تمرین و قابل اندازه‌گیری؛ شیء هدف این تسک `BackupSnapshot و RestoreRun` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: وجود backup بدون restore drill و کنترل integrity معیار قبولی نیست.
- قرارداد داده/API: موجودیت‌های `BackupSnapshot, RestoreRun, RetentionSchedule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/backups` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن داده و backup غیرقابل بازیابی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BACKUP-03 — Backup، restore و disaster recovery: migration و rollback
- فاز: `P13`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: بازیابی قابل تمرین و قابل اندازه‌گیری؛ شیء هدف این تسک `BackupSnapshot و RestoreRun` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: وجود backup بدون restore drill و کنترل integrity معیار قبولی نیست.
- قرارداد داده/API: موجودیت‌های `BackupSnapshot, RestoreRun, RetentionSchedule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/backups` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن داده و backup غیرقابل بازیابی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BACKUP-04 — Backup، restore و disaster recovery: repository contract
- فاز: `P13`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: بازیابی قابل تمرین و قابل اندازه‌گیری؛ شیء هدف این تسک `BackupSnapshot و RestoreRun` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: وجود backup بدون restore drill و کنترل integrity معیار قبولی نیست.
- قرارداد داده/API: موجودیت‌های `BackupSnapshot, RestoreRun, RetentionSchedule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/backups` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن داده و backup غیرقابل بازیابی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BACKUP-05 — Backup، restore و disaster recovery: repository پایدار
- فاز: `P13`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: بازیابی قابل تمرین و قابل اندازه‌گیری؛ شیء هدف این تسک `BackupSnapshot و RestoreRun` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: وجود backup بدون restore drill و کنترل integrity معیار قبولی نیست.
- قرارداد داده/API: موجودیت‌های `BackupSnapshot, RestoreRun, RetentionSchedule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/backups` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن داده و backup غیرقابل بازیابی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BACKUP-06 — Backup، restore و disaster recovery: service/use-case
- فاز: `P13`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: بازیابی قابل تمرین و قابل اندازه‌گیری؛ شیء هدف این تسک `BackupSnapshot و RestoreRun` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: وجود backup بدون restore drill و کنترل integrity معیار قبولی نیست.
- قرارداد داده/API: موجودیت‌های `BackupSnapshot, RestoreRun, RetentionSchedule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/backups` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن داده و backup غیرقابل بازیابی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BACKUP-07 — Backup، restore و disaster recovery: API خواندن، فهرست و فیلتر
- فاز: `P13`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: بازیابی قابل تمرین و قابل اندازه‌گیری؛ شیء هدف این تسک `BackupSnapshot و RestoreRun` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: وجود backup بدون restore drill و کنترل integrity معیار قبولی نیست.
- قرارداد داده/API: موجودیت‌های `BackupSnapshot, RestoreRun, RetentionSchedule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/backups` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن داده و backup غیرقابل بازیابی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BACKUP-08 — Backup، restore و disaster recovery: API ایجاد، تغییر و transition
- فاز: `P13`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: بازیابی قابل تمرین و قابل اندازه‌گیری؛ شیء هدف این تسک `BackupSnapshot و RestoreRun` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: وجود backup بدون restore drill و کنترل integrity معیار قبولی نیست.
- قرارداد داده/API: موجودیت‌های `BackupSnapshot, RestoreRun, RetentionSchedule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/backups` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن داده و backup غیرقابل بازیابی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BACKUP-09 — Backup، restore و disaster recovery: concurrency و idempotency
- فاز: `P13`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: بازیابی قابل تمرین و قابل اندازه‌گیری؛ شیء هدف این تسک `BackupSnapshot و RestoreRun` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: وجود backup بدون restore drill و کنترل integrity معیار قبولی نیست.
- قرارداد داده/API: موجودیت‌های `BackupSnapshot, RestoreRun, RetentionSchedule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/backups` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن داده و backup غیرقابل بازیابی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BACKUP-10 — Backup، restore و disaster recovery: authorization و tenant scope
- فاز: `P13`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: بازیابی قابل تمرین و قابل اندازه‌گیری؛ شیء هدف این تسک `BackupSnapshot و RestoreRun` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: وجود backup بدون restore drill و کنترل integrity معیار قبولی نیست.
- قرارداد داده/API: موجودیت‌های `BackupSnapshot, RestoreRun, RetentionSchedule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/backups` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن داده و backup غیرقابل بازیابی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BACKUP-11 — Backup، restore و disaster recovery: vertical slice رابط کاربری
- فاز: `P13`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: بازیابی قابل تمرین و قابل اندازه‌گیری؛ شیء هدف این تسک `BackupSnapshot و RestoreRun` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: وجود backup بدون restore drill و کنترل integrity معیار قبولی نیست.
- قرارداد داده/API: موجودیت‌های `BackupSnapshot, RestoreRun, RetentionSchedule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/backups` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن داده و backup غیرقابل بازیابی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BACKUP-12 — Backup، restore و disaster recovery: تست جامع و evidence
- فاز: `P13`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: بازیابی قابل تمرین و قابل اندازه‌گیری؛ شیء هدف این تسک `BackupSnapshot و RestoreRun` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: وجود backup بدون restore drill و کنترل integrity معیار قبولی نیست.
- قرارداد داده/API: موجودیت‌های `BackupSnapshot, RestoreRun, RetentionSchedule` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/backups` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `از دست رفتن داده و backup غیرقابل بازیابی` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P13 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BILL-01 — اشتراک و محدودیت‌های پلن سازمانی: کشف invariants و رفتار موجود
- فاز: `P14`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: کنترل قابلیت‌های SaaS بدون شکستن داده موجود؛ شیء هدف این تسک `Plan و Entitlement` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: feature entitlement فقط در server enforce شود و پایان اشتراک موجب حذف ناگهانی داده نشود.
- قرارداد داده/API: موجودیت‌های `Plan, Subscription, Entitlement, UsageCounter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/billing` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی فراتر از پلن و قفل‌شدن مشتری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BILL-02 — اشتراک و محدودیت‌های پلن سازمانی: مدل دامنه و schema
- فاز: `P14`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: کنترل قابلیت‌های SaaS بدون شکستن داده موجود؛ شیء هدف این تسک `Plan و Entitlement` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: feature entitlement فقط در server enforce شود و پایان اشتراک موجب حذف ناگهانی داده نشود.
- قرارداد داده/API: موجودیت‌های `Plan, Subscription, Entitlement, UsageCounter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/billing` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی فراتر از پلن و قفل‌شدن مشتری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BILL-03 — اشتراک و محدودیت‌های پلن سازمانی: migration و rollback
- فاز: `P14`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: کنترل قابلیت‌های SaaS بدون شکستن داده موجود؛ شیء هدف این تسک `Plan و Entitlement` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: feature entitlement فقط در server enforce شود و پایان اشتراک موجب حذف ناگهانی داده نشود.
- قرارداد داده/API: موجودیت‌های `Plan, Subscription, Entitlement, UsageCounter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/billing` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی فراتر از پلن و قفل‌شدن مشتری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BILL-04 — اشتراک و محدودیت‌های پلن سازمانی: repository contract
- فاز: `P14`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: کنترل قابلیت‌های SaaS بدون شکستن داده موجود؛ شیء هدف این تسک `Plan و Entitlement` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: feature entitlement فقط در server enforce شود و پایان اشتراک موجب حذف ناگهانی داده نشود.
- قرارداد داده/API: موجودیت‌های `Plan, Subscription, Entitlement, UsageCounter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/billing` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی فراتر از پلن و قفل‌شدن مشتری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BILL-05 — اشتراک و محدودیت‌های پلن سازمانی: repository پایدار
- فاز: `P14`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: کنترل قابلیت‌های SaaS بدون شکستن داده موجود؛ شیء هدف این تسک `Plan و Entitlement` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: feature entitlement فقط در server enforce شود و پایان اشتراک موجب حذف ناگهانی داده نشود.
- قرارداد داده/API: موجودیت‌های `Plan, Subscription, Entitlement, UsageCounter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/billing` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی فراتر از پلن و قفل‌شدن مشتری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BILL-06 — اشتراک و محدودیت‌های پلن سازمانی: service/use-case
- فاز: `P14`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: کنترل قابلیت‌های SaaS بدون شکستن داده موجود؛ شیء هدف این تسک `Plan و Entitlement` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: feature entitlement فقط در server enforce شود و پایان اشتراک موجب حذف ناگهانی داده نشود.
- قرارداد داده/API: موجودیت‌های `Plan, Subscription, Entitlement, UsageCounter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/billing` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی فراتر از پلن و قفل‌شدن مشتری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BILL-07 — اشتراک و محدودیت‌های پلن سازمانی: API خواندن، فهرست و فیلتر
- فاز: `P14`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: کنترل قابلیت‌های SaaS بدون شکستن داده موجود؛ شیء هدف این تسک `Plan و Entitlement` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: feature entitlement فقط در server enforce شود و پایان اشتراک موجب حذف ناگهانی داده نشود.
- قرارداد داده/API: موجودیت‌های `Plan, Subscription, Entitlement, UsageCounter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/billing` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی فراتر از پلن و قفل‌شدن مشتری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BILL-08 — اشتراک و محدودیت‌های پلن سازمانی: API ایجاد، تغییر و transition
- فاز: `P14`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: کنترل قابلیت‌های SaaS بدون شکستن داده موجود؛ شیء هدف این تسک `Plan و Entitlement` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: feature entitlement فقط در server enforce شود و پایان اشتراک موجب حذف ناگهانی داده نشود.
- قرارداد داده/API: موجودیت‌های `Plan, Subscription, Entitlement, UsageCounter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/billing` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی فراتر از پلن و قفل‌شدن مشتری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BILL-09 — اشتراک و محدودیت‌های پلن سازمانی: concurrency و idempotency
- فاز: `P14`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: کنترل قابلیت‌های SaaS بدون شکستن داده موجود؛ شیء هدف این تسک `Plan و Entitlement` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: feature entitlement فقط در server enforce شود و پایان اشتراک موجب حذف ناگهانی داده نشود.
- قرارداد داده/API: موجودیت‌های `Plan, Subscription, Entitlement, UsageCounter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/billing` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی فراتر از پلن و قفل‌شدن مشتری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BILL-10 — اشتراک و محدودیت‌های پلن سازمانی: authorization و tenant scope
- فاز: `P14`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: کنترل قابلیت‌های SaaS بدون شکستن داده موجود؛ شیء هدف این تسک `Plan و Entitlement` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: feature entitlement فقط در server enforce شود و پایان اشتراک موجب حذف ناگهانی داده نشود.
- قرارداد داده/API: موجودیت‌های `Plan, Subscription, Entitlement, UsageCounter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/billing` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی فراتر از پلن و قفل‌شدن مشتری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BILL-11 — اشتراک و محدودیت‌های پلن سازمانی: vertical slice رابط کاربری
- فاز: `P14`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: کنترل قابلیت‌های SaaS بدون شکستن داده موجود؛ شیء هدف این تسک `Plan و Entitlement` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: feature entitlement فقط در server enforce شود و پایان اشتراک موجب حذف ناگهانی داده نشود.
- قرارداد داده/API: موجودیت‌های `Plan, Subscription, Entitlement, UsageCounter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/billing` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی فراتر از پلن و قفل‌شدن مشتری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-BILL-12 — اشتراک و محدودیت‌های پلن سازمانی: تست جامع و evidence
- فاز: `P14`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: کنترل قابلیت‌های SaaS بدون شکستن داده موجود؛ شیء هدف این تسک `Plan و Entitlement` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: feature entitlement فقط در server enforce شود و پایان اشتراک موجب حذف ناگهانی داده نشود.
- قرارداد داده/API: موجودیت‌های `Plan, Subscription, Entitlement, UsageCounter` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/settings/billing` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `دسترسی فراتر از پلن و قفل‌شدن مشتری` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-API-01 — قراردادهای API و نسخه‌بندی: کشف invariants و رفتار موجود
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبات قرارداد میان Web، Mobile و API؛ شیء هدف این تسک `API contract` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شکست قرارداد باید با OpenAPI/type tests تشخیص داده شود؛ breaking change نسخه‌دار باشد.
- قرارداد داده/API: موجودیت‌های `OpenApiSpec, ApiVersion, ErrorEnvelope` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/api/v1` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ناسازگاری کلاینت‌ها و تغییر خاموش قرارداد` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-API-02 — قراردادهای API و نسخه‌بندی: مدل دامنه و schema
- فاز: `P01`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبات قرارداد میان Web، Mobile و API؛ شیء هدف این تسک `API contract` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شکست قرارداد باید با OpenAPI/type tests تشخیص داده شود؛ breaking change نسخه‌دار باشد.
- قرارداد داده/API: موجودیت‌های `OpenApiSpec, ApiVersion, ErrorEnvelope` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/api/v1` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ناسازگاری کلاینت‌ها و تغییر خاموش قرارداد` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-API-03 — قراردادهای API و نسخه‌بندی: migration و rollback
- فاز: `P01`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبات قرارداد میان Web، Mobile و API؛ شیء هدف این تسک `API contract` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شکست قرارداد باید با OpenAPI/type tests تشخیص داده شود؛ breaking change نسخه‌دار باشد.
- قرارداد داده/API: موجودیت‌های `OpenApiSpec, ApiVersion, ErrorEnvelope` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/api/v1` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ناسازگاری کلاینت‌ها و تغییر خاموش قرارداد` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-API-04 — قراردادهای API و نسخه‌بندی: repository contract
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبات قرارداد میان Web، Mobile و API؛ شیء هدف این تسک `API contract` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شکست قرارداد باید با OpenAPI/type tests تشخیص داده شود؛ breaking change نسخه‌دار باشد.
- قرارداد داده/API: موجودیت‌های `OpenApiSpec, ApiVersion, ErrorEnvelope` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/api/v1` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ناسازگاری کلاینت‌ها و تغییر خاموش قرارداد` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-API-05 — قراردادهای API و نسخه‌بندی: repository پایدار
- فاز: `P01`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبات قرارداد میان Web، Mobile و API؛ شیء هدف این تسک `API contract` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شکست قرارداد باید با OpenAPI/type tests تشخیص داده شود؛ breaking change نسخه‌دار باشد.
- قرارداد داده/API: موجودیت‌های `OpenApiSpec, ApiVersion, ErrorEnvelope` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/api/v1` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ناسازگاری کلاینت‌ها و تغییر خاموش قرارداد` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-API-06 — قراردادهای API و نسخه‌بندی: service/use-case
- فاز: `P01`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبات قرارداد میان Web، Mobile و API؛ شیء هدف این تسک `API contract` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شکست قرارداد باید با OpenAPI/type tests تشخیص داده شود؛ breaking change نسخه‌دار باشد.
- قرارداد داده/API: موجودیت‌های `OpenApiSpec, ApiVersion, ErrorEnvelope` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/api/v1` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ناسازگاری کلاینت‌ها و تغییر خاموش قرارداد` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-API-07 — قراردادهای API و نسخه‌بندی: API خواندن، فهرست و فیلتر
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبات قرارداد میان Web، Mobile و API؛ شیء هدف این تسک `API contract` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شکست قرارداد باید با OpenAPI/type tests تشخیص داده شود؛ breaking change نسخه‌دار باشد.
- قرارداد داده/API: موجودیت‌های `OpenApiSpec, ApiVersion, ErrorEnvelope` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/api/v1` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ناسازگاری کلاینت‌ها و تغییر خاموش قرارداد` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-API-08 — قراردادهای API و نسخه‌بندی: API ایجاد، تغییر و transition
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبات قرارداد میان Web، Mobile و API؛ شیء هدف این تسک `API contract` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شکست قرارداد باید با OpenAPI/type tests تشخیص داده شود؛ breaking change نسخه‌دار باشد.
- قرارداد داده/API: موجودیت‌های `OpenApiSpec, ApiVersion, ErrorEnvelope` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/api/v1` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ناسازگاری کلاینت‌ها و تغییر خاموش قرارداد` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-API-09 — قراردادهای API و نسخه‌بندی: concurrency و idempotency
- فاز: `P01`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبات قرارداد میان Web، Mobile و API؛ شیء هدف این تسک `API contract` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شکست قرارداد باید با OpenAPI/type tests تشخیص داده شود؛ breaking change نسخه‌دار باشد.
- قرارداد داده/API: موجودیت‌های `OpenApiSpec, ApiVersion, ErrorEnvelope` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/api/v1` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ناسازگاری کلاینت‌ها و تغییر خاموش قرارداد` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-API-10 — قراردادهای API و نسخه‌بندی: authorization و tenant scope
- فاز: `P01`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبات قرارداد میان Web، Mobile و API؛ شیء هدف این تسک `API contract` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شکست قرارداد باید با OpenAPI/type tests تشخیص داده شود؛ breaking change نسخه‌دار باشد.
- قرارداد داده/API: موجودیت‌های `OpenApiSpec, ApiVersion, ErrorEnvelope` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/api/v1` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ناسازگاری کلاینت‌ها و تغییر خاموش قرارداد` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-API-11 — قراردادهای API و نسخه‌بندی: vertical slice رابط کاربری
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبات قرارداد میان Web، Mobile و API؛ شیء هدف این تسک `API contract` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شکست قرارداد باید با OpenAPI/type tests تشخیص داده شود؛ breaking change نسخه‌دار باشد.
- قرارداد داده/API: موجودیت‌های `OpenApiSpec, ApiVersion, ErrorEnvelope` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/api/v1` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ناسازگاری کلاینت‌ها و تغییر خاموش قرارداد` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-API-12 — قراردادهای API و نسخه‌بندی: تست جامع و evidence
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: ثبات قرارداد میان Web، Mobile و API؛ شیء هدف این تسک `API contract` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: شکست قرارداد باید با OpenAPI/type tests تشخیص داده شود؛ breaking change نسخه‌دار باشد.
- قرارداد داده/API: موجودیت‌های `OpenApiSpec, ApiVersion, ErrorEnvelope` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/api/v1` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `ناسازگاری کلاینت‌ها و تغییر خاموش قرارداد` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-QA-01 — Quality Engineering و E2E: کشف invariants و رفتار موجود
- فاز: `P01`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تبدیل ادعاهای تکمیل به شواهد بازتولیدپذیر؛ شیء هدف این تسک `Test suite و evidence` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تست flaky نباید با retry نامحدود سبز شود؛ test data از tenant مجزا استفاده کند.
- قرارداد داده/API: موجودیت‌های `TestRun, EvidenceManifest, ReleaseGate` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/quality` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `false green، regression و پوشش ناقص` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-QA-02 — Quality Engineering و E2E: مدل دامنه و schema
- فاز: `P01`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تبدیل ادعاهای تکمیل به شواهد بازتولیدپذیر؛ شیء هدف این تسک `Test suite و evidence` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تست flaky نباید با retry نامحدود سبز شود؛ test data از tenant مجزا استفاده کند.
- قرارداد داده/API: موجودیت‌های `TestRun, EvidenceManifest, ReleaseGate` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/quality` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `false green، regression و پوشش ناقص` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-QA-03 — Quality Engineering و E2E: migration و rollback
- فاز: `P01`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تبدیل ادعاهای تکمیل به شواهد بازتولیدپذیر؛ شیء هدف این تسک `Test suite و evidence` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تست flaky نباید با retry نامحدود سبز شود؛ test data از tenant مجزا استفاده کند.
- قرارداد داده/API: موجودیت‌های `TestRun, EvidenceManifest, ReleaseGate` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/quality` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `false green، regression و پوشش ناقص` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-QA-04 — Quality Engineering و E2E: repository contract
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تبدیل ادعاهای تکمیل به شواهد بازتولیدپذیر؛ شیء هدف این تسک `Test suite و evidence` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تست flaky نباید با retry نامحدود سبز شود؛ test data از tenant مجزا استفاده کند.
- قرارداد داده/API: موجودیت‌های `TestRun, EvidenceManifest, ReleaseGate` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/quality` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `false green، regression و پوشش ناقص` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-QA-05 — Quality Engineering و E2E: repository پایدار
- فاز: `P01`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تبدیل ادعاهای تکمیل به شواهد بازتولیدپذیر؛ شیء هدف این تسک `Test suite و evidence` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تست flaky نباید با retry نامحدود سبز شود؛ test data از tenant مجزا استفاده کند.
- قرارداد داده/API: موجودیت‌های `TestRun, EvidenceManifest, ReleaseGate` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/quality` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `false green، regression و پوشش ناقص` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-QA-06 — Quality Engineering و E2E: service/use-case
- فاز: `P01`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تبدیل ادعاهای تکمیل به شواهد بازتولیدپذیر؛ شیء هدف این تسک `Test suite و evidence` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تست flaky نباید با retry نامحدود سبز شود؛ test data از tenant مجزا استفاده کند.
- قرارداد داده/API: موجودیت‌های `TestRun, EvidenceManifest, ReleaseGate` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/quality` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `false green، regression و پوشش ناقص` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-QA-07 — Quality Engineering و E2E: API خواندن، فهرست و فیلتر
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تبدیل ادعاهای تکمیل به شواهد بازتولیدپذیر؛ شیء هدف این تسک `Test suite و evidence` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تست flaky نباید با retry نامحدود سبز شود؛ test data از tenant مجزا استفاده کند.
- قرارداد داده/API: موجودیت‌های `TestRun, EvidenceManifest, ReleaseGate` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/quality` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `false green، regression و پوشش ناقص` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-QA-08 — Quality Engineering و E2E: API ایجاد، تغییر و transition
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تبدیل ادعاهای تکمیل به شواهد بازتولیدپذیر؛ شیء هدف این تسک `Test suite و evidence` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تست flaky نباید با retry نامحدود سبز شود؛ test data از tenant مجزا استفاده کند.
- قرارداد داده/API: موجودیت‌های `TestRun, EvidenceManifest, ReleaseGate` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/quality` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `false green، regression و پوشش ناقص` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-QA-09 — Quality Engineering و E2E: concurrency و idempotency
- فاز: `P01`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تبدیل ادعاهای تکمیل به شواهد بازتولیدپذیر؛ شیء هدف این تسک `Test suite و evidence` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تست flaky نباید با retry نامحدود سبز شود؛ test data از tenant مجزا استفاده کند.
- قرارداد داده/API: موجودیت‌های `TestRun, EvidenceManifest, ReleaseGate` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/quality` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `false green، regression و پوشش ناقص` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-QA-10 — Quality Engineering و E2E: authorization و tenant scope
- فاز: `P01`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تبدیل ادعاهای تکمیل به شواهد بازتولیدپذیر؛ شیء هدف این تسک `Test suite و evidence` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تست flaky نباید با retry نامحدود سبز شود؛ test data از tenant مجزا استفاده کند.
- قرارداد داده/API: موجودیت‌های `TestRun, EvidenceManifest, ReleaseGate` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/quality` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `false green، regression و پوشش ناقص` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-QA-11 — Quality Engineering و E2E: vertical slice رابط کاربری
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تبدیل ادعاهای تکمیل به شواهد بازتولیدپذیر؛ شیء هدف این تسک `Test suite و evidence` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تست flaky نباید با retry نامحدود سبز شود؛ test data از tenant مجزا استفاده کند.
- قرارداد داده/API: موجودیت‌های `TestRun, EvidenceManifest, ReleaseGate` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/quality` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `false green، regression و پوشش ناقص` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-QA-12 — Quality Engineering و E2E: تست جامع و evidence
- فاز: `P01`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: تبدیل ادعاهای تکمیل به شواهد بازتولیدپذیر؛ شیء هدف این تسک `Test suite و evidence` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تست flaky نباید با retry نامحدود سبز شود؛ test data از tenant مجزا استفاده کند.
- قرارداد داده/API: موجودیت‌های `TestRun, EvidenceManifest, ReleaseGate` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/quality` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `false green، regression و پوشش ناقص` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P01 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEPLOY-01 — CI/CD، staging و release governance: کشف invariants و رفتار موجود
- فاز: `P14`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: انتشار immutable، قابل rollback و دارای تأیید انسانی؛ شیء هدف این تسک `ReleaseArtifact` است.
- گام اجرا ۱: کد، README، قراردادهای فعلی و تست‌های موجود را بررسی کن؛ تفاوت سند و پیاده‌سازی را در ADR/issue ثبت کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تولید build و push/deploy production از هم جدا باشد و deploy نیازمند approval صریح باشد.
- قرارداد داده/API: موجودیت‌های `ReleaseArtifact, Deployment, ApprovalRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/releases` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `انتشار ناخواسته و rollback ناممکن` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEPLOY-02 — CI/CD، staging و release governance: مدل دامنه و schema
- فاز: `P14`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: انتشار immutable، قابل rollback و دارای تأیید انسانی؛ شیء هدف این تسک `ReleaseArtifact` است.
- گام اجرا ۱: مدل را با شناسه tenant، timestamps، ownership، soft-delete policy و constraints لازم تعریف کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تولید build و push/deploy production از هم جدا باشد و deploy نیازمند approval صریح باشد.
- قرارداد داده/API: موجودیت‌های `ReleaseArtifact, Deployment, ApprovalRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/releases` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `انتشار ناخواسته و rollback ناممکن` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEPLOY-03 — CI/CD، staging و release governance: migration و rollback
- فاز: `P14`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: انتشار immutable، قابل rollback و دارای تأیید انسانی؛ شیء هدف این تسک `ReleaseArtifact` است.
- گام اجرا ۱: migration را deterministic طراحی کن؛ index و constraintها را اضافه کن؛ rollback یا forward-fix قابل توضیح باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تولید build و push/deploy production از هم جدا باشد و deploy نیازمند approval صریح باشد.
- قرارداد داده/API: موجودیت‌های `ReleaseArtifact, Deployment, ApprovalRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/releases` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `انتشار ناخواسته و rollback ناممکن` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEPLOY-04 — CI/CD، staging و release governance: repository contract
- فاز: `P14`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: انتشار immutable، قابل rollback و دارای تأیید انسانی؛ شیء هدف این تسک `ReleaseArtifact` است.
- گام اجرا ۱: interface مستقل از ORM بساز؛ query semantics، pagination، filters و transaction boundary را مستند کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تولید build و push/deploy production از هم جدا باشد و deploy نیازمند approval صریح باشد.
- قرارداد داده/API: موجودیت‌های `ReleaseArtifact, Deployment, ApprovalRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/releases` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `انتشار ناخواسته و rollback ناممکن` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEPLOY-05 — CI/CD، staging و release governance: repository پایدار
- فاز: `P14`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: انتشار immutable، قابل rollback و دارای تأیید انسانی؛ شیء هدف این تسک `ReleaseArtifact` است.
- گام اجرا ۱: پیاده‌سازی production بر PostgreSQL/Prisma بساز؛ InMemory فقط در تست یا demo ایزوله مجاز باشد.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تولید build و push/deploy production از هم جدا باشد و deploy نیازمند approval صریح باشد.
- قرارداد داده/API: موجودیت‌های `ReleaseArtifact, Deployment, ApprovalRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/releases` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `انتشار ناخواسته و rollback ناممکن` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEPLOY-06 — CI/CD، staging و release governance: service/use-case
- فاز: `P14`؛ اولویت: `P1`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: انتشار immutable، قابل rollback و دارای تأیید انسانی؛ شیء هدف این تسک `ReleaseArtifact` است.
- گام اجرا ۱: منطق تجاری را از controller جدا کن؛ invariantها و side effectها را در service enforce کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تولید build و push/deploy production از هم جدا باشد و deploy نیازمند approval صریح باشد.
- قرارداد داده/API: موجودیت‌های `ReleaseArtifact, Deployment, ApprovalRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/releases` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `انتشار ناخواسته و rollback ناممکن` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEPLOY-07 — CI/CD، staging و release governance: API خواندن، فهرست و فیلتر
- فاز: `P14`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: انتشار immutable، قابل rollback و دارای تأیید انسانی؛ شیء هدف این تسک `ReleaseArtifact` است.
- گام اجرا ۱: endpointهای list/detail با pagination، sorting، filtering، response schema و error envelope بساز.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تولید build و push/deploy production از هم جدا باشد و deploy نیازمند approval صریح باشد.
- قرارداد داده/API: موجودیت‌های `ReleaseArtifact, Deployment, ApprovalRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/releases` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `انتشار ناخواسته و rollback ناممکن` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEPLOY-08 — CI/CD، staging و release governance: API ایجاد، تغییر و transition
- فاز: `P14`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: انتشار immutable، قابل rollback و دارای تأیید انسانی؛ شیء هدف این تسک `ReleaseArtifact` است.
- گام اجرا ۱: create/update/archive و transitionها را با DTO validation، permission و status code سازگار پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تولید build و push/deploy production از هم جدا باشد و deploy نیازمند approval صریح باشد.
- قرارداد داده/API: موجودیت‌های `ReleaseArtifact, Deployment, ApprovalRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/releases` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `انتشار ناخواسته و rollback ناممکن` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEPLOY-09 — CI/CD، staging و release governance: concurrency و idempotency
- فاز: `P14`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: انتشار immutable، قابل rollback و دارای تأیید انسانی؛ شیء هدف این تسک `ReleaseArtifact` است.
- گام اجرا ۱: raceها، retryها، duplicate submission و optimistic locking یا unique constraints را پوشش بده.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تولید build و push/deploy production از هم جدا باشد و deploy نیازمند approval صریح باشد.
- قرارداد داده/API: موجودیت‌های `ReleaseArtifact, Deployment, ApprovalRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/releases` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `انتشار ناخواسته و rollback ناممکن` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEPLOY-10 — CI/CD، staging و release governance: authorization و tenant scope
- فاز: `P14`؛ اولویت: `P0`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: انتشار immutable، قابل rollback و دارای تأیید انسانی؛ شیء هدف این تسک `ReleaseArtifact` است.
- گام اجرا ۱: مجوز هر action را در server اعمال کن؛ تست negative برای resource شناخته‌شده متعلق به tenant دیگر بنویس.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تولید build و push/deploy production از هم جدا باشد و deploy نیازمند approval صریح باشد.
- قرارداد داده/API: موجودیت‌های `ReleaseArtifact, Deployment, ApprovalRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/releases` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `انتشار ناخواسته و rollback ناممکن` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEPLOY-11 — CI/CD، staging و release governance: vertical slice رابط کاربری
- فاز: `P14`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: انتشار immutable، قابل rollback و دارای تأیید انسانی؛ شیء هدف این تسک `ReleaseArtifact` است.
- گام اجرا ۱: list/detail/form در route واقعی با loading, empty, error, permission-denied و responsive behavior پیاده کن.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تولید build و push/deploy production از هم جدا باشد و deploy نیازمند approval صریح باشد.
- قرارداد داده/API: موجودیت‌های `ReleaseArtifact, Deployment, ApprovalRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/releases` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `انتشار ناخواسته و rollback ناممکن` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

### CRM-DEPLOY-12 — CI/CD، staging و release governance: تست جامع و evidence
- فاز: `P14`؛ اولویت: `P2`؛ اندازه اولیه: `M`؛ مالک: بر اساس RACI فاز.
- نتیجه مورد انتظار: انتشار immutable، قابل rollback و دارای تأیید انسانی؛ شیء هدف این تسک `ReleaseArtifact` است.
- گام اجرا ۱: unit + integration با PostgreSQL + E2E با assertion تجاری اجرا شود؛ evidence به commit و CI run متصل شود.
- گام اجرا ۲: قاعده اختصاصی را enforce کن: تولید build و push/deploy production از هم جدا باشد و deploy نیازمند approval صریح باشد.
- قرارداد داده/API: موجودیت‌های `ReleaseArtifact, Deployment, ApprovalRecord` باید type-safe، tenant-aware و سازگار با error envelope عمومی باشند.
- UX/UI: در route `/admin/releases` وضعیت loading، empty، error، permission-denied، success و responsive behavior مشخص و قابل تست باشد.
- امنیت/ریسک: ریسک اصلی `انتشار ناخواسته و rollback ناممکن` است؛ threat/abuse case را به تست negative و telemetry متصل کن.
- تست حداقلی: unit برای invariant؛ integration با PostgreSQL واقعی؛ E2E با کاربر و tenant تست مستقل؛ regression برای permission و retry.
- معیار پذیرش A: عملیات happy path از رابط تا DB کامل است و reload/restart داده را از بین نمی‌برد.
- معیار پذیرش B: درخواست غیرمجاز و cross-tenant با پاسخ عمومی مناسب رد می‌شود؛ داده حساس یا وجود رکورد افشا نمی‌شود.
- معیار پذیرش C: CI این تست‌ها را اجرا می‌کند؛ هیچ mock دائمی یا fallback خاموشی در Production باقی نمی‌ماند.
- شواهد لازم: PR، commit SHA، CI run URL، test names، migration ID، screenshot/video بدون PII و reviewer مستقل.
- وابستگی/rollback: وابستگی به P01، P02 و P14 را در backlog نگاشت کن؛ migration rollback/forward-fix باید ثبت شود.

## Route Inventory: قرارداد مسیرهای مستقل محصول

مسیرهای زیر، پیشنهاد مرجع برای architecture نهایی‌اند؛ قبل از پیاده‌سازی باید با `apps/web` واقعی تطبیق داده شوند. اگر route فعلی داخل tab state پیاده شده، route آن را در backlog به‌عنوان migration ثبت کنید.
هر route حیاتی باید مستقیم باز شود، پس از refresh حفظ شود، با browser back/forward سازگار باشد و authorization را در API اعمال کند.

### ROUTE-001 — `/app`
- عنوان: Workspace overview؛ دامنه: `PLAT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-002 — `/app/activity`
- عنوان: Recent activity؛ دامنه: `PLAT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-003 — `/app/favorites`
- عنوان: Favorites؛ دامنه: `PLAT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-004 — `/app/shortcuts`
- عنوان: Shortcuts؛ دامنه: `PLAT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-005 — `/auth/login`
- عنوان: Login؛ دامنه: `AUTH`؛ نوع: `auth`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Anonymous. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-006 — `/auth/forgot-password`
- عنوان: Forgot password؛ دامنه: `AUTH`؛ نوع: `auth`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Anonymous. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-007 — `/auth/reset-password`
- عنوان: Reset password؛ دامنه: `AUTH`؛ نوع: `auth`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Anonymous. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-008 — `/auth/verify`
- عنوان: Verify identity؛ دامنه: `AUTH`؛ نوع: `auth`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Anonymous. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-009 — `/auth/mfa`
- عنوان: MFA challenge؛ دامنه: `AUTH`؛ نوع: `auth`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Anonymous. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-010 — `/auth/logout`
- عنوان: Logout callback؛ دامنه: `AUTH`؛ نوع: `system`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Authenticated. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-011 — `/auth/sessions`
- عنوان: Active sessions؛ دامنه: `AUTH`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-012 — `/settings/organization`
- عنوان: Organization profile؛ دامنه: `TEN`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-013 — `/settings/organization/members`
- عنوان: Organization members؛ دامنه: `TEN`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-014 — `/settings/organization/security`
- عنوان: Tenant security؛ دامنه: `TEN`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-015 — `/settings/organization/data-retention`
- عنوان: Data retention؛ دامنه: `TEN`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Owner, Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-016 — `/settings/roles`
- عنوان: Roles list؛ دامنه: `RBAC`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-017 — `/settings/roles/new`
- عنوان: Create role؛ دامنه: `RBAC`؛ نوع: `form`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Owner, Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-018 — `/settings/roles/[roleId]`
- عنوان: Role detail؛ دامنه: `RBAC`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Owner, Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-019 — `/settings/permissions`
- عنوان: Permission matrix؛ دامنه: `RBAC`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Owner, Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-020 — `/settings/users`
- عنوان: User directory؛ دامنه: `USER`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-021 — `/settings/users/invitations`
- عنوان: Invitations؛ دامنه: `USER`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-022 — `/settings/teams`
- عنوان: Teams؛ دامنه: `USER`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-023 — `/settings/departments`
- عنوان: Departments؛ دامنه: `USER`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-024 — `/settings/profile`
- عنوان: My profile؛ دامنه: `USER`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-025 — `/settings/preferences`
- عنوان: Preferences؛ دامنه: `I18N`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-026 — `/crm/accounts`
- عنوان: Accounts list؛ دامنه: `ACCT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-027 — `/crm/accounts/new`
- عنوان: Create account؛ دامنه: `ACCT`؛ نوع: `form`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-028 — `/crm/accounts/[accountId]`
- عنوان: Account detail؛ دامنه: `ACCT`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-029 — `/crm/accounts/[accountId]/timeline`
- عنوان: Account timeline؛ دامنه: `ACCT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-030 — `/crm/accounts/duplicates`
- عنوان: Duplicate review؛ دامنه: `ACCT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: CRM Admin, Manager. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-031 — `/crm/contacts`
- عنوان: Contacts list؛ دامنه: `CONTACT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-032 — `/crm/contacts/new`
- عنوان: Create contact؛ دامنه: `CONTACT`؛ نوع: `form`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-033 — `/crm/contacts/[contactId]`
- عنوان: Contact detail؛ دامنه: `CONTACT`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-034 — `/crm/contacts/import`
- عنوان: Import contacts؛ دامنه: `CONTACT`؛ نوع: `wizard`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: CRM Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-035 — `/crm/leads`
- عنوان: Leads inbox؛ دامنه: `LEAD`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-036 — `/crm/leads/new`
- عنوان: Create lead؛ دامنه: `LEAD`؛ نوع: `form`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-037 — `/crm/leads/[leadId]`
- عنوان: Lead detail؛ دامنه: `LEAD`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-038 — `/crm/leads/forms`
- عنوان: Lead capture forms؛ دامنه: `LEAD`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-039 — `/crm/leads/scoring`
- عنوان: Lead scoring rules؛ دامنه: `LEAD`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: CRM Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-040 — `/crm/leads/convert/[leadId]`
- عنوان: Convert lead؛ دامنه: `LEAD`؛ نوع: `wizard`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-041 — `/crm/opportunities`
- عنوان: Opportunities list؛ دامنه: `DEAL`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-042 — `/crm/pipeline`
- عنوان: Pipeline board؛ دامنه: `DEAL`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-043 — `/crm/pipelines`
- عنوان: Pipeline settings؛ دامنه: `DEAL`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: CRM Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-044 — `/crm/opportunities/new`
- عنوان: Create opportunity؛ دامنه: `DEAL`؛ نوع: `form`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-045 — `/crm/opportunities/[opportunityId]`
- عنوان: Opportunity detail؛ دامنه: `DEAL`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-046 — `/crm/forecast`
- عنوان: Sales forecast؛ دامنه: `DEAL`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Sales Manager, Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-047 — `/crm/loss-reasons`
- عنوان: Loss reasons؛ دامنه: `DEAL`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: CRM Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-048 — `/crm/products`
- عنوان: Product catalog؛ دامنه: `PRODUCT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-049 — `/crm/products/new`
- عنوان: Create product؛ دامنه: `PRODUCT`؛ نوع: `form`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-050 — `/crm/products/[productId]`
- عنوان: Product detail؛ دامنه: `PRODUCT`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-051 — `/crm/quotes`
- عنوان: Quotes list؛ دامنه: `PRODUCT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-052 — `/crm/quotes/new`
- عنوان: Create quote؛ دامنه: `PRODUCT`؛ نوع: `form`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-053 — `/crm/quotes/[quoteId]`
- عنوان: Quote detail؛ دامنه: `PRODUCT`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-054 — `/crm/price-books`
- عنوان: Price books؛ دامنه: `PRODUCT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: CRM Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-055 — `/activities`
- عنوان: Activities list؛ دامنه: `ACT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-056 — `/activities/calendar`
- عنوان: Calendar؛ دامنه: `ACT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-057 — `/activities/calls`
- عنوان: Calls؛ دامنه: `ACT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-058 — `/activities/meetings`
- عنوان: Activity meetings؛ دامنه: `ACT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-059 — `/activities/reminders`
- عنوان: Reminders؛ دامنه: `ACT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-060 — `/activities/[activityId]`
- عنوان: Activity detail؛ دامنه: `ACT`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-061 — `/work/tasks`
- عنوان: Tasks list؛ دامنه: `TASK`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-062 — `/work/my-tasks`
- عنوان: My tasks؛ دامنه: `TASK`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-063 — `/work/boards`
- عنوان: Boards index؛ دامنه: `TASK`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-064 — `/work/boards/[boardId]`
- عنوان: Board view؛ دامنه: `TASK`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-065 — `/work/backlog`
- عنوان: Backlog؛ دامنه: `TASK`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-066 — `/work/sprints`
- عنوان: Sprint planning؛ دامنه: `TASK`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-067 — `/work/tasks/[taskId]`
- عنوان: Task detail؛ دامنه: `TASK`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-068 — `/work/tasks/[taskId]/activity`
- عنوان: Task activity؛ دامنه: `TASK`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-069 — `/work/workflows`
- عنوان: Task workflows؛ دامنه: `TASK`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Workspace Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-070 — `/work/projects`
- عنوان: Projects list؛ دامنه: `PROJ`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-071 — `/work/projects/new`
- عنوان: Create project؛ دامنه: `PROJ`؛ نوع: `form`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-072 — `/work/projects/[projectId]`
- عنوان: Project overview؛ دامنه: `PROJ`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-073 — `/work/projects/[projectId]/plan`
- عنوان: Project WBS؛ دامنه: `PROJ`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-074 — `/work/projects/[projectId]/milestones`
- عنوان: Milestones؛ دامنه: `PROJ`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-075 — `/work/projects/[projectId]/risks`
- عنوان: Risks and blockers؛ دامنه: `PROJ`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-076 — `/work/portfolio`
- عنوان: Project portfolio؛ دامنه: `PROJ`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Executive, PMO. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-077 — `/work/time`
- عنوان: Time tracker؛ دامنه: `TIME`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-078 — `/work/timesheets`
- عنوان: Timesheets؛ دامنه: `TIME`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-079 — `/work/time/approvals`
- عنوان: Time approvals؛ دامنه: `TIME`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Manager, Finance. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-080 — `/support/tickets`
- عنوان: Ticket queue؛ دامنه: `SUP`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-081 — `/support/tickets/new`
- عنوان: Create ticket؛ دامنه: `SUP`؛ نوع: `form`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-082 — `/support/tickets/[ticketId]`
- عنوان: Ticket detail؛ دامنه: `SUP`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-083 — `/support/queues`
- عنوان: Queues؛ دامنه: `SUP`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Support Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-084 — `/support/sla`
- عنوان: SLA policies؛ دامنه: `SUP`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Support Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-085 — `/support/macros`
- عنوان: Response macros؛ دامنه: `SUP`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Support Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-086 — `/support/knowledge`
- عنوان: Knowledge base admin؛ دامنه: `SUP`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-087 — `/portal`
- عنوان: Customer portal home؛ دامنه: `PORTAL`؛ نوع: `portal`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Portal User. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-088 — `/portal/requests`
- عنوان: My requests؛ دامنه: `PORTAL`؛ نوع: `portal`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Portal User. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-089 — `/portal/requests/[requestId]`
- عنوان: Customer request detail؛ دامنه: `PORTAL`؛ نوع: `portal`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Portal User. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-090 — `/portal/knowledge`
- عنوان: Help center؛ دامنه: `PORTAL`؛ نوع: `portal`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Portal User. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-091 — `/portal/satisfaction/[ticketId]`
- عنوان: CSAT survey؛ دامنه: `PORTAL`؛ نوع: `portal`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Portal User. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-092 — `/portal/profile`
- عنوان: Portal profile؛ دامنه: `PORTAL`؛ نوع: `portal`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Portal User. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-093 — `/settings/custom-fields`
- عنوان: Custom fields؛ دامنه: `CUSTOM`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Workspace Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-094 — `/settings/forms`
- عنوان: Form builder؛ دامنه: `CUSTOM`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Workspace Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-095 — `/documents`
- عنوان: Document spaces؛ دامنه: `DOC`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-096 — `/documents/folders/[folderId]`
- عنوان: Folder contents؛ دامنه: `DOC`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-097 — `/documents/[documentId]`
- عنوان: Document detail؛ دامنه: `DOC`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-098 — `/documents/[documentId]/versions`
- عنوان: Document versions؛ دامنه: `DOC`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-099 — `/office/letters`
- عنوان: Letters register؛ دامنه: `LETTER`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-100 — `/office/letters/new`
- عنوان: Create letter؛ دامنه: `LETTER`؛ نوع: `form`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Office Staff, Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-101 — `/office/letters/[letterId]`
- عنوان: Letter detail؛ دامنه: `LETTER`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-102 — `/office/letters/[letterId]/refer`
- عنوان: Refer letter؛ دامنه: `LETTER`؛ نوع: `modal`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Office Staff, Manager. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-103 — `/office/meetings`
- عنوان: Meeting list؛ دامنه: `MEET`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-104 — `/office/meetings/new`
- عنوان: Schedule meeting؛ دامنه: `MEET`؛ نوع: `form`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-105 — `/office/meetings/[meetingId]`
- عنوان: Meeting detail؛ دامنه: `MEET`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-106 — `/office/meetings/[meetingId]/minutes`
- عنوان: Meeting minutes؛ دامنه: `MEET`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-107 — `/office/approvals`
- عنوان: Approval inbox؛ دامنه: `MEET`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-108 — `/automation/workflows`
- عنوان: Workflow list؛ دامنه: `AUTO`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Workspace Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-109 — `/settings/audit-log/[eventId]`
- عنوان: Audit event detail؛ دامنه: `AUDIT`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Security Admin, Auditor. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-110 — `/settings/integrations/[integrationId]`
- عنوان: Integration detail؛ دامنه: `INTEG`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Workspace Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-111 — `/settings/api-keys/new`
- عنوان: Create API key؛ دامنه: `INTEG`؛ نوع: `form`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Workspace Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-112 — `/admin/jobs/[jobId]`
- عنوان: Background job detail؛ دامنه: `OBS`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: SRE, Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-113 — `/admin/backups/[backupId]`
- عنوان: Backup detail؛ دامنه: `BACKUP`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: SRE, Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-114 — `/reports/scheduled`
- عنوان: Scheduled reports؛ دامنه: `REPORT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Analyst, Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-115 — `/crm/customer-360/[customerId]`
- عنوان: Customer 360؛ دامنه: `ACCT`؛ نوع: `detail`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-116 — `/work/projects/[projectId]/timeline`
- عنوان: Project timeline؛ دامنه: `PROJ`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-117 — `/work/projects/[projectId]/team`
- عنوان: Project team؛ دامنه: `PROJ`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Admin, Manager, Member. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-118 — `/support/reports`
- عنوان: Support analytics؛ دامنه: `SUP`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Support Manager. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-119 — `/portal/notifications`
- عنوان: Customer portal notifications؛ دامنه: `PORTAL`؛ نوع: `portal`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Portal User. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

### ROUTE-120 — `/settings/retention`
- عنوان: Retention rules؛ دامنه: `AUDIT`؛ نوع: `page`؛ اولویت: `P1`.
- نقش‌های مورد انتظار: Privacy Admin. دسترسی واقعی از policy سرور به‌دست آید، نه فقط navigation visibility.
- معیار UX/test: route واقعی با direct URL، refresh، back/forward، loading/error/empty، permission و responsive test.

## قرارداد API مشترک

### API-Versioning
- قاعده: تمام endpointهای public از prefix `/api/v1` استفاده کنند؛ breaking change نیازمند versioning و deprecation policy است.
- پذیرش: unit/contract test و مثال مستند در OpenAPI وجود دارد.
- Evidence: test result + generated API spec + review sign-off.

### API-Request IDs
- قاعده: هر درخواست requestId/correlationId دریافت کند و در response header و structured log ثبت شود.
- پذیرش: unit/contract test و مثال مستند در OpenAPI وجود دارد.
- Evidence: test result + generated API spec + review sign-off.

### API-Error envelope
- قاعده: خطاها `code`, `message`, `requestId`, `fieldErrors?` داشته باشند؛ stack trace و internal exception به client ارسال نشود.
- پذیرش: unit/contract test و مثال مستند در OpenAPI وجود دارد.
- Evidence: test result + generated API spec + review sign-off.

### API-Pagination
- قاعده: list endpointها cursor یا page pagination مشخص داشته باشند؛ limit server-side cap شود و sorting whitelist داشته باشد.
- پذیرش: unit/contract test و مثال مستند در OpenAPI وجود دارد.
- Evidence: test result + generated API spec + review sign-off.

### API-Filtering
- قاعده: فیلترها schema-validated باشند؛ field name دلخواه مستقیماً به ORM query منتقل نشود.
- پذیرش: unit/contract test و مثال مستند در OpenAPI وجود دارد.
- Evidence: test result + generated API spec + review sign-off.

### API-Idempotency
- قاعده: writeهای پرخطر و endpointهای قابل retry کلید idempotency و TTL روشن داشته باشند.
- پذیرش: unit/contract test و مثال مستند در OpenAPI وجود دارد.
- Evidence: test result + generated API spec + review sign-off.

### API-Concurrency
- قاعده: برای recordهای مشترک version/updatedAt check یا optimistic lock اعمال شود و conflict به 409 تبدیل شود.
- پذیرش: unit/contract test و مثال مستند در OpenAPI وجود دارد.
- Evidence: test result + generated API spec + review sign-off.

### API-Authorization
- قاعده: هر request پیش از read/write توسط policy دامنه و tenant scope بررسی شود.
- پذیرش: unit/contract test و مثال مستند در OpenAPI وجود دارد.
- Evidence: test result + generated API spec + review sign-off.

### API-Rate limiting
- قاعده: auth، public forms، OTP، export و webhook ingress محدودیت مستقل و telemetry داشته باشند.
- پذیرش: unit/contract test و مثال مستند در OpenAPI وجود دارد.
- Evidence: test result + generated API spec + review sign-off.

### API-OpenAPI
- قاعده: schemaها از implementation تولید یا contract-test شوند؛ doc زنده با رفتار واقعی ناسازگار نباشد.
- پذیرش: unit/contract test و مثال مستند در OpenAPI وجود دارد.
- Evidence: test result + generated API spec + review sign-off.

### API-Data validation
- قاعده: اعتبارسنجی سرور مرجع نهایی است؛ client validation فقط برای تجربه بهتر است.
- پذیرش: unit/contract test و مثال مستند در OpenAPI وجود دارد.
- Evidence: test result + generated API spec + review sign-off.

### API-Time handling
- قاعده: timestampها timezone-aware ذخیره شوند؛ timezone کاربر فقط برای input/display استفاده شود.
- پذیرش: unit/contract test و مثال مستند در OpenAPI وجود دارد.
- Evidence: test result + generated API spec + review sign-off.

### API-Money
- قاعده: مبالغ با decimal و currency code ذخیره شوند؛ float برای محاسبه مالی ممنوع است.
- پذیرش: unit/contract test و مثال مستند در OpenAPI وجود دارد.
- Evidence: test result + generated API spec + review sign-off.

### API-Events
- قاعده: event payload دارای schema version، tenant scope، correlationId و PII minimization باشد.
- پذیرش: unit/contract test و مثال مستند در OpenAPI وجود دارد.
- Evidence: test result + generated API spec + review sign-off.

### API-Bulk operations
- قاعده: فایل بزرگ به background job تبدیل شود؛ نتیجه هر رکورد و error row قابل مشاهده باشد.
- پذیرش: unit/contract test و مثال مستند در OpenAPI وجود دارد.
- Evidence: test result + generated API spec + review sign-off.

## قرارداد داده، migration و tenancy

### DATA-Tenant column
- الزام: هر جدول tenant-owned باید tenantId داشته باشد یا رابطه ownership آن از FKهای enforce شده قابل اثبات باشد.
- تست: migration از صفر، migration از نسخه قبلی و negative tenant tests اجرا شوند.
- ممنوع: تغییر destructive روی داده واقعی بدون backup و approval.

### DATA-Composite constraints
- الزام: uniqueهای دامنه‌ای مانند نام، شماره اندیکاتور یا external ID در scope مناسب tenant تعریف شوند.
- تست: migration از صفر، migration از نسخه قبلی و negative tenant tests اجرا شوند.
- ممنوع: تغییر destructive روی داده واقعی بدون backup و approval.

### DATA-FK policy
- الزام: حذف cascade فقط وقتی مجاز است که retention و business rules آن را تأیید کنند؛ در غیر این صورت archive/restrict.
- تست: migration از صفر، migration از نسخه قبلی و negative tenant tests اجرا شوند.
- ممنوع: تغییر destructive روی داده واقعی بدون backup و approval.

### DATA-Soft delete
- الزام: soft delete باید semantic روشن، unique behavior مشخص و queryهای پیش‌فرض محدود داشته باشد.
- تست: migration از صفر، migration از نسخه قبلی و negative tenant tests اجرا شوند.
- ممنوع: تغییر destructive روی داده واقعی بدون backup و approval.

### DATA-Indexes
- الزام: index بر اساس query plan و cardinality طراحی شود؛ index بلااستفاده و هزینه write مستند شود.
- تست: migration از صفر، migration از نسخه قبلی و negative tenant tests اجرا شوند.
- ممنوع: تغییر destructive روی داده واقعی بدون backup و approval.

### DATA-Migrations
- الزام: migrationها فقط additive در releaseهای چندمرحله‌ای باشند؛ remove/rename با expand-contract اجرا شود.
- تست: migration از صفر، migration از نسخه قبلی و negative tenant tests اجرا شوند.
- ممنوع: تغییر destructive روی داده واقعی بدون backup و approval.

### DATA-Seed data
- الزام: seed دمو فقط در dev/test و با flag واضح اجرا شود؛ Production startup نباید sample user بسازد.
- تست: migration از صفر، migration از نسخه قبلی و negative tenant tests اجرا شوند.
- ممنوع: تغییر destructive روی داده واقعی بدون backup و approval.

### DATA-Transactions
- الزام: چند record مرتبط و outbox insert باید در یک transaction انجام شوند.
- تست: migration از صفر، migration از نسخه قبلی و negative tenant tests اجرا شوند.
- ممنوع: تغییر destructive روی داده واقعی بدون backup و approval.

### DATA-RLS consideration
- الزام: در صورت استفاده از PostgreSQL RLS، connection pooling و set_config tenant context دقیق آزمایش شود.
- تست: migration از صفر، migration از نسخه قبلی و negative tenant tests اجرا شوند.
- ممنوع: تغییر destructive روی داده واقعی بدون backup و approval.

### DATA-Data retention
- الزام: retention policy برای هر entity و attachment تعریف شود؛ حذف قانونی و hold قانونی با هم سازگار باشند.
- تست: migration از صفر، migration از نسخه قبلی و negative tenant tests اجرا شوند.
- ممنوع: تغییر destructive روی داده واقعی بدون backup و approval.

### DATA-Backup restore
- الزام: restore در محیط جدا با checksum، row count sanity و migration compatibility آزمایش شود.
- تست: migration از صفر، migration از نسخه قبلی و negative tenant tests اجرا شوند.
- ممنوع: تغییر destructive روی داده واقعی بدون backup و approval.

### DATA-PII classification
- الزام: هر field به public/internal/confidential/restricted طبقه‌بندی و retention/access تعیین شود.
- تست: migration از صفر، migration از نسخه قبلی و negative tenant tests اجرا شوند.
- ممنوع: تغییر destructive روی داده واقعی بدون backup و approval.

## Design System و استاندارد UX

### UX-Tokens
- استاندارد: color, spacing, typography, radius, shadow, z-index, density و motion در tokenهای نسخه‌دار تعریف شوند.
- پذیرش: checklist دستی + automated accessibility checks + responsive screenshots ثبت شود.

### UX-App shell
- استاندارد: sidebar، header، workspace switcher، global search، command palette، breadcrumbs و responsive nav یک قرارداد مشترک دارند.
- پذیرش: checklist دستی + automated accessibility checks + responsive screenshots ثبت شود.

### UX-Tables
- استاندارد: sorting، filtering، column visibility، pagination، selection، empty state و keyboard access رفتار استاندارد داشته باشند.
- پذیرش: checklist دستی + automated accessibility checks + responsive screenshots ثبت شود.

### UX-Forms
- استاندارد: label، hint، required، validation، dirty-state، unsaved-change warning و submit pending تعریف شوند.
- پذیرش: checklist دستی + automated accessibility checks + responsive screenshots ثبت شود.

### UX-Feedback
- استاندارد: success فقط پس از server ack؛ optimistic state باید قابل rollback و به کاربر قابل فهم باشد.
- پذیرش: checklist دستی + automated accessibility checks + responsive screenshots ثبت شود.

### UX-Error states
- استاندارد: خطای شبکه، 401، 403، 404، 409، 422، 429 و 5xx پیام و action متناسب داشته باشند.
- پذیرش: checklist دستی + automated accessibility checks + responsive screenshots ثبت شود.

### UX-Empty states
- استاندارد: empty نتیجه search با empty dataset و empty permission از هم جدا شوند.
- پذیرش: checklist دستی + automated accessibility checks + responsive screenshots ثبت شود.

### UX-Loading
- استاندارد: skeleton فقط وقتی ساختار پایدار است؛ spinner بی‌انتهای بدون timeout/retry ممنوع.
- پذیرش: checklist دستی + automated accessibility checks + responsive screenshots ثبت شود.

### UX-Responsive
- استاندارد: حداقل mobile narrow، mobile wide، tablet، desktop و ultrawide در visual regression بررسی شوند.
- پذیرش: checklist دستی + automated accessibility checks + responsive screenshots ثبت شود.

### UX-RTL
- استاندارد: ترتیب visual و keyboard در RTL آگاهانه تعریف شود؛ icon directionality و bidirectional text تست شود.
- پذیرش: checklist دستی + automated accessibility checks + responsive screenshots ثبت شود.

### UX-Keyboard
- استاندارد: تمام actionهای اصلی بدون mouse در دسترس باشند؛ focus visible و focus restoration تعریف شود.
- پذیرش: checklist دستی + automated accessibility checks + responsive screenshots ثبت شود.

### UX-Accessibility
- استاندارد: هدف WCAG 2.2 AA برای جریان‌های اصلی؛ contrast، labels، headings، dialogs و status announcements تست شوند.
- پذیرش: checklist دستی + automated accessibility checks + responsive screenshots ثبت شود.

### UX-Motion
- استاندارد: prefers-reduced-motion رعایت شود؛ animation نباید feedback یا task completion را پنهان کند.
- پذیرش: checklist دستی + automated accessibility checks + responsive screenshots ثبت شود.

### UX-Consistency
- استاندارد: هر page قبل از ساخت component محلی، design-system component موجود را ارزیابی کند.
- پذیرش: checklist دستی + automated accessibility checks + responsive screenshots ثبت شود.

## ماتریس تست اجباری برای هر دامنه

### TEST-PLAT-01 — Happy path
- سناریو: برای دامنه هسته پلتفرم و Workspace، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-AUTH-01 — Happy path
- سناریو: برای دامنه هویت، ورود و نشست، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-TEN-01 — Happy path
- سناریو: برای دامنه چندمستأجری و جداسازی سازمان، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-RBAC-01 — Happy path
- سناریو: برای دامنه نقش‌ها، مجوزها و سیاست‌ها، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-USER-01 — Happy path
- سناریو: برای دامنه کاربران، تیم‌ها و ساختار سازمانی، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-DS-01 — Happy path
- سناریو: برای دامنه Design System و کامپوننت‌های مشترک، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-ROUTE-01 — Happy path
- سناریو: برای دامنه معماری Route و ناوبری، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-ACCT-01 — Happy path
- سناریو: برای دامنه حساب‌های مشتری و سازمان‌های مشتری، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-CONTACT-01 — Happy path
- سناریو: برای دامنه اشخاص و مخاطبان، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-LEAD-01 — Happy path
- سناریو: برای دامنه سرنخ‌ها و جذب لید، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-DEAL-01 — Happy path
- سناریو: برای دامنه فرصت‌ها و کاریز فروش، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-PRODUCT-01 — Happy path
- سناریو: برای دامنه کاتالوگ، قیمت، تخفیف و پیشنهاد فروش، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-ACT-01 — Happy path
- سناریو: برای دامنه فعالیت‌ها، تماس‌ها و تقویم، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-TASK-01 — Happy path
- سناریو: برای دامنه تسک‌ها، Kanban و وزن‌دهی، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-PROJ-01 — Happy path
- سناریو: برای دامنه پروژه‌ها، WBS و milestone، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-TIME-01 — Happy path
- سناریو: برای دامنه ثبت زمان و timesheet، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-SUP-01 — Happy path
- سناریو: برای دامنه مرکز پشتیبانی، Ticket و SLA، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-PORTAL-01 — Happy path
- سناریو: برای دامنه پورتال مشتری و CSAT، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-CUSTOM-01 — Happy path
- سناریو: برای دامنه فیلدهای سفارشی و فرم‌ساز، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-DOC-01 — Happy path
- سناریو: برای دامنه اسناد، فایل‌ها و نسخه‌بندی، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-LETTER-01 — Happy path
- سناریو: برای دامنه نامه‌ها و مکاتبات اداری، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-MEET-01 — Happy path
- سناریو: برای دامنه جلسات، حاضرین و مصوبه، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-AUTO-01 — Happy path
- سناریو: برای دامنه اتوماسیون و گردش‌کار، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-NOTIF-01 — Happy path
- سناریو: برای دامنه اعلان‌ها و ترجیحات ارتباطی، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-SEARCH-01 — Happy path
- سناریو: برای دامنه جست‌وجوی سراسری و saved views، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-REPORT-01 — Happy path
- سناریو: برای دامنه گزارش‌ها، KPI و داشبورد، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-AUDIT-01 — Happy path
- سناریو: برای دامنه Audit log، compliance و حریم خصوصی، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-INTEG-01 — Happy path
- سناریو: برای دامنه API، webhooks و integrations، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-IMPORT-01 — Happy path
- سناریو: برای دامنه Import، export و bulk operations، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-MOBILE-01 — Happy path
- سناریو: برای دامنه موبایل، آفلاین و sync، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-I18N-01 — Happy path
- سناریو: برای دامنه فارسی، RTL، Jalali و localization، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-OBS-01 — Happy path
- سناریو: برای دامنه Observability، jobs و resilience، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-BACKUP-01 — Happy path
- سناریو: برای دامنه Backup، restore و disaster recovery، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-BILL-01 — Happy path
- سناریو: برای دامنه اشتراک و محدودیت‌های پلن سازمانی، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-API-01 — Happy path
- سناریو: برای دامنه قراردادهای API و نسخه‌بندی، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-QA-01 — Happy path
- سناریو: برای دامنه Quality Engineering و E2E، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

### TEST-DEPLOY-01 — Happy path
- سناریو: برای دامنه CI/CD، staging و release governance، کاربر دارای نقش مجاز record را ایجاد می‌کند، در فهرست می‌بیند و پس از refresh جزئیات صحیح دریافت می‌کند.
- داده تست: tenant-A و tenant-B مجزا، actor مجاز و غیرمجاز، یک record مرزی و یک record archived.
- انتظار: نتیجه business قابل سنجش، وضعیت دیتابیس و پاسخ API assertion شوند.

## برنامه بنچمارک و استفاده از منابع خارجی

هدف بنچمارک کشف الگوهای کارآمد و معیارهای محصول است. نام بردن از محصول یا مخزن به معنی تأیید کامل کیفیت یا اجازه کپی نیست. پیش از اقتباس کد، LICENSE واقعی همان commit و پوشه/فایل بررسی شود؛ مجوز وابستگی‌های transitive و assets جدا هستند.

### BENCHMARK — دیدار CRM
- منبع: https://didar.me/
- روش بررسی: Benchmark محصول تجاری برای قیف فروش، follow-up، Customer 360، فرم لید و بومی‌سازی فارسی؛ فقط مشاهده رفتار عمومی/دمو با مجوز.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — Jira Cloud
- منبع: https://support.atlassian.com/jira-software-cloud/docs/what-is-a-jira-software-board/
- روش بررسی: Benchmark board، backlog، issue detail، status transition، sprint، filter و permission.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — Twenty CRM
- منبع: https://github.com/twentyhq/twenty
- روش بررسی: بررسی schema extensibility، modern CRM UX و developer experience؛ LICENSE هر بخش/edition را بازبینی کن.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — EspoCRM
- منبع: https://github.com/espocrm/espocrm
- روش بررسی: بررسی CRM modules، workflow، portals و model-driven records؛ repository اعلام می‌کند AGPLv3.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — SuiteCRM
- منبع: https://github.com/SuiteCRM/SuiteCRM
- روش بررسی: بررسی CRM سازمانی و breadth ماژول‌ها؛ repository اعلام می‌کند AGPLv3.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — Frappe CRM
- منبع: https://github.com/frappe/crm
- روش بررسی: بررسی focused sales CRM؛ LICENSE repository باید قبل از اقتباس مجدداً بررسی شود.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — ERPNext
- منبع: https://github.com/frappe/erpnext
- روش بررسی: بررسی ارتباط CRM با عملیات/ERP؛ اسناد رسمی GPLv3 را ذکر می‌کنند.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — Odoo Community
- منبع: https://github.com/odoo/odoo
- روش بررسی: بررسی ماژولار بودن؛ تفکیک edition و مجوز هر addon ضروری است.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — Plane
- منبع: https://github.com/makeplane/plane
- روش بررسی: بررسی work items، views، cycles، modules و docs؛ صفحه رسمی Community Edition را AGPL-3.0 معرفی می‌کند.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — Leantime
- منبع: https://github.com/leantime/leantime
- روش بررسی: بررسی مدیریت پروژه با ساده‌سازی UX، goals، kanban، Gantt و accessibility-minded design.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — Chatwoot
- منبع: https://github.com/chatwoot/chatwoot
- روش بررسی: بررسی inbox، ticket/conversation، omni-channel و support workflows؛ شاخه‌ها/edition جداگانه را بررسی کن.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — Taiga
- منبع: https://github.com/taigaio/taiga
- روش بررسی: بررسی agile project management و UX برد/sprint؛ فایل LICENSE هر component را ببین.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — Wekan
- منبع: https://github.com/wekan/wekan
- روش بررسی: بررسی kanban workflows و self-hosted operations.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — OpenProject
- منبع: https://github.com/opf/openproject
- روش بررسی: بررسی project governance، work packages، roadmap و enterprise operations.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — Budibase
- منبع: https://github.com/Budibase/budibase
- روش بررسی: بررسی low-code data/forms؛ licensing و commercial components بررسی شود.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — Appsmith
- منبع: https://github.com/appsmithorg/appsmith
- روش بررسی: بررسی internal tool builders و admin console patterns؛ نسخه و مجوز را بررسی کن.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — Directus
- منبع: https://github.com/directus/directus
- روش بررسی: بررسی data platform و permissions؛ licensing edition-specific را بازبینی کن.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — Keycloak
- منبع: https://github.com/keycloak/keycloak
- روش بررسی: مرجع identity/access management؛ جایگزین ادغام صحیح با OIDC نیست.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — OpenTelemetry
- منبع: https://github.com/open-telemetry/opentelemetry-collector
- روش بررسی: مرجع instrumentation و vendor-neutral observability.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — OWASP ASVS
- منبع: https://owasp.org/www-project-application-security-verification-standard/
- روش بررسی: معیار verification برای کنترل‌های فنی امنیت وب و API؛ baseline متناسب با ریسک انتخاب شود.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — WCAG 2.2
- منبع: https://www.w3.org/WAI/standards-guidelines/wcag/
- روش بررسی: معیار دسترس‌پذیری؛ برای جریان‌های اصلی هدف AA را بگیرید و استثناءها را مستند کنید.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

### BENCHMARK — n8n
- منبع: https://github.com/n8n-io/n8n
- روش بررسی: برای الگوهای automation فقط بررسی معماری و license؛ Sustainable Use License محدودیت‌های استفاده دارد و OSI-approved open source تلقی نمی‌شود.
- خروجی الزامی: screenshot عمومی/یادداشت رفتار/ماتریس قابلیت/تاریخ بررسی/commit یا نسخه/بررسی license.
- ممنوع: scraping پشت login، دورزدن paywall/CAPTCHA، بار زیاد، جمع‌آوری PII یا کپی asset تجاری.

## Runbookهای عملیاتی اجباری

### RB-01 — CI قرمز
- اقدام: ثبت commit و job شکست‌خورده؛ استخراج log؛ دسته‌بندی code/test/infra; بازتولید محلی؛ اصلاح ریشه‌ای؛ regression test؛ ثبت علت.
- مالک: on-call role در rota؛ جانشین مشخص شود.
- Recovery evidence: timeline، request/job IDs، mitigations، validation، decision log و follow-up issues.
- تمرین: حداقل یک‌بار در staging با synthetic data اجرا شود.

### RB-02 — احتمال cross-tenant leak
- اقدام: توقف عملیات پرریسک؛ حفظ audit و request IDs؛ بررسی دامنه و actor؛ محدودکردن endpoint؛ notification طبق incident plan؛ تست منفی قبل از بازگشایی.
- مالک: on-call role در rota؛ جانشین مشخص شود.
- Recovery evidence: timeline، request/job IDs، mitigations، validation، decision log و follow-up issues.
- تمرین: حداقل یک‌بار در staging با synthetic data اجرا شود.

### RB-03 — Database migration failure
- اقدام: توقف rollout؛ بررسی lock و partial application؛ restore point؛ استفاده از forward-fix یا rollback تأییدشده؛ verify row counts و constraints.
- مالک: on-call role در rota؛ جانشین مشخص شود.
- Recovery evidence: timeline، request/job IDs، mitigations، validation، decision log و follow-up issues.
- تمرین: حداقل یک‌بار در staging با synthetic data اجرا شود.

### RB-04 — Webhook retry storm
- اقدام: غیرفعال‌کردن endpoint آسیب‌دیده با kill switch؛ اعمال backoff/circuit breaker؛ بررسی DLQ؛ replay کنترل‌شده بعد از رفع علت.
- مالک: on-call role در rota؛ جانشین مشخص شود.
- Recovery evidence: timeline، request/job IDs، mitigations، validation، decision log و follow-up issues.
- تمرین: حداقل یک‌بار در staging با synthetic data اجرا شود.

### RB-05 — Queue lag
- اقدام: بررسی oldest message، throughput، failed jobs و DB contention؛ مقیاس‌پذیری محدود؛ اولویت‌بندی jobs؛ جلوگیری از retry storm.
- مالک: on-call role در rota؛ جانشین مشخص شود.
- Recovery evidence: timeline، request/job IDs، mitigations، validation، decision log و follow-up issues.
- تمرین: حداقل یک‌بار در staging با synthetic data اجرا شود.

### RB-06 — نشت secret
- اقدام: revocation فوری؛ rotation در secret manager؛ بررسی access logs؛ اسکن git history و artifacts؛ حذف secret از log/screenshot؛ incident record.
- مالک: on-call role در rota؛ جانشین مشخص شود.
- Recovery evidence: timeline، request/job IDs، mitigations، validation، decision log و follow-up issues.
- تمرین: حداقل یک‌بار در staging با synthetic data اجرا شود.

### RB-07 — پایین‌آمدن سرویس
- اقدام: تأیید synthetic check؛ بررسی error rate/latency/dependencies؛ اعلام incident commander؛ mitigation؛ postmortem بدون سرزنش.
- مالک: on-call role در rota؛ جانشین مشخص شود.
- Recovery evidence: timeline، request/job IDs، mitigations، validation، decision log و follow-up issues.
- تمرین: حداقل یک‌بار در staging با synthetic data اجرا شود.

### RB-08 — restore backup
- اقدام: بازیابی به محیط ایزوله؛ verify checksum، migrations، tenant count و sample business invariants؛ اعلام RPO/RTO واقعی.
- مالک: on-call role در rota؛ جانشین مشخص شود.
- Recovery evidence: timeline، request/job IDs، mitigations، validation، decision log و follow-up issues.
- تمرین: حداقل یک‌بار در staging با synthetic data اجرا شود.

### RB-09 — خرابی موبایل sync
- اقدام: حفظ local outbox؛ stop destructive retry؛ export diagnostic بدون PII؛ بررسی idempotency و conflict; replay کنترل‌شده.
- مالک: on-call role در rota؛ جانشین مشخص شود.
- Recovery evidence: timeline، request/job IDs، mitigations، validation، decision log و follow-up issues.
- تمرین: حداقل یک‌بار در staging با synthetic data اجرا شود.

### RB-10 — data import bad rows
- اقدام: توقف job؛ ذخیره mapping version و result; جلوگیری از partial duplicate; اصلاح mapping; dry-run مجدد؛ approve before commit.
- مالک: on-call role در rota؛ جانشین مشخص شود.
- Recovery evidence: timeline، request/job IDs، mitigations، validation، decision log و follow-up issues.
- تمرین: حداقل یک‌بار در staging با synthetic data اجرا شود.

## پرامپت مادر برای Coding Agent

تو یک مهندس ارشد full-stack، QA و security reviewer برای مخزن CRM هستی. تنها تسک‌های آماده و دارای ID را اجرا کن؛ فایل‌های فعلی را قبل از تغییر بخوان؛ چیزی را به‌دلیل وجود در README تکمیل‌شده فرض نکن.
1. HEAD، working tree، lockfile، scripts و CI فعلی را ثبت کن.
2. تسک انتخاب‌شده را با dependencyهای آن و acceptance criteria بخوان.
3. اول یک برنامه کوتاه از فایل‌های درگیر و خطرها بساز؛ اگر scope مبهم است، `DISCOVERY` ثبت کن و ادعای تکمیل نکن.
4. پیاده‌سازی باید end-to-end باشد؛ UI mock-only، InMemory production repository و fake success ممنوع‌اند.
5. افزودن dependency جدید مستلزم maintenance/license/security rationale است.
6. تست را اجرا کن؛ اگر محیط اجرا قادر نیست، دقیقاً بگو چه چیزی اجرا نشده و چرا؛ خروجی فرضی ننویس.
7. CI/security finding را با warning پنهان نکن؛ fail-closed معیار است.
8. قبل از پایان، diff را بررسی کن، secret/PII را جست‌وجو کن، docs را اصلاح و evidence را به commit متصل کن.
9. گزارش نهایی شامل task IDs، فایل‌ها، تست‌های واقعی و خروجی، ریسک‌های باقی‌مانده، migration/rollback و کارهای انجام‌نشده باشد.
10. هرگز push، release یا deploy production را بدون دستور روشن انسانی انجام نده.

## Definition of Ready (DoR)

- [ ] مالک محصول و مالک فنی مشخص‌اند.
- [ ] رفتار current و behavior مطلوب با مثال ثبت شده است.
- [ ] وابستگی‌ها و blockerها مشخص‌اند.
- [ ] API/data contract و permission scope معلوم است.
- [ ] UX stateها و edge caseهای اصلی تعریف شده‌اند.
- [ ] معیار پذیرش قابل مشاهده و قابل تست است.
- [ ] تست/fixture مورد نیاز مشخص است.
- [ ] ریسک مهاجرت و rollback مشخص است.
- [ ] هر نیاز خارجی دارای license/terms review است.
- [ ] اندازه تسک حداکثر یک vertical slice قابل review است.

## Definition of Done (DoD)

- [ ] کد در route/service/repository مناسب قرار دارد و مسئولیت‌ها تفکیک شده‌اند.
- [ ] هیچ shortcut امنیتی یا fallback نمایشی برای Production اضافه نشده است.
- [ ] DTO، schema، error states و authorization کامل‌اند.
- [ ] داده پایدار و migration قابل اجرا/rollback است.
- [ ] unit tests منطق دامنه را اثبات می‌کنند.
- [ ] integration tests روی PostgreSQL واقعی اجرا می‌شوند.
- [ ] E2E جریان واقعی کاربر را assertion می‌کند.
- [ ] tenant isolation و negative authorization پوشش دارند.
- [ ] accessibility و responsive behavior بررسی شده است.
- [ ] telemetry/audit برای عملیات حساس وجود دارد.
- [ ] docs و route inventory به‌روز شده‌اند.
- [ ] CI سبز است و هیچ finding مسدودکننده نادیده گرفته نشده است.
- [ ] Evidence Manifest به commit و CI run جاری اشاره می‌کند.
- [ ] reviewer غیر از نویسنده acceptance criteria را تأیید کرده است.
- [ ] هیچ ادعای فراتر از شواهد در README یا release notes نیست.

## Release Gates: شروطی که قابل دور زدن نیستند

### GATE-001 — Security
- معیار: هیچ credential نمونه یا secret پیش‌فرض در مسیر Production پذیرفته نشود.
- وضعیت تنها یکی از `PASS`, `FAIL`, `BLOCKED`, `RISK_ACCEPTED` است؛ `RISK_ACCEPTED` نیازمند owner و expiration date است.
- evidence URL یا test artifact اجباری است.

### GATE-002 — Tenant isolation
- معیار: تست negative برای read/write/search/export/file attachments همه سبز باشند.
- وضعیت تنها یکی از `PASS`, `FAIL`, `BLOCKED`, `RISK_ACCEPTED` است؛ `RISK_ACCEPTED` نیازمند owner و expiration date است.
- evidence URL یا test artifact اجباری است.

### GATE-003 — Persistence
- معیار: تمام production-critical repositoryها از database/object storage durable استفاده کنند.
- وضعیت تنها یکی از `PASS`, `FAIL`, `BLOCKED`, `RISK_ACCEPTED` است؛ `RISK_ACCEPTED` نیازمند owner و expiration date است.
- evidence URL یا test artifact اجباری است.

### GATE-004 — Migration
- معیار: migration از نسخه قبلی روی snapshot synthetic/approved بدون data loss اجرا شده باشد.
- وضعیت تنها یکی از `PASS`, `FAIL`, `BLOCKED`, `RISK_ACCEPTED` است؛ `RISK_ACCEPTED` نیازمند owner و expiration date است.
- evidence URL یا test artifact اجباری است.

### GATE-005 — CI
- معیار: lint/typecheck/unit/contract/integration/e2e/security/license/build همه اجرا و fail-closed باشند.
- وضعیت تنها یکی از `PASS`, `FAIL`, `BLOCKED`, `RISK_ACCEPTED` است؛ `RISK_ACCEPTED` نیازمند owner و expiration date است.
- evidence URL یا test artifact اجباری است.

### GATE-006 — UX routes
- معیار: تمام P0 routes deep-link، refresh، browser history، permissions و mobile viewport را می‌گذرانند.
- وضعیت تنها یکی از `PASS`, `FAIL`, `BLOCKED`, `RISK_ACCEPTED` است؛ `RISK_ACCEPTED` نیازمند owner و expiration date است.
- evidence URL یا test artifact اجباری است.

### GATE-007 — No fake success
- معیار: هیچ UI موفقیت را پیش از server acknowledgment نمایش نمی‌دهد مگر optimistic UI با rollback واضح.
- وضعیت تنها یکی از `PASS`, `FAIL`, `BLOCKED`, `RISK_ACCEPTED` است؛ `RISK_ACCEPTED` نیازمند owner و expiration date است.
- evidence URL یا test artifact اجباری است.

### GATE-008 — Observability
- معیار: درخواست و job مهم correlation ID، metric و alert دارد.
- وضعیت تنها یکی از `PASS`, `FAIL`, `BLOCKED`, `RISK_ACCEPTED` است؛ `RISK_ACCEPTED` نیازمند owner و expiration date است.
- evidence URL یا test artifact اجباری است.

### GATE-009 — Backup
- معیار: restore drill موفق و RPO/RTO ثبت‌شده است.
- وضعیت تنها یکی از `PASS`, `FAIL`, `BLOCKED`, `RISK_ACCEPTED` است؛ `RISK_ACCEPTED` نیازمند owner و expiration date است.
- evidence URL یا test artifact اجباری است.

### GATE-010 — Privacy
- معیار: PII classification، retention، data deletion/export و log minimization مشخص‌اند.
- وضعیت تنها یکی از `PASS`, `FAIL`, `BLOCKED`, `RISK_ACCEPTED` است؛ `RISK_ACCEPTED` نیازمند owner و expiration date است.
- evidence URL یا test artifact اجباری است.

### GATE-011 — Accessibility
- معیار: جریان‌های حیاتی هدف WCAG 2.2 AA را می‌گذرانند یا exception risk-accepted دارند.
- وضعیت تنها یکی از `PASS`, `FAIL`, `BLOCKED`, `RISK_ACCEPTED` است؛ `RISK_ACCEPTED` نیازمند owner و expiration date است.
- evidence URL یا test artifact اجباری است.

### GATE-012 — Performance
- معیار: load test در حجم هدف p95/p99 و error budgets مورد توافق را پاس می‌کند.
- وضعیت تنها یکی از `PASS`, `FAIL`, `BLOCKED`, `RISK_ACCEPTED` است؛ `RISK_ACCEPTED` نیازمند owner و expiration date است.
- evidence URL یا test artifact اجباری است.

### GATE-013 — Mobile sync
- معیار: تکرار mutation و offline conflict testها بدون data loss می‌گذرند.
- وضعیت تنها یکی از `PASS`, `FAIL`, `BLOCKED`, `RISK_ACCEPTED` است؛ `RISK_ACCEPTED` نیازمند owner و expiration date است.
- evidence URL یا test artifact اجباری است.

### GATE-014 — Release artifact
- معیار: SHA immutable، changelog، migration notes، rollback steps و human approver ثبت شده است.
- وضعیت تنها یکی از `PASS`, `FAIL`, `BLOCKED`, `RISK_ACCEPTED` است؛ `RISK_ACCEPTED` نیازمند owner و expiration date است.
- evidence URL یا test artifact اجباری است.

### GATE-015 — Evidence truthfulness
- معیار: manifest از همان commit/CI تولید و ادعاهای stale قبلی حذف یا archived شده‌اند.
- وضعیت تنها یکی از `PASS`, `FAIL`, `BLOCKED`, `RISK_ACCEPTED` است؛ `RISK_ACCEPTED` نیازمند owner و expiration date است.
- evidence URL یا test artifact اجباری است.

## کارت‌های بازبینی قبل از merge و release

### REVIEW-001 — تأیید HEAD و branch
- اقدام: مسئول بازبینی باید `تأیید HEAD و branch` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-002 — تأیید clean working tree
- اقدام: مسئول بازبینی باید `تأیید clean working tree` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-003 — تأیید package manager version
- اقدام: مسئول بازبینی باید `تأیید package manager version` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-004 — تأیید lockfile frozen install
- اقدام: مسئول بازبینی باید `تأیید lockfile frozen install` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-005 — تأیید Node runtime supported
- اقدام: مسئول بازبینی باید `تأیید Node runtime supported` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-006 — تأیید env variable validation
- اقدام: مسئول بازبینی باید `تأیید env variable validation` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-007 — تأیید no secret in diff
- اقدام: مسئول بازبینی باید `تأیید no secret in diff` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-008 — تأیید no customer PII in fixtures
- اقدام: مسئول بازبینی باید `تأیید no customer PII in fixtures` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-009 — تأیید no public bucket exposure
- اقدام: مسئول بازبینی باید `تأیید no public bucket exposure` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-010 — تأیید tenant context source
- اقدام: مسئول بازبینی باید `تأیید tenant context source` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-011 — تأیید policy on list endpoint
- اقدام: مسئول بازبینی باید `تأیید policy on list endpoint` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-012 — تأیید policy on detail endpoint
- اقدام: مسئول بازبینی باید `تأیید policy on detail endpoint` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-013 — تأیید policy on mutation endpoint
- اقدام: مسئول بازبینی باید `تأیید policy on mutation endpoint` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-014 — تأیید policy on background job
- اقدام: مسئول بازبینی باید `تأیید policy on background job` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-015 — تأیید policy on websocket/event
- اقدام: مسئول بازبینی باید `تأیید policy on websocket/event` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-016 — تأیید policy on search results
- اقدام: مسئول بازبینی باید `تأیید policy on search results` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-017 — تأیید policy on export
- اقدام: مسئول بازبینی باید `تأیید policy on export` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-018 — تأیید policy on attachment download
- اقدام: مسئول بازبینی باید `تأیید policy on attachment download` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-019 — تأیید audit event
- اقدام: مسئول بازبینی باید `تأیید audit event` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-020 — تأیید event does not leak secrets
- اقدام: مسئول بازبینی باید `تأیید event does not leak secrets` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-021 — تأیید duplicate submission handling
- اقدام: مسئول بازبینی باید `تأیید duplicate submission handling` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-022 — تأیید idempotency key semantics
- اقدام: مسئول بازبینی باید `تأیید idempotency key semantics` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-023 — تأیید stale update conflict behavior
- اقدام: مسئول بازبینی باید `تأیید stale update conflict behavior` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-024 — تأیید transaction boundaries
- اقدام: مسئول بازبینی باید `تأیید transaction boundaries` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-025 — تأیید unique business constraints
- اقدام: مسئول بازبینی باید `تأیید unique business constraints` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-026 — تأیید foreign-key behavior
- اقدام: مسئول بازبینی باید `تأیید foreign-key behavior` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-027 — تأیید query indexes
- اقدام: مسئول بازبینی باید `تأیید query indexes` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-028 — تأیید migration rollback path
- اقدام: مسئول بازبینی باید `تأیید migration rollback path` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-029 — تأیید migration from prior schema
- اقدام: مسئول بازبینی باید `تأیید migration from prior schema` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-030 — تأیید restore compatibility
- اقدام: مسئول بازبینی باید `تأیید restore compatibility` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-031 — تأیید loading state
- اقدام: مسئول بازبینی باید `تأیید loading state` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-032 — تأیید empty state
- اقدام: مسئول بازبینی باید `تأیید empty state` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-033 — تأیید forbidden state
- اقدام: مسئول بازبینی باید `تأیید forbidden state` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-034 — تأیید not-found state
- اقدام: مسئول بازبینی باید `تأیید not-found state` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-035 — تأیید validation state
- اقدام: مسئول بازبینی باید `تأیید validation state` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-036 — تأیید network timeout state
- اقدام: مسئول بازبینی باید `تأیید network timeout state` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-037 — تأیید retry semantics
- اقدام: مسئول بازبینی باید `تأیید retry semantics` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-038 — تأیید optimistic UI rollback
- اقدام: مسئول بازبینی باید `تأیید optimistic UI rollback` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-039 — تأیید double-click submit
- اقدام: مسئول بازبینی باید `تأیید double-click submit` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-040 — تأیید keyboard focus
- اقدام: مسئول بازبینی باید `تأیید keyboard focus` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-041 — تأیید modal focus trap
- اقدام: مسئول بازبینی باید `تأیید modal focus trap` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-042 — تأیید screen-reader announcement
- اقدام: مسئول بازبینی باید `تأیید screen-reader announcement` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-043 — تأیید color contrast
- اقدام: مسئول بازبینی باید `تأیید color contrast` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-044 — تأیید RTL directionality
- اقدام: مسئول بازبینی باید `تأیید RTL directionality` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-045 — تأیید Jalali date conversion
- اقدام: مسئول بازبینی باید `تأیید Jalali date conversion` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-046 — تأیید timezone boundaries
- اقدام: مسئول بازبینی باید `تأیید timezone boundaries` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-047 — تأیید currency formatting
- اقدام: مسئول بازبینی باید `تأیید currency formatting` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-048 — تأیید narrow mobile view
- اقدام: مسئول بازبینی باید `تأیید narrow mobile view` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-049 — تأیید tablet layout
- اقدام: مسئول بازبینی باید `تأیید tablet layout` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

### REVIEW-050 — تأیید wide desktop layout
- اقدام: مسئول بازبینی باید `تأیید wide desktop layout` را روی diff/اجرای جاری بررسی کند؛ ادعای شفاهی کافی نیست.
- نتیجه مجاز: PASS با لینک مدرک، FAIL با blocker، یا N/A با دلیل و تأیید reviewer.
- در صورت FAIL روی P0/P1، merge/release متوقف می‌شود.

## الگوریتم اولویت‌بندی و مدیریت backlog

### BACKLOG-RULE-001
- هنگام ارزیابی backlog، مورد 001 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-002
- هنگام ارزیابی backlog، مورد 002 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-003
- هنگام ارزیابی backlog، مورد 003 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-004
- هنگام ارزیابی backlog، مورد 004 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-005
- هنگام ارزیابی backlog، مورد 005 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-006
- هنگام ارزیابی backlog، مورد 006 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-007
- هنگام ارزیابی backlog، مورد 007 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-008
- هنگام ارزیابی backlog، مورد 008 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-009
- هنگام ارزیابی backlog، مورد 009 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-010
- هنگام ارزیابی backlog، مورد 010 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-011
- هنگام ارزیابی backlog، مورد 011 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-012
- هنگام ارزیابی backlog، مورد 012 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-013
- هنگام ارزیابی backlog، مورد 013 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-014
- هنگام ارزیابی backlog، مورد 014 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-015
- هنگام ارزیابی backlog، مورد 015 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-016
- هنگام ارزیابی backlog، مورد 016 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-017
- هنگام ارزیابی backlog، مورد 017 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-018
- هنگام ارزیابی backlog، مورد 018 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-019
- هنگام ارزیابی backlog، مورد 019 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

### BACKLOG-RULE-020
- هنگام ارزیابی backlog، مورد 020 را با چهار محور impact کسب‌وکار، احتمال/شدت ریسک، وابستگی، و هزینه تغییر امتیازدهی کن؛ امتیاز نهایی بدون توجیه متنی ملاک کافی نیست.
- اگر دو مورد امتیاز برابر دارند، موردی که ریسک امنیت/داده را کاهش می‌دهد مقدم است.
- تغییر اولویت باید در تاریخچه backlog ثبت شود؛ از دستکاری خاموش ترتیب تسک‌ها خودداری کن.

## قالب ثبت ADR و تصمیم معماری

### ADR-TEMPLATE-01
- عنوان: [یک تصمیم معماری مشخص و قابل ابطال]
- وضعیت: Proposed / Accepted / Superseded / Rejected.
- زمینه: مسئله، محدودیت، حجم/ریسک و نیازهای تجاری چیست؟
- گزینه‌ها: حداقل دو گزینه عملی با هزینه، ریسک، نگهداری و license مقایسه شود.
- تصمیم و پیامد: دلیل انتخاب، بدهی فنی و معیار بازنگری مشخص شود.
- شواهد: benchmark، test result، performance data یا threat model متصل شود.

### ADR-TEMPLATE-02
- عنوان: [یک تصمیم معماری مشخص و قابل ابطال]
- وضعیت: Proposed / Accepted / Superseded / Rejected.
- زمینه: مسئله، محدودیت، حجم/ریسک و نیازهای تجاری چیست؟
- گزینه‌ها: حداقل دو گزینه عملی با هزینه، ریسک، نگهداری و license مقایسه شود.
- تصمیم و پیامد: دلیل انتخاب، بدهی فنی و معیار بازنگری مشخص شود.
- شواهد: benchmark، test result، performance data یا threat model متصل شود.

### ADR-TEMPLATE-03
- عنوان: [یک تصمیم معماری مشخص و قابل ابطال]
- وضعیت: Proposed / Accepted / Superseded / Rejected.
- زمینه: مسئله، محدودیت، حجم/ریسک و نیازهای تجاری چیست؟
- گزینه‌ها: حداقل دو گزینه عملی با هزینه، ریسک، نگهداری و license مقایسه شود.
- تصمیم و پیامد: دلیل انتخاب، بدهی فنی و معیار بازنگری مشخص شود.
- شواهد: benchmark، test result، performance data یا threat model متصل شود.

### ADR-TEMPLATE-04
- عنوان: [یک تصمیم معماری مشخص و قابل ابطال]
- وضعیت: Proposed / Accepted / Superseded / Rejected.
- زمینه: مسئله، محدودیت، حجم/ریسک و نیازهای تجاری چیست؟
- گزینه‌ها: حداقل دو گزینه عملی با هزینه، ریسک، نگهداری و license مقایسه شود.
- تصمیم و پیامد: دلیل انتخاب، بدهی فنی و معیار بازنگری مشخص شود.
- شواهد: benchmark، test result، performance data یا threat model متصل شود.

### ADR-TEMPLATE-05
- عنوان: [یک تصمیم معماری مشخص و قابل ابطال]
- وضعیت: Proposed / Accepted / Superseded / Rejected.
- زمینه: مسئله، محدودیت، حجم/ریسک و نیازهای تجاری چیست؟
- گزینه‌ها: حداقل دو گزینه عملی با هزینه، ریسک، نگهداری و license مقایسه شود.
- تصمیم و پیامد: دلیل انتخاب، بدهی فنی و معیار بازنگری مشخص شود.
- شواهد: benchmark، test result، performance data یا threat model متصل شود.

### ADR-TEMPLATE-06
- عنوان: [یک تصمیم معماری مشخص و قابل ابطال]
- وضعیت: Proposed / Accepted / Superseded / Rejected.
- زمینه: مسئله، محدودیت، حجم/ریسک و نیازهای تجاری چیست؟
- گزینه‌ها: حداقل دو گزینه عملی با هزینه، ریسک، نگهداری و license مقایسه شود.
- تصمیم و پیامد: دلیل انتخاب، بدهی فنی و معیار بازنگری مشخص شود.
- شواهد: benchmark، test result، performance data یا threat model متصل شود.

### ADR-TEMPLATE-07
- عنوان: [یک تصمیم معماری مشخص و قابل ابطال]
- وضعیت: Proposed / Accepted / Superseded / Rejected.
- زمینه: مسئله، محدودیت، حجم/ریسک و نیازهای تجاری چیست؟
- گزینه‌ها: حداقل دو گزینه عملی با هزینه، ریسک، نگهداری و license مقایسه شود.
- تصمیم و پیامد: دلیل انتخاب، بدهی فنی و معیار بازنگری مشخص شود.
- شواهد: benchmark، test result، performance data یا threat model متصل شود.

### ADR-TEMPLATE-08
- عنوان: [یک تصمیم معماری مشخص و قابل ابطال]
- وضعیت: Proposed / Accepted / Superseded / Rejected.
- زمینه: مسئله، محدودیت، حجم/ریسک و نیازهای تجاری چیست؟
- گزینه‌ها: حداقل دو گزینه عملی با هزینه، ریسک، نگهداری و license مقایسه شود.
- تصمیم و پیامد: دلیل انتخاب، بدهی فنی و معیار بازنگری مشخص شود.
- شواهد: benchmark، test result، performance data یا threat model متصل شود.

### ADR-TEMPLATE-09
- عنوان: [یک تصمیم معماری مشخص و قابل ابطال]
- وضعیت: Proposed / Accepted / Superseded / Rejected.
- زمینه: مسئله، محدودیت، حجم/ریسک و نیازهای تجاری چیست؟
- گزینه‌ها: حداقل دو گزینه عملی با هزینه، ریسک، نگهداری و license مقایسه شود.
- تصمیم و پیامد: دلیل انتخاب، بدهی فنی و معیار بازنگری مشخص شود.
- شواهد: benchmark، test result، performance data یا threat model متصل شود.

### ADR-TEMPLATE-10
- عنوان: [یک تصمیم معماری مشخص و قابل ابطال]
- وضعیت: Proposed / Accepted / Superseded / Rejected.
- زمینه: مسئله، محدودیت، حجم/ریسک و نیازهای تجاری چیست؟
- گزینه‌ها: حداقل دو گزینه عملی با هزینه، ریسک، نگهداری و license مقایسه شود.
- تصمیم و پیامد: دلیل انتخاب، بدهی فنی و معیار بازنگری مشخص شود.
- شواهد: benchmark، test result، performance data یا threat model متصل شود.

## سیاست اقتباس منابع و scraping مسئولانه

- SCRAPE-01: ابتدا API رسمی یا داده‌های منتشرشده توسط owner را ترجیح بده؛ HTML scraping تنها با دلیل مستند انجام شود.
- SCRAPE-02: robots.txt، Terms of Service، rate limit و مجوز بازنشر محتوا قبل از هر crawl بررسی شوند.
- SCRAPE-03: هیچ login، CAPTCHA، paywall یا control فنی برای محدودکردن دسترسی دور زده نشود.
- SCRAPE-04: برای research، metadata عمومی repository مانند description، language، license، release cadence و test layout گردآوری شود.
- SCRAPE-05: کد، لوگو، screenshot، متن و داده مشتری محصول مرجع بدون مجوز در محصول بازنشر نشود.
- SCRAPE-06: تمام dependencyهای انتخاب‌شده در SBOM و license inventory ثبت شوند.
- SCRAPE-07: برای AGPL/GPL، الزامات انتشار تغییرات و توزیع/شبکه با counsel بررسی شود؛ legal conclusion از روی نام license حدس زده نشود.
- SCRAPE-08: برای fair-code/source-available مانند n8n، محدودیت تجاری و embed بررسی شود؛ source-available به معنی OSI open source نیست.
- SCRAPE-09: نسخه و تاریخ بررسی benchmark ثبت شود؛ ویژگی‌های cloud/enterprise را به نسخه self-hosted نسبت ندهید.
- SCRAPE-10: نتیجه بنچمارک باید شامل مزیت، tradeoff، قابلیت اقتباس و اقدام CRM باشد؛ فهرست نام repository به‌تنهایی خروجی نیست.

## ضمیمه نهایی: دفتر ثبت شواهد و تصمیم‌های قابل ردیابی
این ضمیمه برای هر PR، feature، route، migration و release یک رکورد مستقل فراهم می‌کند؛ آن را با شواهد واقعی پر کنید و موارد نمونه را انجام‌شده تلقی نکنید.
### EV-0001 — Evidence record / کد
- موضوع: ثبت فایل‌های تغییرکرده، محدوده diff و ارتباط آن با تسک.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0002 — Evidence record / API
- موضوع: ثبت endpointها، قرارداد request/response و تغییرات OpenAPI.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0003 — Evidence record / داده
- موضوع: ثبت migration، constraints، index و نتیجه بررسی query plan.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0004 — Evidence record / امنیت
- موضوع: ثبت threat، abuse case، permission tests و نتیجه scanner.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0005 — Evidence record / UX
- موضوع: ثبت route، stateها، viewportها و screenshot بدون داده واقعی.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0006 — Evidence record / تست
- موضوع: ثبت command واقعی، exit code، تعداد تست و هر مورد skipped.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0007 — Evidence record / استقرار
- موضوع: ثبت artifact SHA، نسخه schema، rollback و approver.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0008 — Evidence record / عملیات
- موضوع: ثبت metric، alert، dashboard و runbook مرتبط.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0009 — Evidence record / مستندات
- موضوع: ثبت docs/ADR/README که به‌روزرسانی شده و دلیل آن.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0010 — Evidence record / ریسک
- موضوع: ثبت ریسک باقی‌مانده، owner، موعد و تصمیم قبول/رفع.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0011 — Evidence record / کد
- موضوع: ثبت فایل‌های تغییرکرده، محدوده diff و ارتباط آن با تسک.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0012 — Evidence record / API
- موضوع: ثبت endpointها، قرارداد request/response و تغییرات OpenAPI.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0013 — Evidence record / داده
- موضوع: ثبت migration، constraints، index و نتیجه بررسی query plan.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0014 — Evidence record / امنیت
- موضوع: ثبت threat، abuse case، permission tests و نتیجه scanner.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0015 — Evidence record / UX
- موضوع: ثبت route، stateها، viewportها و screenshot بدون داده واقعی.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0016 — Evidence record / تست
- موضوع: ثبت command واقعی، exit code، تعداد تست و هر مورد skipped.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0017 — Evidence record / استقرار
- موضوع: ثبت artifact SHA، نسخه schema، rollback و approver.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0018 — Evidence record / عملیات
- موضوع: ثبت metric، alert، dashboard و runbook مرتبط.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0019 — Evidence record / مستندات
- موضوع: ثبت docs/ADR/README که به‌روزرسانی شده و دلیل آن.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0020 — Evidence record / ریسک
- موضوع: ثبت ریسک باقی‌مانده، owner، موعد و تصمیم قبول/رفع.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0021 — Evidence record / کد
- موضوع: ثبت فایل‌های تغییرکرده، محدوده diff و ارتباط آن با تسک.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0022 — Evidence record / API
- موضوع: ثبت endpointها، قرارداد request/response و تغییرات OpenAPI.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0023 — Evidence record / داده
- موضوع: ثبت migration، constraints، index و نتیجه بررسی query plan.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0024 — Evidence record / امنیت
- موضوع: ثبت threat، abuse case، permission tests و نتیجه scanner.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0025 — Evidence record / UX
- موضوع: ثبت route، stateها، viewportها و screenshot بدون داده واقعی.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0026 — Evidence record / تست
- موضوع: ثبت command واقعی، exit code، تعداد تست و هر مورد skipped.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0027 — Evidence record / استقرار
- موضوع: ثبت artifact SHA، نسخه schema، rollback و approver.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0028 — Evidence record / عملیات
- موضوع: ثبت metric، alert، dashboard و runbook مرتبط.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0029 — Evidence record / مستندات
- موضوع: ثبت docs/ADR/README که به‌روزرسانی شده و دلیل آن.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0030 — Evidence record / ریسک
- موضوع: ثبت ریسک باقی‌مانده، owner، موعد و تصمیم قبول/رفع.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0031 — Evidence record / کد
- موضوع: ثبت فایل‌های تغییرکرده، محدوده diff و ارتباط آن با تسک.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0032 — Evidence record / API
- موضوع: ثبت endpointها، قرارداد request/response و تغییرات OpenAPI.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0033 — Evidence record / داده
- موضوع: ثبت migration، constraints، index و نتیجه بررسی query plan.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0034 — Evidence record / امنیت
- موضوع: ثبت threat، abuse case، permission tests و نتیجه scanner.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0035 — Evidence record / UX
- موضوع: ثبت route، stateها، viewportها و screenshot بدون داده واقعی.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0036 — Evidence record / تست
- موضوع: ثبت command واقعی، exit code، تعداد تست و هر مورد skipped.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0037 — Evidence record / استقرار
- موضوع: ثبت artifact SHA، نسخه schema، rollback و approver.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0038 — Evidence record / عملیات
- موضوع: ثبت metric، alert، dashboard و runbook مرتبط.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0039 — Evidence record / مستندات
- موضوع: ثبت docs/ADR/README که به‌روزرسانی شده و دلیل آن.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0040 — Evidence record / ریسک
- موضوع: ثبت ریسک باقی‌مانده، owner، موعد و تصمیم قبول/رفع.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0041 — Evidence record / کد
- موضوع: ثبت فایل‌های تغییرکرده، محدوده diff و ارتباط آن با تسک.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0042 — Evidence record / API
- موضوع: ثبت endpointها، قرارداد request/response و تغییرات OpenAPI.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0043 — Evidence record / داده
- موضوع: ثبت migration، constraints، index و نتیجه بررسی query plan.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0044 — Evidence record / امنیت
- موضوع: ثبت threat، abuse case، permission tests و نتیجه scanner.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0045 — Evidence record / UX
- موضوع: ثبت route، stateها، viewportها و screenshot بدون داده واقعی.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0046 — Evidence record / تست
- موضوع: ثبت command واقعی، exit code، تعداد تست و هر مورد skipped.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0047 — Evidence record / استقرار
- موضوع: ثبت artifact SHA، نسخه schema، rollback و approver.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0048 — Evidence record / عملیات
- موضوع: ثبت metric، alert، dashboard و runbook مرتبط.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0049 — Evidence record / مستندات
- موضوع: ثبت docs/ADR/README که به‌روزرسانی شده و دلیل آن.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0050 — Evidence record / ریسک
- موضوع: ثبت ریسک باقی‌مانده، owner، موعد و تصمیم قبول/رفع.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0051 — Evidence record / کد
- موضوع: ثبت فایل‌های تغییرکرده، محدوده diff و ارتباط آن با تسک.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0052 — Evidence record / API
- موضوع: ثبت endpointها، قرارداد request/response و تغییرات OpenAPI.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0053 — Evidence record / داده
- موضوع: ثبت migration، constraints، index و نتیجه بررسی query plan.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0054 — Evidence record / امنیت
- موضوع: ثبت threat، abuse case، permission tests و نتیجه scanner.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0055 — Evidence record / UX
- موضوع: ثبت route، stateها، viewportها و screenshot بدون داده واقعی.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0056 — Evidence record / تست
- موضوع: ثبت command واقعی، exit code، تعداد تست و هر مورد skipped.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0057 — Evidence record / استقرار
- موضوع: ثبت artifact SHA، نسخه schema، rollback و approver.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0058 — Evidence record / عملیات
- موضوع: ثبت metric، alert، dashboard و runbook مرتبط.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0059 — Evidence record / مستندات
- موضوع: ثبت docs/ADR/README که به‌روزرسانی شده و دلیل آن.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0060 — Evidence record / ریسک
- موضوع: ثبت ریسک باقی‌مانده، owner، موعد و تصمیم قبول/رفع.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0061 — Evidence record / کد
- موضوع: ثبت فایل‌های تغییرکرده، محدوده diff و ارتباط آن با تسک.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0062 — Evidence record / API
- موضوع: ثبت endpointها، قرارداد request/response و تغییرات OpenAPI.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0063 — Evidence record / داده
- موضوع: ثبت migration، constraints، index و نتیجه بررسی query plan.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0064 — Evidence record / امنیت
- موضوع: ثبت threat، abuse case، permission tests و نتیجه scanner.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0065 — Evidence record / UX
- موضوع: ثبت route، stateها، viewportها و screenshot بدون داده واقعی.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0066 — Evidence record / تست
- موضوع: ثبت command واقعی، exit code، تعداد تست و هر مورد skipped.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0067 — Evidence record / استقرار
- موضوع: ثبت artifact SHA، نسخه schema، rollback و approver.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0068 — Evidence record / عملیات
- موضوع: ثبت metric، alert، dashboard و runbook مرتبط.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0069 — Evidence record / مستندات
- موضوع: ثبت docs/ADR/README که به‌روزرسانی شده و دلیل آن.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0070 — Evidence record / ریسک
- موضوع: ثبت ریسک باقی‌مانده، owner، موعد و تصمیم قبول/رفع.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0071 — Evidence record / کد
- موضوع: ثبت فایل‌های تغییرکرده، محدوده diff و ارتباط آن با تسک.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0072 — Evidence record / API
- موضوع: ثبت endpointها، قرارداد request/response و تغییرات OpenAPI.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0073 — Evidence record / داده
- موضوع: ثبت migration، constraints، index و نتیجه بررسی query plan.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0074 — Evidence record / امنیت
- موضوع: ثبت threat، abuse case، permission tests و نتیجه scanner.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0075 — Evidence record / UX
- موضوع: ثبت route، stateها، viewportها و screenshot بدون داده واقعی.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0076 — Evidence record / تست
- موضوع: ثبت command واقعی، exit code، تعداد تست و هر مورد skipped.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0077 — Evidence record / استقرار
- موضوع: ثبت artifact SHA، نسخه schema، rollback و approver.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0078 — Evidence record / عملیات
- موضوع: ثبت metric، alert، dashboard و runbook مرتبط.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0079 — Evidence record / مستندات
- موضوع: ثبت docs/ADR/README که به‌روزرسانی شده و دلیل آن.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0080 — Evidence record / ریسک
- موضوع: ثبت ریسک باقی‌مانده، owner، موعد و تصمیم قبول/رفع.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0081 — Evidence record / کد
- موضوع: ثبت فایل‌های تغییرکرده، محدوده diff و ارتباط آن با تسک.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0082 — Evidence record / API
- موضوع: ثبت endpointها، قرارداد request/response و تغییرات OpenAPI.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0083 — Evidence record / داده
- موضوع: ثبت migration، constraints، index و نتیجه بررسی query plan.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0084 — Evidence record / امنیت
- موضوع: ثبت threat، abuse case، permission tests و نتیجه scanner.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0085 — Evidence record / UX
- موضوع: ثبت route، stateها، viewportها و screenshot بدون داده واقعی.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0086 — Evidence record / تست
- موضوع: ثبت command واقعی، exit code، تعداد تست و هر مورد skipped.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0087 — Evidence record / استقرار
- موضوع: ثبت artifact SHA، نسخه schema، rollback و approver.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0088 — Evidence record / عملیات
- موضوع: ثبت metric، alert، dashboard و runbook مرتبط.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0089 — Evidence record / مستندات
- موضوع: ثبت docs/ADR/README که به‌روزرسانی شده و دلیل آن.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0090 — Evidence record / ریسک
- موضوع: ثبت ریسک باقی‌مانده، owner، موعد و تصمیم قبول/رفع.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0091 — Evidence record / کد
- موضوع: ثبت فایل‌های تغییرکرده، محدوده diff و ارتباط آن با تسک.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0092 — Evidence record / API
- موضوع: ثبت endpointها، قرارداد request/response و تغییرات OpenAPI.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0093 — Evidence record / داده
- موضوع: ثبت migration، constraints، index و نتیجه بررسی query plan.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0094 — Evidence record / امنیت
- موضوع: ثبت threat، abuse case، permission tests و نتیجه scanner.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0095 — Evidence record / UX
- موضوع: ثبت route، stateها، viewportها و screenshot بدون داده واقعی.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0096 — Evidence record / تست
- موضوع: ثبت command واقعی، exit code، تعداد تست و هر مورد skipped.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0097 — Evidence record / استقرار
- موضوع: ثبت artifact SHA، نسخه schema، rollback و approver.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0098 — Evidence record / عملیات
- موضوع: ثبت metric، alert، dashboard و runbook مرتبط.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0099 — Evidence record / مستندات
- موضوع: ثبت docs/ADR/README که به‌روزرسانی شده و دلیل آن.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0100 — Evidence record / ریسک
- موضوع: ثبت ریسک باقی‌مانده، owner، موعد و تصمیم قبول/رفع.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0101 — Evidence record / کد
- موضوع: ثبت فایل‌های تغییرکرده، محدوده diff و ارتباط آن با تسک.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0102 — Evidence record / API
- موضوع: ثبت endpointها، قرارداد request/response و تغییرات OpenAPI.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0103 — Evidence record / داده
- موضوع: ثبت migration، constraints، index و نتیجه بررسی query plan.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0104 — Evidence record / امنیت
- موضوع: ثبت threat، abuse case، permission tests و نتیجه scanner.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0105 — Evidence record / UX
- موضوع: ثبت route، stateها، viewportها و screenshot بدون داده واقعی.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0106 — Evidence record / تست
- موضوع: ثبت command واقعی، exit code، تعداد تست و هر مورد skipped.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0107 — Evidence record / استقرار
- موضوع: ثبت artifact SHA، نسخه schema، rollback و approver.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0108 — Evidence record / عملیات
- موضوع: ثبت metric، alert، dashboard و runbook مرتبط.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0109 — Evidence record / مستندات
- موضوع: ثبت docs/ADR/README که به‌روزرسانی شده و دلیل آن.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0110 — Evidence record / ریسک
- موضوع: ثبت ریسک باقی‌مانده، owner، موعد و تصمیم قبول/رفع.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0111 — Evidence record / کد
- موضوع: ثبت فایل‌های تغییرکرده، محدوده diff و ارتباط آن با تسک.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0112 — Evidence record / API
- موضوع: ثبت endpointها، قرارداد request/response و تغییرات OpenAPI.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0113 — Evidence record / داده
- موضوع: ثبت migration، constraints، index و نتیجه بررسی query plan.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0114 — Evidence record / امنیت
- موضوع: ثبت threat، abuse case، permission tests و نتیجه scanner.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0115 — Evidence record / UX
- موضوع: ثبت route، stateها، viewportها و screenshot بدون داده واقعی.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0116 — Evidence record / تست
- موضوع: ثبت command واقعی، exit code، تعداد تست و هر مورد skipped.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0117 — Evidence record / استقرار
- موضوع: ثبت artifact SHA، نسخه schema، rollback و approver.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0118 — Evidence record / عملیات
- موضوع: ثبت metric، alert، dashboard و runbook مرتبط.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0119 — Evidence record / مستندات
- موضوع: ثبت docs/ADR/README که به‌روزرسانی شده و دلیل آن.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0120 — Evidence record / ریسک
- موضوع: ثبت ریسک باقی‌مانده، owner، موعد و تصمیم قبول/رفع.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0121 — Evidence record / کد
- موضوع: ثبت فایل‌های تغییرکرده، محدوده diff و ارتباط آن با تسک.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0122 — Evidence record / API
- موضوع: ثبت endpointها، قرارداد request/response و تغییرات OpenAPI.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0123 — Evidence record / داده
- موضوع: ثبت migration، constraints، index و نتیجه بررسی query plan.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
### EV-0124 — Evidence record / امنیت
- موضوع: ثبت threat، abuse case، permission tests و نتیجه scanner.
- مرجع تسک/PR: [شناسه واقعی را در زمان اجرا وارد کنید؛ خالی‌گذاشتن این فیلد مانع DONE است.]
- commit SHA: [SHA واقعی؛ SHA حدسی یا مربوط به اجرای قدیمی پذیرفته نیست.]
- CI run: [URL اجرای واقعی شامل تست و build؛ فقط badge سبز کافی نیست.]
- test artifacts: [گزارش unit/integration/E2E/security یا دلیل N/A با تأیید reviewer.]
- reviewer: [نام/شناسه مسئول مستقل از نویسنده.]
- outcome: TODO / PASS / FAIL / BLOCKED؛ وضعیت باید با evidence سازگار باشد.
- EV-INDEX-0125-01: ثبت نتیجه و مدرک واقعی برای تسک/ریسک مربوطه؛ شناسه، commit، تست و reviewer باید در زمان اجرا تکمیل شود.
- EV-INDEX-0125-02: ثبت نتیجه و مدرک واقعی برای تسک/ریسک مربوطه؛ شناسه، commit، تست و reviewer باید در زمان اجرا تکمیل شود.
