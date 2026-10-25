# برنامه مادر: از اسکلت تا CRM سازمانی قابل اتکا

## مقصد محصول

یک محیط کاری یکپارچه که مشتری/شرکت، فرصت فروش، activity، تیکت، task، پروژه، مستند، اعلان و گزارش را به هم متصل می‌کند. هدف صرفاً «ظاهر شبیه Jira» نیست؛ معیار بلوغ، ناوبری قابل پیش‌بینی، list/detail/form منسجم، فیلتر و saved view، عملیات گروهی، keyboard shortcuts، workflow قابل توضیح، permission سازمانی، persistence واقعی و تست end-to-end است.

## اصول غیرقابل مذاکره

1. **شواهد به‌جای فرض:** وضعیت هر قابلیت `Not assessed`, `Designed`, `Implemented`, `Tested`, `Production verified` باشد.
2. **یک design system:** tokens، typography، focus، dialog، form، table، empty state و responsive مشترک.
3. **یک قرارداد داده:** عملیات تجاری فقط local state نباشد؛ به API واقعی وصل و پس از پاسخ تأیید شود.
4. **مجوز در سرور:** مخفی‌کردن دکمه مجوز نیست. تمام read/write/search/export/attachment/bulk action باید tenant + capability را enforce کند.
5. **تمام حالت‌های صفحه:** loading، empty، error، forbidden، stale، partial، saving، retry و conflict جزو تعریف صفحه‌اند.
6. **Progressive complexity:** کاربر تازه‌وارد مسیر واضح؛ power-user فیلتر، saved views، command palette و میانبر.
7. **RTL پایه است:** logical CSS، ترتیب focus، تاریخ، اعداد، نمودارها و متن مختلط مستقل تست شوند.
8. **عدم clone کور:** نمونه‌های متن‌باز برای یادگیری؛ کد فقط بعد از بررسی license، security، dependency و تناسب.
9. **بدون demo success در production:** seed/mock در محیط واقعی جای رفتار واقعی را نگیرد.

## تعریف تمام‌شدن

- مسیرهای P0 از browser تا API و DB آزمایش شده‌اند.
- mutationهای اصلی صرفاً state محلی را تغییر نمی‌دهند.
- tenant isolation و permission matrix تست مثبت و منفی دارد.
- تمام routeهای فعال state matrix را پوشش می‌دهند.
- visual regression در viewportهای مرجع review شده است.
- خطای API به پیام مفید و retry امن تبدیل می‌شود.
- PR دارای before/after screenshot، CI run، تست، route و known gaps است.
- release gates سند `quality/04-release-gates.fa.md` پاس شده‌اند.

## ترتیب استراتژیک

1. baseline، inventory route، وضعیت CI و screenshotها.
2. auth/session، tenant context، authorization و audit.
3. design tokens، shell و primitives.
4. table، form، detail view و search.
5. vertical slice کامل Accounts/Contacts → Lead/Deal → Activity/Task → Timeline.
6. Projects/Tasks و Support/Tickets با الگوهای مشترک.
7. saved views، comments، notifications، realtime و automation.
8. analytics، portal و mobile.
9. performance، resilience، accessibility، localization و release hardening.

## بنچمارک پیشنهادی

- **Twenty / Frappe CRM / EspoCRM:** رکوردهای CRM، list/detail، pipeline و activity.
- **Plane / OpenProject / Taiga:** task/project، board، cycle و roadmap.
- **Chatwoot:** shared inbox و customer support.
- **shadcn/ui / Radix / Storybook / TanStack:** مهندسی اجزا، نه هویت بصری آماده.
- **Playwright / axe-core / Vitest:** آزمون قابل تکرار.

منابع فقط benchmark هستند، نه الزام نصب هم‌زمان. هر library باید با stack، bundle size، accessibility، license و maintenance سنجیده شود.

## مدل evidence

برای هر issue: `before.png`, `after.png`, route, viewport, role, seed scenario, test command/result, commit SHA و known gaps. شواهد backend باید request/response پاک‌سازی‌شده و state قبل/بعد را داشته باشد. هیچ secret یا PII در screenshot/log نباشد.
