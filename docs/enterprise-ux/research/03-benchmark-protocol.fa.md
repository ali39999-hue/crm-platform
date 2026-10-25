# پروتکل Benchmark و جمع‌آوری منبع

## سؤال benchmark
برای هر محصول، یک مسیر end-to-end ثابت را ثبت کن نه فقط screenshot صفحه اصلی: ورود → search → بازکردن record → تغییر داده → فعالیت/comment → error/recovery → mobile/responsive → permission denial.

## پروتکل
1. نام محصول، URL، تاریخ/زمان، نسخه/tag/commit در دسترس و شرایط مشاهده را ثبت کن.
2. بررسی public/demo مجاز؛ هرگز login/session/rate-limit/robots/access control را دور نزن.
3. Screenshot/notes فقط به اندازه لازم و برای تحلیل داخلی؛ از asset برند و متن/کد اختصاصی بدون مجوز استفاده مجدد نکن.
4. الگوی UX را انتزاع کن (مثلاً command palette یا side detail panel)، سپس نسخه مستقل طراحی کن.
5. هر الگو یکی از Adopt / Adapt / Reject بگیرد؛ دلیل، مزیت، tradeoff، خطر accessibility و هزینه اجرا ثبت شود.
6. آخرین وضعیت license و repository activity را در زمان واقعی اجرا با API/صفحه رسمی بررسی کن.
7. هر claim در مورد هدف پروژه را به فایل/commit/route و evidence وصل کن؛ benchmark محصول خارجی هرگز evidence implementation داخلی نیست.

## برای CRMهای بالغ
- List/record relationship، saved views، pipeline stages، activity timeline، collaboration/comments، permissions, audit, import/export, custom fields, duplicate merge.
## برای project tools
- backlog/board/cycle/roadmap، keyboard interaction، bulk actions، filter/search، change history، cross-linking.
## برای support tools
- queue, assignment, SLA, internal note vs public reply، macros, inbox search, collision handling, customer portal.

## Scraping policy
HTML scraping فقط در صورت مجاز بودن طبق ToS/robots، نرخ محافظه‌کارانه و بدون ورود به بخش محدود. برای repository metadata ترجیح با GitHub REST API. هیچ credential/cookie برداشته‌شده از مرورگر استفاده نشود. اگر دسترسی نامشخص است، API رسمی یا داده دستی را انتخاب کن.
