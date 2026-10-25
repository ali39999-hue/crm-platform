# بسته اجرایی طراحی و ارتقای CRM سازمانی — نسخه 1.0

**مخزن مقصد:** https://github.com/ali39999-hue/crm-platform  
**تاریخ تهیه:** 2026-10-24  
**وضعیت:** بسته محلی مکمل؛ هنوز به مخزن اصلی push نشده است.

## این بسته چیست؟

این مجموعه، نقشه اجرایی تبدیل اسکلت CRM به محیط کاری سازمانی یکپارچه است؛ با تمرکز بر UI/UX واقعی و قابل پیاده‌سازی، نه صرفاً رنگ و فاصله. محصول هدف، CRM فروش، مدیریت کار/پروژه، پشتیبانی مشتری و پورتال مشتری را در تجربه، داده، مجوزها و تست به هم وصل می‌کند.

مخزن فعلی خودش `ROADMAP.fa.md`، سندهای `docs/00..12`، سند UX و فهرست ۵۰ منبع دارد. این بسته قرار نیست تکرار همان‌ها باشد: route inventory، UX هر دامنه، قرارداد حالت‌های صفحه، مسیر ادغام، بنچمارک، بک‌لاگ قابل import و collector فراداده عمومی GitHub را اضافه می‌کند. پیش از ادغام، اختلاف با اسناد مرجع ثبت شود.

## نقطه شروع

1. `00-MASTER-PLAN.fa.md` — تعریف پایان کار و ترتیب اجرا.
2. `01-MERGE-GUIDE.fa.md` — نگاشت به فایل‌های فعلی.
3. `execution/01-phase-roadmap.fa.md` — فازها و دروازه‌های عبور.
4. `ux/01-page-route-inventory.csv` — نقشه صفحات هدف؛ نه ادعای وجود فعلی.
5. `execution/02-backlog.csv` — بک‌لاگ دارای ID، dependency و معیار پذیرش.
6. `execution/03-coding-agent-prompts.fa.md` — پرامپت اجرای Agentها.
7. `quality/04-release-gates.fa.md` — معیار پایان هر فاز.

## ساختار

- `product/`: محصول، پرسونا، معماری اطلاعات، سفر کاربر.
- `ux/`: routeها، طراحی سیستم، رفتار همه دامنه‌ها، RTL و موبایل.
- `engineering/`: frontend، API، backend، tenancy، authorization و events.
- `quality/`: تست، visual QA، performance و release gates.
- `research/`: مراجع، پروتکل benchmark و مجوز.
- `execution/`: roadmap، backlog و promptها.
- `scripts/`: ابزار جمع‌آوری metadata عمومی GitHub با API رسمی.

## مبنای واقعیت

README فارسی مخزن تصریح می‌کند پروژه هنوز محصول عملیاتی کامل نیست و مواردی مانند auth واقعی، CRUD کسب‌وکار، اتصال Prisma، مجوز سازمانی، notification، job queue و sync موبایل نیاز به پیاده‌سازی دارند. هر قابلیت در این بسته باید با کد، تست و شواهد اجرا تأیید شود؛ وجود سند یا کامپوننت به معنی آماده بودن نیست.

- Repo: https://github.com/ali39999-hue/crm-platform
- README: https://github.com/ali39999-hue/crm-platform/blob/main/README.fa.md
- Roadmap: https://github.com/ali39999-hue/crm-platform/blob/main/ROADMAP.fa.md
- File index: https://github.com/ali39999-hue/crm-platform/blob/main/FILE_INDEX.fa.md

هیچ commit، push، deploy یا تغییر production انجام نشده. این فایل‌ها برای ادغام کنترل‌شده و PR مستنداتی مستقل آماده شده‌اند.
